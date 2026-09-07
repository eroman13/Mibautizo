/**
 * Controladores de invitaciones (se envían por WhatsApp con un enlace único)
 * - GET   /api/admin/invitaciones
 * - POST  /api/admin/invitaciones
 * - POST  /api/admin/invitaciones/bulk
 * - PUT   /api/admin/invitaciones/:id
 * - DELETE /api/admin/invitaciones/:id
 */

import { Request, Response } from 'express';
import crypto from 'node:crypto';
import prisma from '../lib/prisma';

interface InvitacionBody {
  familia?: string;
  contacto?: string;
  telefono?: string;
  estado?: 'pendiente' | 'enviada' | 'confirmada';
  modalidad?: 'familiar' | 'pareja' | 'individual' | 'adulto-hijos';
  asistentes?: string;
}

function limpiarTelefono(tel?: string): string | null {
  if (!tel) return null;
  // Conserva dígitos, espacios y +
  const limpio = tel.trim().replace(/[^\d+]/g, '');
  return limpio || null;
}

/** Para invitaciones "familiar" asegura que el nombre empiece con "Familia". */
function normalizarFamiliaFamiliar(
  modalidad: string | undefined,
  familia: string
): string {
  const nombre = familia.trim();
  if (modalidad !== 'familiar') return nombre;
  return /^familia\b/i.test(nombre) ? nombre : `Familia ${nombre}`;
}

interface InvitadoEstructurado {
  nombre: string;
  tipo: 'adulto' | 'nino';
  edad: number | null;
}

/**
 * Interpreta una línea del mantenedor de invitados:
 * - "Nombre (NN)" o "Nombre (NN años)"  -> niño con edad precargada
 * - contiene niño/niña/hijo/hija/bebé    -> niño (edad se pide al confirmar)
 * - en otro caso                          -> adulto
 */
function interpretarLineaInvitado(linea: string, forzarNino = false): InvitadoEstructurado {
  const texto = linea.trim();
  const conEdad = texto.match(/^(.+?)\s*\((\d{1,2})\s*(años?)?\)\s*$/i);
  if (conEdad) {
    return { nombre: conEdad[1].trim(), tipo: 'nino', edad: Number(conEdad[2]) };
  }
  const esNino =
    forzarNino || /niño|niña|hijo|hija|bebé|bebe/i.test(texto);
  return { nombre: texto, tipo: esNino ? 'nino' : 'adulto', edad: null };
}

/** Lista estructurada de invitados según la modalidad (para precargar el RSVP). */
function invitadosEstructurados(inv: {
  modalidad: string;
  familia: string;
  contacto?: string | null;
  asistentes?: string | null;
}): InvitadoEstructurado[] {
  const lineas = (inv.asistentes || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  if (inv.modalidad === 'individual') {
    return [{ nombre: inv.familia.trim(), tipo: 'adulto', edad: null }];
  }
  if (inv.modalidad === 'pareja') {
    return lineas
      .slice(0, 2)
      .map((n) => ({ nombre: n, tipo: 'adulto' as const, edad: null }));
  }
  if (inv.modalidad === 'adulto-hijos') {
    const adulto = (inv.contacto || '').trim();
    const resultado: InvitadoEstructurado[] = adulto
      ? [{ nombre: adulto, tipo: 'adulto', edad: null }]
      : [];
    for (const l of lineas) {
      resultado.push(interpretarLineaInvitado(l, true));
    }
    return resultado;
  }
  // familiar: precarga las personas escritas en el mantenedor
  return lineas.map((l) => interpretarLineaInvitado(l));
}

function generarToken(): string {
  return crypto.randomBytes(12).toString('hex');
}

function validarInvitacion(body: InvitacionBody): string | null {
  if (!body || typeof body.familia !== 'string' || !body.familia.trim()) {
    return 'El nombre de la familia es obligatorio';
  }
  if (body.familia.trim().length > 120) {
    return 'El nombre de la familia es demasiado largo';
  }
  if (
    body.modalidad &&
    body.modalidad !== 'familiar' &&
    body.modalidad !== 'pareja' &&
    body.modalidad !== 'individual' &&
    body.modalidad !== 'adulto-hijos'
  ) {
    return 'La modalidad debe ser "familiar", "pareja", "individual" o "adulto-hijos"';
  }
  return null;
}

/** Consulta pública de una invitación por su token (datos mínimos para el RSVP) */
export async function getInvitacionPublica(req: Request, res: Response) {
  try {
    const token = String(req.query.token || '').trim();
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token requerido' });
    }

    const invitacion = await prisma.invitacion.findUnique({ where: { token } });
    if (!invitacion) {
      return res.status(404).json({ success: false, error: 'Invitación no encontrada' });
    }

    // Personas para precargar en el RSVP (nombres y detalle adulto/niño)
    const invitados = invitadosEstructurados({
      modalidad: invitacion.modalidad,
      familia: invitacion.familia,
      contacto: invitacion.contacto,
      asistentes: invitacion.asistentes,
    });
    const personas = invitados.map((i) => i.nombre);

    res.json({
      success: true,
      data: {
        familia: invitacion.familia,
        contacto: invitacion.contacto,
        modalidad: invitacion.modalidad,
        estado: invitacion.estado,
        personas,
        invitados,
      },
    });
  } catch (error) {
    console.error('❌ Error al consultar invitación pública:', error);
    res.status(500).json({ success: false, error: 'Error al consultar invitación' });
  }
}

/** Listar todas las invitaciones con un resumen por estado */
export async function getInvitaciones(req: Request, res: Response) {
  try {
    const invitaciones = await prisma.invitacion.findMany({
      orderBy: [{ estado: 'asc' }, { createdAt: 'desc' }],
    });

    const resumen = {
      total: invitaciones.length,
      pendientes: invitaciones.filter((i) => i.estado === 'pendiente').length,
      enviadas: invitaciones.filter((i) => i.estado === 'enviada').length,
      confirmadas: invitaciones.filter((i) => i.estado === 'confirmada').length,
    };

    res.json({ success: true, data: invitaciones, resumen });
  } catch (error) {
    console.error('❌ Error al obtener invitaciones:', error);
    res.status(500).json({ success: false, error: 'Error al obtener invitaciones' });
  }
}

/** Crear una invitación */
export async function crearInvitacion(req: Request, res: Response) {
  try {
    const body: InvitacionBody = req.body || {};
    const error = validarInvitacion(body);
    if (error) {
      return res.status(400).json({ success: false, error });
    }

    const invitacion = await prisma.invitacion.create({
      data: {
        familia: normalizarFamiliaFamiliar(body.modalidad, body.familia!),
        contacto: (body.contacto || '').trim() || null,
        telefono: limpiarTelefono(body.telefono),
        token: generarToken(),
        estado: 'pendiente',
        modalidad: body.modalidad || 'familiar',
        asistentes: (body.asistentes || '').trim() || null,
      },
    });

    res.json({ success: true, data: invitacion });
  } catch (error) {
    console.error('❌ Error al crear invitación:', error);
    res.status(500).json({ success: false, error: 'Error al crear invitación' });
  }
}

/** Crear varias invitaciones a la vez (importación desde Excel/CSV/paste) */
export async function crearInvitacionesMasivo(req: Request, res: Response) {
  try {
    const body: { invitaciones?: InvitacionBody[] } = req.body || {};
    const filas = Array.isArray(body.invitaciones) ? body.invitaciones : [];

    if (filas.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: 'No se recibieron invitaciones para importar' });
    }

    let creados = 0;
    let total = filas.length;
    let errores: string[] = [];

    for (const fila of filas) {
      const error = validarInvitacion(fila);
      if (error) {
        errores.push(`"${(fila.familia || '').trim() || '?'}": ${error}`);
        continue;
      }
      await prisma.invitacion.create({
        data: {
          familia: normalizarFamiliaFamiliar(fila.modalidad, fila.familia!),
          contacto: (fila.contacto || '').trim() || null,
          telefono: limpiarTelefono(fila.telefono),
          token: generarToken(),
          estado: 'pendiente',
          modalidad: fila.modalidad || 'familiar',
          asistentes: (fila.asistentes || '').trim() || null,
        },
      });
      creados++;
    }

    res.json({
      success: true,
      data: { creados, total, errores },
    });
  } catch (error) {
    console.error('❌ Error al importar invitaciones:', error);
    res.status(500).json({ success: false, error: 'Error al importar invitaciones' });
  }
}

/** Actualizar una invitación (permite cambiar estado para marcar confirmada manualmente) */
export async function actualizarInvitacion(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const existente = await prisma.invitacion.findUnique({ where: { id } });
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Invitación no encontrada' });
    }

    const body: InvitacionBody = req.body || {};

    const modalidadFinal = body.modalidad || existente.modalidad;
    const data: any = {};
    if (typeof body.familia === 'string') {
      if (!body.familia.trim()) {
        return res.status(400).json({ success: false, error: 'El nombre de la familia es obligatorio' });
      }
      data.familia = normalizarFamiliaFamiliar(modalidadFinal, body.familia);
    }
    if (typeof body.contacto === 'string') data.contacto = body.contacto.trim() || null;
    if (typeof body.telefono === 'string') data.telefono = limpiarTelefono(body.telefono);
    if (typeof body.asistentes === 'string') data.asistentes = body.asistentes.trim() || null;
    if (
      body.modalidad &&
      ['familiar', 'pareja', 'individual', 'adulto-hijos'].includes(body.modalidad)
    ) {
      data.modalidad = body.modalidad;
    }

    // Cambio de estado manual (marcar confirmada sin RSVP, o volver a pendiente)
    if (body.estado && ['pendiente', 'enviada', 'confirmada'].includes(body.estado)) {
      if (body.estado !== existente.estado) {
        data.estado = body.estado;
        if (body.estado === 'enviada') {
          data.fechaEnviada = new Date();
          data.fechaConfirmada = null;
        } else if (body.estado === 'confirmada') {
          data.fechaConfirmada = new Date();
        } else if (body.estado === 'pendiente') {
          data.fechaEnviada = null;
          data.fechaConfirmada = null;
        }
      }
    }

    const invitacion = await prisma.invitacion.update({ where: { id }, data });
    res.json({ success: true, data: invitacion });
  } catch (error) {
    console.error('❌ Error al actualizar invitación:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar invitación' });
  }
}

/** Marcar una invitación como "enviada" (sin borrar la fecha de confirmación) */
export async function marcarEnviadaInvitacion(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const existente = await prisma.invitacion.findUnique({ where: { id } });
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Invitación no encontrada' });
    }

    const invitacion = await prisma.invitacion.update({
      where: { id },
      data: {
        estado: existente.estado === 'confirmada' ? 'confirmada' : 'enviada',
        fechaEnviada: existente.fechaEnviada || new Date(),
      },
    });

    res.json({ success: true, data: invitacion });
  } catch (error) {
    console.error('❌ Error al marcar invitación como enviada:', error);
    res.status(500).json({ success: false, error: 'Error al marcar invitación como enviada' });
  }
}

/** Eliminar una invitación */
export async function eliminarInvitacion(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const existente = await prisma.invitacion.findUnique({ where: { id } });
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Invitación no encontrada' });
    }

    await prisma.invitacion.delete({ where: { id } });
    console.log(`🗑️ Invitación de "${existente.familia}" eliminada`);

    res.json({ success: true, message: `Invitación de "${existente.familia}" eliminada` });
  } catch (error) {
    console.error('❌ Error al eliminar invitación:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar invitación' });
  }
}

