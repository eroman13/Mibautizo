/**
 * Controladores del panel administrativo
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { COMMISSION_RATE } from '../lib/mercadopago';

/**
 * Login con usuario y contraseña
 * POST /api/admin/login
 */
export async function adminLogin(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    // Buscar usuario en BD
    const user = await prisma.adminUser.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario o contraseña incorrectos',
      });
    }

    // Verificar que esté activo
    if (!user.activo) {
      return res.status(401).json({
        success: false,
        error: 'Usuario desactivado',
      });
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Usuario o contraseña incorrectos',
      });
    }

    // Login exitoso
    res.json({
      success: true,
      token: 'admin-authenticated',
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
      where: { id: parseInt(id) },
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
      where: { giftId: parseInt(id) },
    });

    if (contribuciones > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar un regalo que tiene contribuciones',
      });
    }

    await prisma.gift.delete({
      where: { id: parseInt(id) },
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
      mensajeBienvenida,
      portadaUrl,
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
        mensajeBienvenida,
        portadaUrl,
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
