/**
 * Controlador para obtener la lista pública de regalos
 * GET /api/regalos
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function getRegalos(req: Request, res: Response) {
  try {
    // Obtener todos los regalos con su estado actual
    const regalos = await prisma.gift.findMany({
      orderBy: {
        nombre: 'asc', // Orden alfabético por defecto
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        precioCLP: true,
        imagenUrl: true,
        permiteColaborativo: true,
        montoRecaudadoCLP: true,
        estado: true,
      },
    });

    // Obtener configuración del evento (para saber el modo de comisión)
    const evento = await prisma.event.findFirst();

    res.json({
      success: true,
      data: {
        regalos,
        modoComision: evento?.modoComision || 'A',
      },
    });
  } catch (error) {
    console.error('❌ Error al obtener regalos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la lista de regalos',
    });
  }
}

/**
 * Controlador para obtener un regalo específico por ID
 * GET /api/regalos/:id
 */
export async function getRegaloById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const regalo = await prisma.gift.findUnique({
      where: { id: parseInt(String(id)) },
      include: {
        contributions: {
          where: {
            estadoPago: 'approved',
          },
          select: {
            nombreInvitado: true,
            montoBrutoCLP: true,
            dedicatoria: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!regalo) {
      return res.status(404).json({
        success: false,
        error: 'Regalo no encontrado',
      });
    }

    res.json({
      success: true,
      data: regalo,
    });
  } catch (error) {
    console.error('❌ Error al obtener regalo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el regalo',
    });
  }
}

/**
 * Controlador para obtener información del evento
 * GET /api/evento
 */
export async function getEvento(req: Request, res: Response) {
  try {
    const evento = await prisma.event.findFirst();

    if (!evento) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado',
      });
    }

    // No exponer datos internos (correos de notificación) en la API pública
    const { emailNotificaciones: _oculto, ...datosPublicos } = evento;

    res.json({
      success: true,
      data: datosPublicos,
    });
  } catch (error) {
    console.error('❌ Error al obtener evento:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener información del evento',
    });
  }
}

/**
 * Servir la imagen de portada actual del evento (para vista previa en WhatsApp).
 * GET /api/portada
 * Si la portada es un data URL se envía como imagen; si es una URL externa se redirige.
 */
export async function getPortada(req: Request, res: Response) {
  try {
    const evento = await prisma.event.findFirst();
    const url = evento?.portadaUrl || '';
    if (!url) {
      return res.status(404).send('Portada no disponible');
    }

    if (url.startsWith('data:')) {
      const match = url.match(/^data:(image\/[a-z0-9+.-]+);base64,(.*)$/s);
      if (!match) {
        return res.status(400).send('Portada inválida');
      }
      const buffer = Buffer.from(match[2], 'base64');
      res.set('Content-Type', match[1]);
      res.set('Cache-Control', 'public, max-age=3600');
      return res.send(buffer);
    }

    // URL externa: redirigir (los crawlers siguen redirecciones)
    return res.redirect(302, url);
  } catch (error) {
    console.error('❌ Error al obtener portada:', error);
    res.status(500).send('Error al obtener portada');
  }
}
