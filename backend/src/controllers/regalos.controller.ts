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
        id: 'asc', // Orden de creación (el frontend permite reordenar)
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

    res.json({
      success: true,
      data: evento,
    });
  } catch (error) {
    console.error('❌ Error al obtener evento:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener información del evento',
    });
  }
}
