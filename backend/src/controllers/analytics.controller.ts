/**
 * Controlador de Analytics - Rastreo de visitantes y páginas
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * Rastrear una visita a página
 * POST /api/track-page-view
 */
export async function trackPageView(req: Request, res: Response) {
  try {
    const { page, referrer } = req.body;

    if (!page) {
      return res.status(400).json({
        success: false,
        error: 'El campo "page" es obligatorio',
      });
    }

    // Obtener identificadores del cliente
    const userAgent = req.headers['user-agent'] || '';
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 
               req.socket.remoteAddress || 
               '';

    // Crear o reutilizar sesión del usuario
    // Usamos un hash simple del user-agent + IP para identificar sesiones
    const sessionHash = `${userAgent}-${ip}`;
    
    // Buscar o crear sesión
    let session = await prisma.pageViewSession.findFirst({
      where: {
        userAgent: userAgent,
        ipAddress: ip,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Si la sesión tiene más de 30 minutos, crear una nueva
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    if (!session || session.updatedAt < thirtyMinutesAgo) {
      session = await prisma.pageViewSession.create({
        data: {
          userAgent,
          ipAddress: ip,
        },
      });
    } else {
      // Actualizar timestamp de la sesión
      await prisma.pageViewSession.update({
        where: { id: session.id },
        data: { updatedAt: new Date() },
      });
    }

    // Registrar la visita
    const pageView = await prisma.pageView.create({
      data: {
        sessionId: session.id,
        page,
        referrer,
      },
    });

    res.json({
      success: true,
      data: pageView,
    });
  } catch (error) {
    console.error('Error al rastrear visita:', error);
    res.status(500).json({ success: false, error: 'Error al rastrear visita' });
  }
}

/**
 * Obtener estadísticas de analytics
 * GET /api/admin/analytics?page=regalos&days=7
 */
export async function getAnalytics(req: Request, res: Response) {
  try {
    const { page, days = '30' } = req.query;

    const daysNum = Math.min(parseInt(String(days)) || 30, 365); // Max 1 año
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysNum);

    let whereClause: any = {
      timestamp: {
        gte: dateFrom,
      },
    };

    if (page) {
      whereClause.page = String(page);
    }

    // Obtener todas las visitas del período
    const pageViews = await prisma.pageView.findMany({
      where: whereClause,
      include: {
        session: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Procesar datos
    const uniqueSessions = new Set(pageViews.map(v => v.sessionId)).size;
    const pageViewsByPage: { [key: string]: number } = {};
    const pageViewsByDay: { [key: string]: number } = {};
    const sessionDetails: { [key: string]: { visits: number; pages: string[]; lastVisit: Date } } = {};

    for (const view of pageViews) {
      // Contar por página
      pageViewsByPage[view.page] = (pageViewsByPage[view.page] || 0) + 1;

      // Contar por día
      const day = view.timestamp.toISOString().split('T')[0];
      pageViewsByDay[day] = (pageViewsByDay[day] || 0) + 1;

      // Detalles de sesión
      if (!sessionDetails[view.sessionId]) {
        sessionDetails[view.sessionId] = {
          visits: 0,
          pages: [],
          lastVisit: view.timestamp,
        };
      }
      sessionDetails[view.sessionId].visits++;
      if (!sessionDetails[view.sessionId].pages.includes(view.page)) {
        sessionDetails[view.sessionId].pages.push(view.page);
      }
      if (view.timestamp > sessionDetails[view.sessionId].lastVisit) {
        sessionDetails[view.sessionId].lastVisit = view.timestamp;
      }
    }

    // Convertir a arrays para respuesta
    const pageViewsByPageArray = Object.entries(pageViewsByPage).map(([page, count]) => ({ page, count }));
    const pageViewsByDayArray = Object.entries(pageViewsByDay)
      .sort()
      .map(([day, count]) => ({ day, count }));

    const sessionsArray = Object.entries(sessionDetails)
      .map(([sessionId, data]) => ({
        sessionId,
        ...data,
      }))
      .sort((a, b) => b.visits - a.visits);

    // Estadísticas generales
    const stats = {
      totalViews: pageViews.length,
      uniqueSessions,
      viewsPerSession: uniqueSessions > 0 ? (pageViews.length / uniqueSessions).toFixed(2) : 0,
      daysTracked: daysNum,
      pageViewsByPage: pageViewsByPageArray,
      pageViewsByDay: pageViewsByDayArray,
      topSessions: sessionsArray.slice(0, 10), // Top 10 sesiones más activas
      allSessions: sessionsArray,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error al obtener analytics:', error);
    res.status(500).json({ success: false, error: 'Error al obtener analytics' });
  }
}
