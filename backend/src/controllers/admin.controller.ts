/**
 * Controladores del panel administrativo
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { COMMISSION_RATE } from '../lib/mercadopago';
import { enviarCorreoPrueba } from '../lib/email';
import { firmarToken } from '../lib/security';

/**
 * Login con usuario y contraseña
 * POST /api/admin/login
 */
export async function adminLogin(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return res.status(401).json({
        success: false,
        error: 'Usuario o contraseña incorrectos',
      });
    }

    const user = await prisma.adminUser.findUnique({
      where: { username: username.trim() },
    });

    // Respuesta genérica (no revelar si el usuario existe) para evitar enumeración
    if (!user || !user.activo) {
      return res.status(401).json({
        success: false,
        error: 'Usuario o contraseña incorrectos',
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Usuario o contraseña incorrectos',
      });
    }

    // Token firmado (HMAC). La sesión expira a las 12 horas.
    const token = firmarToken({ id: user.id, username: user.username });

    console.log(`🔐 Login exitoso: ${user.username}`);
    res.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
}

/**
 * Obtener estadísticas del dashboard
 * GET /api/admin/stats
 */
export async function getStats(req: Request, res: Response) {
  try {
    // Total de contribuciones aprobadas
    const contribuciones = await prisma.contribution.findMany({
      where: { estadoPago: 'approved' },
    });

    const totalBruto = contribuciones.reduce((sum, c) => sum + c.montoBrutoCLP, 0);
    const totalComision = contribuciones.reduce((sum, c) => sum + c.comisionCLP, 0);
    const totalNeto = contribuciones.reduce((sum, c) => sum + c.montoNetoCLP, 0);

    // Cantidad de regalos
    const totalRegalos = await prisma.gift.count();
    const regalosDisponibles = await prisma.gift.count({
      where: { estado: 'disponible' },
    });
    const regalosPagados = await prisma.gift.count({
      where: { estado: 'pagado' },
    });

    // Contribución promedio
    const promedioContribucion = contribuciones.length > 0
      ? Math.round(totalBruto / contribuciones.length)
      : 0;

    res.json({
      success: true,
      data: {
        contribuciones: {
          total: contribuciones.length,
          montoBruto: totalBruto,
          comision: totalComision,
          montoNeto: totalNeto,
          promedio: promedioContribucion,
        },
        regalos: {
          total: totalRegalos,
          disponibles: regalosDisponibles,
          pagados: regalosPagados,
        },
      },
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
  }
}

/**
 * Obtener lista de contribuciones
 * GET /api/admin/contribuciones
 */
export async function getContribuciones(req: Request, res: Response) {
  try {
    const contribuciones = await prisma.contribution.findMany({
      include: {
        gift: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: contribuciones,
    });
  } catch (error) {
    console.error('Error al obtener contribuciones:', error);
    res.status(500).json({ success: false, error: 'Error al obtener contribuciones' });
  }
}

/**
 * Crear un nuevo regalo
 * POST /api/admin/regalos
 */
export async function crearRegalo(req: Request, res: Response) {
  try {
    const { nombre, descripcion, precioCLP, imagenUrl, permiteColaborativo } = req.body;

    // Validaciones
    if (!nombre || !descripcion || precioCLP === undefined || !imagenUrl) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son obligatorios',
      });
    }

    const regalo = await prisma.gift.create({
      data: {
        nombre,
        descripcion,
        precioCLP: parseInt(precioCLP),
        imagenUrl,
        permiteColaborativo: permiteColaborativo || false,
      },
    });

    res.json({
      success: true,
      data: regalo,
    });
  } catch (error) {
    console.error('Error al crear regalo:', error);
    res.status(500).json({ success: false, error: 'Error al crear regalo' });
  }
}

/**
 * Actualizar un regalo
 * PUT /api/admin/regalos/:id
 */
export async function actualizarRegalo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precioCLP, imagenUrl, permiteColaborativo, estado } = req.body;

    const regalo = await prisma.gift.update({
      where: { id: parseInt(String(id)) },
      data: {
        nombre,
        descripcion,
        precioCLP: parseInt(precioCLP),
        imagenUrl,
        permiteColaborativo,
        estado,
      },
    });

    res.json({
      success: true,
      data: regalo,
    });
  } catch (error) {
    console.error('Error al actualizar regalo:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar regalo' });
  }
}

/**
 * Eliminar un regalo
 * DELETE /api/admin/regalos/:id
 */
export async function eliminarRegalo(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Verificar si tiene contribuciones
    const contribuciones = await prisma.contribution.count({
      where: { giftId: parseInt(String(id)) },
    });

    if (contribuciones > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar un regalo que tiene contribuciones',
      });
    }

    await prisma.gift.delete({
      where: { id: parseInt(String(id)) },
    });

    res.json({
      success: true,
      message: 'Regalo eliminado correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar regalo:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar regalo' });
  }
}

/**
 * Crear múltiples regalos de forma masiva
 * POST /api/admin/regalos/bulk
 * Body: { regalos: [{ nombre, descripcion, precioCLP, imagenUrl?, imagenBase64?, permiteColaborativo? }] }
 * La imagen puede venir como URL externa (imagenUrl) o como data URL (imagenBase64).
 */
export async function crearRegalosMasivo(req: Request, res: Response) {
  try {
    const { regalos } = req.body;

    if (!regalos || !Array.isArray(regalos) || regalos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Debes enviar un array de regalos',
      });
    }

    const creados: any[] = [];
    const errores: Array<{ index: number; nombre: string; error: string }> = [];

    for (let i = 0; i < regalos.length; i++) {
      const regalo = regalos[i];
      const { nombre, descripcion, precioCLP, imagenUrl, imagenBase64, permiteColaborativo } = regalo;

      // Validar campos obligatorios
      if (!nombre || !descripcion || precioCLP === undefined || precioCLP === null) {
        errores.push({ index: i, nombre: nombre || `#${i + 1}`, error: 'nombre, descripcion y precioCLP son obligatorios' });
        continue;
      }

      // Determinar la imagen: prioridad a imagenBase64, luego imagenUrl
      const imagenFinal = imagenBase64 || imagenUrl;
      if (!imagenFinal) {
        errores.push({ index: i, nombre, error: 'Falta imagen (URL o base64)' });
        continue;
      }

      try {
        const nuevoRegalo = await prisma.gift.create({
          data: {
            nombre,
            descripcion,
            precioCLP: parseInt(String(precioCLP)),
            imagenUrl: imagenFinal,
            permiteColaborativo: Boolean(permiteColaborativo),
          },
        });
        creados.push(nuevoRegalo);
      } catch (error: any) {
        errores.push({ index: i, nombre, error: error.message || 'Error al crear' });
      }
    }

    console.log(`📦 Carga masiva: ${creados.length} creados, ${errores.length} con error`);

    res.json({
      success: true,
      data: {
        creados: creados.length,
        total: regalos.length,
        errores,
      },
    });
  } catch (error) {
    console.error('Error en carga masiva:', error);
    res.status(500).json({ success: false, error: 'Error en carga masiva' });
  }
}

/**
 * Actualizar configuración del evento
 * PUT /api/admin/evento
 */
export async function actualizarEvento(req: Request, res: Response) {
  try {
    const {
      nombreGemela1,
      nombreGemela2,
      fecha,
      hora,
      lugar,
      lugarRecepcion,
      mensajeBienvenida,
      portadaUrl,
      portadaUrlMobile,
      wazeUrl,
      wazeUrlRecepcion,
      modoComision,
    } = req.body;

    const evento = await prisma.event.update({
      where: { id: 1 },
      data: {
        nombreGemela1,
        nombreGemela2,
        fecha,
        hora,
        lugar,
        lugarRecepcion,
        mensajeBienvenida,
        portadaUrl,
        portadaUrlMobile,
        wazeUrl,
        wazeUrlRecepcion,
        modoComision,
      },
    });

    res.json({
      success: true,
      data: evento,
    });
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar evento' });
  }
}

/**
 * Exportar contribuciones a CSV
 * GET /api/admin/export-csv
 */
export async function exportarCSV(req: Request, res: Response) {
  try {
    const contribuciones = await prisma.contribution.findMany({
      include: {
        gift: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Crear CSV
    const headers = [
      'Fecha',
      'Nombre Invitado',
      'Email',
      'Regalo',
      'Monto Bruto',
      'Comisión',
      'Monto Neto',
      'Estado',
      'ID Pago MP',
      'Dedicatoria',
    ].join(',');

    const rows = contribuciones.map(c => {
      return [
        c.createdAt.toISOString().split('T')[0],
        `"${c.nombreInvitado}"`,
        c.emailInvitado || '',
        `"${c.gift?.nombre || 'Aporte libre'}"`,
        c.montoBrutoCLP,
        c.comisionCLP,
        c.montoNetoCLP,
        c.estadoPago,
        c.mpPaymentId,
        `"${c.dedicatoria?.replace(/"/g, '""') || ''}"`,
      ].join(',');
    });

    const csv = [headers, ...rows].join('\n');

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=contribuciones.csv');
    res.send('\uFEFF' + csv); // BOM para UTF-8
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    res.status(500).json({ success: false, error: 'Error al exportar CSV' });
  }
}

/**
 * Enviar un correo de prueba para verificar la configuración de email.
 * POST /api/admin/test-email
 */
export async function testEmail(req: Request, res: Response) {
  try {
    const { email } = req.body || {};
    const para = (email || process.env.ADMIN_EMAIL || '').trim();

    if (!para) {
      return res.status(400).json({
        success: false,
        error: 'No se encontró un email de destino. Agrega el parámetro "email" o configura ADMIN_EMAIL.',
      });
    }

    const resultado = await enviarCorreoPrueba({ para });

    if (!resultado.success) {
      return res.status(500).json({
        success: false,
        error: (resultado.error as Error)?.message || 'Error al enviar el correo de prueba',
      });
    }

    console.log(`✅ Correo de prueba enviado a ${para}:`, resultado.messageId);
    res.json({
      success: true,
      message: `Correo de prueba enviado a ${para}`,
      messageId: resultado.messageId,
    });
  } catch (error) {
    console.error('❌ Error en testEmail:', error);
    res.status(500).json({ success: false, error: 'Error al enviar el correo de prueba' });
  }
}

/**
 * Eliminar todos los pagos de prueba (contribuciones) y resetear los regalos.
 * POST /api/admin/limpiar-pagos
 */
export async function limpiarPagos(req: Request, res: Response) {
  try {
    // 1. Eliminar todas las contribuciones (pagos)
    const { count: contribucionesEliminadas } = await prisma.contribution.deleteMany({});

    // 2. Resetear los regalos: monto recaudado a 0 y estado a 'disponible'
    const { count: regalosReseteados } = await prisma.gift.updateMany({
      data: {
        montoRecaudadoCLP: 0,
        estado: 'disponible',
      },
    });

    console.log(
      `🧹 Limpieza: ${contribucionesEliminadas} pagos eliminados, ${regalosReseteados} regalos reseteados`
    );

    res.json({
      success: true,
      message: `Se eliminaron ${contribucionesEliminadas} pagos y se resetearon ${regalosReseteados} regalos`,
      data: {
        contribucionesEliminadas,
        regalosReseteados,
      },
    });
  } catch (error) {
    console.error('Error al limpiar pagos:', error);
    res.status(500).json({ success: false, error: 'Error al limpiar pagos' });
  }
}
