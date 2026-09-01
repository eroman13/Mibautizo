/**
 * Controlador para crear preferencias de pago en Mercado Pago
 * POST /api/crear-preferencia
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { preferenceClient, COMMISSION_RATE } from '../lib/mercadopago';
import { calculatePayment } from '../utils/currency';

interface CrearPreferenciaBody {
  regalos: Array<{
    id: number;
    cantidad?: number; // Para regalos colaborativos
    paraGemela?: 'gemela1' | 'gemela2'; // Para quién es el regalo
  }>;
  invitado: {
    nombre: string;
    email?: string;
    dedicatoria?: string;
  };
  montoLibre?: number; // Para el regalo de "aporte libre"
}

export async function crearPreferencia(req: Request, res: Response) {
  try {
    const body: CrearPreferenciaBody = req.body;

    // Validaciones básicas
    if (!body.regalos || body.regalos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Debes seleccionar al menos un regalo',
      });
    }

    if (!body.invitado?.nombre) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del invitado es obligatorio',
      });
    }

    // Obtener configuración del evento (modo de comisión)
    const evento = await prisma.event.findFirst();
    if (!evento) {
      return res.status(500).json({
        success: false,
        error: 'Evento no configurado',
      });
    }

    const modoComision = evento.modoComision as 'A' | 'B';

    // Validar y calcular el total de los regalos
    let totalBase = 0;
    const contributionsData = [];

    for (const regaloReq of body.regalos) {
      // Obtener el regalo de la base de datos (VALIDACIÓN DE SEGURIDAD)
      const regalo = await prisma.gift.findUnique({
        where: { id: regaloReq.id },
      });

      if (!regalo) {
        return res.status(404).json({
          success: false,
          error: `Regalo con ID ${regaloReq.id} no encontrado`,
        });
      }

      // Validar que el regalo esté disponible (excepto si es colaborativo)
      if (regalo.estado === 'pagado' && !regalo.permiteColaborativo) {
        return res.status(400).json({
          success: false,
          error: `El regalo "${regalo.nombre}" ya fue regalado`,
        });
      }

      // Determinar el monto del regalo
      let montoRegalo = regalo.precioCLP;

      // Caso especial: Aporte libre
      if (regalo.precioCLP === 0) {
        if (!body.montoLibre || body.montoLibre < 1000) {
          return res.status(400).json({
            success: false,
            error: 'Para el aporte libre, debes ingresar un monto mínimo de $1.000',
          });
        }
        montoRegalo = body.montoLibre;
      }

      totalBase += montoRegalo;

      // Preparar datos para la contribución
      contributionsData.push({
        giftId: regalo.id,
        baseAmount: montoRegalo,
        paraGemela: regaloReq.paraGemela || 'gemela1', // Por defecto gemela1
      });
    }

    // Calcular el monto final según el modo de comisión
    const payment = calculatePayment(totalBase, COMMISSION_RATE, modoComision);

    // Crear items para Mercado Pago
    // Agrupar por regalo para evitar duplicados
    const regalosAgrupados = new Map<number, { name: string; cantidad: number }>();
    
    for (const contribution of contributionsData) {
      const regalo = await prisma.gift.findUnique({ where: { id: contribution.giftId } });
      if (regalo) {
        const key = regalo.id;
        if (!regalosAgrupados.has(key)) {
          regalosAgrupados.set(key, {
            name: regalo.nombre,
            cantidad: 0
          });
        }
        const item = regalosAgrupados.get(key)!;
        item.cantidad += 1;
      }
    }

    const items: any[] = Array.from(regalosAgrupados.values()).map(item => ({
      title: item.name,
      description: item.cantidad > 1 ? `${item.cantidad} unidades` : undefined,
      quantity: item.cantidad,
      unit_price: Math.round(totalBase / contributionsData.length),
      currency_id: 'CLP',
    }));

    // Si tenemos items, usarlos; si no, usar un item genérico
    const finalItems = items.length > 0 ? items : [
      {
        title: `Bautizo de ${evento.nombreGemela1} y ${evento.nombreGemela2}`,
        description: `${body.regalos.length} regalo${body.regalos.length !== 1 ? 's' : ''}`,
        quantity: 1,
        unit_price: payment.totalCharge,
        currency_id: 'CLP',
      }
    ];

    // URLs del frontend (desde .env)
    // En producción, si FRONTEND_URL apunta a localhost o no está configurada,
    // usamos la URL real de Vercel para que el botón "volver a la tienda"
    // de Mercado Pago redirija correctamente.
    const isProduction = process.env.NODE_ENV === 'production';
    let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

    if (isProduction && (frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1'))) {
      frontendUrl = 'https://mibautizo-frontend-six.vercel.app';
    }

    console.log('📋 Creando preferencia en Mercado Pago...');
    console.log('  - Monto total: $' + payment.totalCharge);
    console.log('  - Items:', body.regalos.length);
    console.log('  - URLs configuradas:', { frontendUrl, backendUrl });

    // Crear la preferencia en Mercado Pago
    let preference;
    try {
      preference = await preferenceClient.create({
        body: {
          items: finalItems,
          payer: {
            name: body.invitado.nombre,
            email: body.invitado.email || 'invitado@ejemplo.com',
          },
          back_urls: {
            success: `${frontendUrl}/pago-exitoso`,
            failure: `${frontendUrl}/pago-fallido`,
            pending: `${frontendUrl}/pago-pendiente`,
          },
          auto_return: 'all',
          notification_url: `${backendUrl}/api/webhook`,
          statement_descriptor: 'BAUTIZO GEMELAS',
          external_reference: JSON.stringify({
            invitado: body.invitado,
            regalos: contributionsData,
            modoComision,
            payment,
          }),
        },
      });
    } catch (mpError) {
      console.error('❌ Error en Mercado Pago:', mpError);
      throw mpError;
    }

    console.log('✅ Preferencia creada:', preference.id);
    console.log(`💰 Monto base: $${totalBase}`);
    console.log(`📊 Modo comisión: ${modoComision}`);
    console.log(`💳 Total a cobrar: $${payment.totalCharge}`);
    console.log(`💵 Neto a recibir: $${payment.netAmount}`);

    // Retornar la URL de pago al frontend
    res.json({
      success: true,
      data: {
        preferenceId: preference.id,
        initPoint: preference.init_point,
        desglose: {
          montoBase: totalBase,
          comision: payment.commission,
          total: payment.totalCharge,
          neto: payment.netAmount,
          modoComision,
        },
      },
    });
  } catch (error) {
    console.error('❌ Error al crear preferencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la preferencia de pago',
      details: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}
