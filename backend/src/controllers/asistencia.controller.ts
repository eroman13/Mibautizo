/**
 * Controladores de confirmación de asistencia (RSVP)
 * - POST /api/confirmar-asistencia (público)
 * - GET  /api/admin/asistencias (admin)
 * - DELETE /api/admin/asistencias/:id (admin)
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';

interface AsistenteBody {
  nombre: string;
  tipo: 'adulto' | 'nino';
  edad?: number;
}

interface ConfirmarBody {
  nombreFamilia?: string;
  email?: string;
  telefono?: string;
  mensaje?: string;
  asistentes?: AsistenteBody[];
}

// Edad máxima considerada "niño" (mayores de 13 se consideran adultos)
const EDAD_MAX_NINO = 13;
const EDAD_ADULTO = 14; // primer año como adulto
// Rangos de niños para el resumen
const EDAD_NINO_MENOR_MAX = 7; // grupo 0 a 7
const MAX_PERSONAS = 30;

/**
 * Validar la lista de asistentes. Devuelve un mensaje de error o null si es válida.
 */
function validarAsistentes(asistentes: AsistenteBody[]): string | null {
  if (!Array.isArray(asistentes) || asistentes.length === 0) {
    return 'Debes confirmar al menos 1 persona';
  }
  if (asistentes.length > MAX_PERSONAS) {
    return `Máximo ${MAX_PERSONAS} personas por familia`;
  }

  for (const persona of asistentes) {
    if (!persona || typeof persona.nombre !== 'string' || !persona.nombre.trim()) {
      return 'El nombre de cada persona es obligatorio';
    }
    if (persona.tipo !== 'adulto' && persona.tipo !== 'nino') {
      return 'Cada persona debe ser "adulto" o "nino"';
    }
    if (persona.tipo === 'nino') {
      const edad = Number(persona.edad);
      if (persona.edad === undefined || persona.edad === null || Number.isNaN(edad)) {
        return `Debes indicar la edad de ${persona.nombre.trim()} (niño/a)`;
      }
      if (!Number.isInteger(edad) || edad < 0 || edad > EDAD_MAX_NINO) {
        return `La edad de ${persona.nombre.trim()} debe ser un número entre 0 y ${EDAD_MAX_NINO} años (mayores de ${EDAD_MAX_NINO} se consideran adultos)`;
      }
    }
  }
  return null;
}

// Clasifica a una persona en un grupo para el resumen:
// - adulto (tipo adulto o edad >= 14)
// - ninoMenor (0 a 7)
// - ninoMayor (8 a 13)
type GrupoAsistente = 'adulto' | 'ninoMenor' | 'ninoMayor';

function grupoDe(asistente: { tipo: string; edad: number | null }): GrupoAsistente {
  if (asistente.tipo === 'adulto') return 'adulto';
  const edad = asistente.edad ?? EDAD_ADULTO; // sin edad registrada -> adulto
  if (edad >= EDAD_ADULTO) return 'adulto';
  if (edad <= EDAD_NINO_MENOR_MAX) return 'ninoMenor';
  return 'ninoMayor';
}

/**
 * Confirmar asistencia al evento (público)
 * POST /api/confirmar-asistencia
 */
export async function confirmarAsistencia(req: Request, res: Response) {
  try {
    const body: ConfirmarBody = req.body || {};

    const nombreFamilia = (body.nombreFamilia || '').trim();
    if (!nombreFamilia) {
      return res.status(400).json({
        success: false,
        error: 'El nombre de la familia es obligatorio',
      });
    }

    const errorAsistentes = validarAsistentes(body.asistentes || []);
    if (errorAsistentes) {
      return res.status(400).json({ success: false, error: errorAsistentes });
    }

    const asistentes = body.asistentes!;

    // Guardar en una transacción: la confirmación + todas sus personas
    const confirmacion = await prisma.asistencia.create({
      data: {
        nombreFamilia,
        email: (body.email || '').trim() || null,
        telefono: (body.telefono || '').trim() || null,
        mensaje: (body.mensaje || '').trim() || null,
        asistentes: {
          create: asistentes.map((p) => ({
            nombre: p.nombre.trim(),
            tipo: p.tipo,
            edad: p.tipo === 'nino' ? Number(p.edad) : null,
          })),
        },
      },
      include: { asistentes: true },
    });

    const adultos = confirmacion.asistentes.filter((a) => grupoDe(a) === 'adulto').length;
    const ninosMenores = confirmacion.asistentes.filter((a) => grupoDe(a) === 'ninoMenor').length;
    const ninosMayores = confirmacion.asistentes.filter((a) => grupoDe(a) === 'ninoMayor').length;
    const ninos = ninosMenores + ninosMayores;

    console.log(
      `💌 Confirmación de asistencia: ${confirmacion.nombreFamilia} (${adultos} adultos, ${ninosMenores} niños 0-${EDAD_NINO_MENOR_MAX}, ${ninosMayores} niños ${EDAD_NINO_MENOR_MAX + 1}-${EDAD_MAX_NINO})`
    );

    res.json({
      success: true,
      data: {
        id: confirmacion.id,
        nombreFamilia: confirmacion.nombreFamilia,
        adultos,
        ninos,
        ninosMenores,
        ninosMayores,
        total: confirmacion.asistentes.length,
      },
    });
  } catch (error) {
    console.error('❌ Error al confirmar asistencia:', error);
    res.status(500).json({ success: false, error: 'Error al confirmar asistencia' });
  }
}

/**
 * Listar todas las confirmaciones de asistencia (admin)
 * GET /api/admin/asistencias
 */
export async function getAsistencias(req: Request, res: Response) {
  try {
    const lista = await prisma.asistencia.findMany({
      include: {
        asistentes: {
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let familias = 0;
    let adultos = 0;
    let ninosMenores = 0;
    let ninosMayores = 0;

    for (const a of lista) {
      familias++;
      for (const p of a.asistentes) {
        const grupo = grupoDe(p);
        if (grupo === 'adulto') adultos++;
        else if (grupo === 'ninoMenor') ninosMenores++;
        else ninosMayores++;
      }
    }

    res.json({
      success: true,
      data: lista,
      resumen: {
        familias,
        adultos,
        ninosMenores,
        ninosMayores,
        ninos: ninosMenores + ninosMayores,
      },
    });
  } catch (error) {
    console.error('❌ Error al obtener asistencias:', error);
    res.status(500).json({ success: false, error: 'Error al obtener asistencias' });
  }
}

/**
 * Eliminar una confirmación de asistencia (admin)
 * DELETE /api/admin/asistencias/:id
 */
export async function eliminarAsistencia(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const existente = await prisma.asistencia.findUnique({ where: { id } });
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Confirmación no encontrada' });
    }

    // onDelete: Cascade elimina también las personas asociadas
    await prisma.asistencia.delete({ where: { id } });
    console.log(`🗑️ Confirmación de ${existente.nombreFamilia} eliminada`);

    res.json({
      success: true,
      message: `Confirmación de "${existente.nombreFamilia}" eliminada`,
    });
  } catch (error) {
    console.error('❌ Error al eliminar asistencia:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar asistencia' });
  }
}