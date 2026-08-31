/**
 * Controlador para recibir webhooks de Mercado Pago
 * POST /api/webhook
 * 
 * Este endpoint es llamado por Mercado Pago cuando cambia el estado de un pago
 * Debe ser idempotente (procesar el mismo webhook múltiples veces no debe duplicar registros)
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { paymentClient } from '../lib/mercadopago';
import { enviarConfirmacionRegalo, enviarNotificacionAlAdmin } from '../lib/email';

export async function webhook(req: Request, res: Response) {
  try {
    // Mercado Pago envía el tipo de notificación en el query
    const { type, data } = req.body;

    console.log('📨 Webhook recibido:', { type, data });

    // Solo procesar notificaciones de pagos
    if (type !== 'payment') {
      console.log('⏭️ Tipo de notificación ignorado:', type);
      return res.sendStatus(200);
    }

    // Obtener el ID del pago
    const paymentId = data?.id;
    if (!paymentId) {
      console.log('⚠️ Webhook sin ID de pago');
      return res.sendStatus(400);
    }

    // SEGURIDAD: Consultar el pago directamente a la API de Mercado Pago
    // No confiar en los datos del webhook, siempre verificar
    const payment = await paymentClient.get({ id: paymentId });

    console.log('💳 Pago consultado:', {
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      transaction_amount: payment.transaction_amount,
    });

    // Verificar si ya procesamos este pago (idempotencia)
    const existingContribution = await prisma.contribution.findUnique({
      where: { mpPaymentId: paymentId.toString() },
    });

    if (existingContribution) {
      console.log('✅ Pago ya procesado anteriormente, ignorando webhook');
      return res.sendStatus(200);
    }

    // Solo procesar pagos aprobados
    if (payment.status !== 'approved') {
      console.log(`⏳ Pago en estado: ${payment.status}, no se procesa aún`);
      return res.sendStatus(200);
    }

    // Parsear la referencia externa (datos del regalo y el invitado)
    const externalReference = payment.external_reference;
    if (!externalReference) {
      console.log('⚠️ Pago sin external_reference');
      return res.sendStatus(200);
    }

    const referenceData = JSON.parse(externalReference);
    const { invitado, regalos, payment: paymentCalc } = referenceData;

    console.log('📝 Procesando contribución:', {
      invitado: invitado.nombre,
      cantidadRegalos: regalos.length,
      montoTotal: payment.transaction_amount,
    });

    // Crear las contribuciones en la base de datos
    for (const regalo of regalos) {
      const giftId = regalo.giftId;
      const baseAmount = regalo.baseAmount;

      // Calcular proporciones si hay múltiples regalos
      const proportion = baseAmount / paymentCalc.totalCharge;
      const montoBruto = Math.ceil(payment.transaction_amount! * proportion);
      const comision = Math.ceil(paymentCalc.commission * proportion);
      const montoNeto = montoBruto - comision;

      // Crear la contribución
      await prisma.contribution.create({
        data: {
          giftId: giftId || null,
          montoBrutoCLP: montoBruto,
          comisionCLP: comision,
          montoNetoCLP: montoNeto,
          nombreInvitado: invitado.nombre,
          emailInvitado: invitado.email || null,
          dedicatoria: invitado.dedicatoria || null,
          estadoPago: 'approved',
          mpPaymentId: paymentId.toString(),
        },
      });

      // Actualizar el estado del regalo
      if (giftId) {
        const giftData = await prisma.gift.findUnique({
          where: { id: giftId },
        });

        if (giftData) {
          // Si es colaborativo, sumar al monto recaudado
          if (giftData.permiteColaborativo) {
            await prisma.gift.update({
              where: { id: giftId },
              data: {
                montoRecaudadoCLP: giftData.montoRecaudadoCLP + montoNeto,
                // Si se alcanzó el objetivo, marcar como pagado
                estado:
                  giftData.montoRecaudadoCLP + montoNeto >= giftData.precioCLP
                    ? 'pagado'
                    : 'disponible',
              },
            });
          } else {
            // Si no es colaborativo, marcarlo como pagado directamente
            await prisma.gift.update({
              where: { id: giftId },
              data: {
                estado: 'pagado',
                montoRecaudadoCLP: montoNeto,
              },
            });
          }
        }
      }

      console.log(`✅ Contribución registrada para regalo ID ${giftId}`);
    }

    // ENVÍO DE CORREOS
    // Obtener los detalles de los regalos para el correo
    const regalosConDetalles = await Promise.all(
      regalos.map(async (r: any) => {
        if (r.giftId) {
          const gift = await prisma.gift.findUnique({
            where: { id: r.giftId },
          });
          return {
            nombre: gift?.nombre || 'Aporte libre',
            cantidad: 1,
            precio: r.baseAmount,
          };
        }
        return {
          nombre: 'Aporte libre para las gemelas',
          cantidad: 1,
          precio: r.baseAmount,
        };
      })
    );

    // Enviar correo de confirmación al invitado
    if (invitado.email) {
      await enviarConfirmacionRegalo({
        para: invitado.email,
        nombreInvitado: invitado.nombre,
        regalos: regalosConDetalles,
        totalCLP: Math.ceil(payment.transaction_amount!),
        dedicatoria: invitado.dedicatoria,
      });
    }

    // Enviar notificación al administrador
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@bautizo.local';
    if (adminEmail && adminEmail !== 'admin@bautizo.local') {
      // Solo enviar si se configuró un email real
      await enviarNotificacionAlAdmin({
        para: adminEmail,
        nombreInvitado: invitado.nombre,
        emailInvitado: invitado.email || 'No proporcionado',
        regalos: regalosConDetalles,
        totalCLP: Math.ceil(payment.transaction_amount!),
      });
    }

    console.log('🎉 Webhook procesado exitosamente');
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    // Retornar 200 de todas formas para evitar reintentos innecesarios de MP
    // Los errores se logean pero no se propagan
    res.sendStatus(200);
  }
}
