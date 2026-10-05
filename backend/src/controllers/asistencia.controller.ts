/**
 * Controladores de confirmación de asistencia (RSVP)
 * - POST /api/confirmar-asistencia (público)
 * - GET  /api/admin/asistencias (admin)
 * - DELETE /api/admin/asistencias/:id (admin)
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import {
  enviarConfirmacionAsistencia,
  enviarNotificacionAsistencia,
  enviarNotificacionDeclinacion,
  obtenerEmailsNotificacion,
} from '../lib/email';
import { invitadosEstructurados } from './invitaciones.controller';

interface AsistenteBody {
  nombre: string;
  tipo: 'adulto' | 'nino';
  edad?: number;
  /**
   * false = la persona NO asistirá (pero queda registrada en la confirmación).
   * Permite el caso real: de una pareja asiste solo uno de los dos.
   */
  asiste?: boolean;
}

interface ConfirmarBody {
  nombreFamilia?: string;
  email?: string;
  telefono?: string;
  mensaje?: string;
  invitacionToken?: string; // Token del enlace de invitación por WhatsApp
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
 *
 * Se permite marcar personas como "no asistirá" (asiste: false), pero siempre
 * debe quedar al menos 1 persona asistiendo: si no asiste nadie, corresponde
 * usar "No podré asistir" (POST /api/declinar-asistencia).
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
    if (persona.asiste !== undefined && typeof persona.asiste !== 'boolean') {
      return 'El campo "asiste" de cada persona debe ser verdadero o falso';
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

  const asisten = asistentes.filter((p) => p.asiste !== false);
  if (asisten.length === 0) {
    return 'Nadie de tu grupo puede asistir: si finalmente no podrán ir, usa la opción "No podré asistir".';
  }

  return null;
}

/** Personas que sí asistirán */
function soloAsisten<T extends { asiste?: boolean | null }>(personas: T[]): T[] {
  return personas.filter((p) => p.asiste !== false);
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

/** Normaliza un nombre de familia para comparar (sin espacios extra ni mayúsculas). */
function normalizarNombre(nombre: string): string {
  return nombre.trim().toLowerCase().replace(/\s+/g, ' ');
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

    const invitacionToken = (body.invitacionToken || '').trim();

    // Validar según el tipo de invitación: individual (1), pareja (2 adultos, sin niños)
    if (invitacionToken) {
      const invitacionValida = await prisma.invitacion.findUnique({
        where: { token: invitacionToken },
        select: { modalidad: true, estado: true, asistenciaId: true },
      });
      if (invitacionValida?.estado === 'confirmada') {
        // Si la confirmación asociada todavía existe, bloqueamos el reenvío.
        // Si ya no existe (por ejemplo, los papás la eliminaron del panel para
        // corregir un dato), permitimos que la familia vuelva a confirmar con
        // su enlace en lugar de dejar la invitación "trabada".
        const asistenciaViva = invitacionValida.asistenciaId
          ? await prisma.asistencia.findUnique({
              where: { id: invitacionValida.asistenciaId },
              select: { id: true },
            })
          : null;
        if (asistenciaViva) {
          return res.status(409).json({
            success: false,
            error:
              'Ya confirmaste tu asistencia con este enlace. Si necesitas modificar algo, contáctate directamente con los papás.',
          });
        }
      }
      if (invitacionValida?.modalidad === 'individual' && asistentes.length > 1) {
        return res.status(400).json({
          success: false,
          error: 'Esta invitación es individual: solo puedes confirmar a la persona invitada.',
        });
      }
      if (invitacionValida?.modalidad === 'pareja') {
        if (asistentes.length > 2) {
          return res.status(400).json({
            success: false,
            error: 'Esta invitación es para la pareja: máximo 2 personas.',
          });
        }
        if (asistentes.some((a) => a.tipo === 'nino')) {
          return res.status(400).json({
            success: false,
            error: 'Esta invitación es solo para la pareja: no incluye niños.',
          });
        }
      }
      if (invitacionValida?.modalidad === 'adulto-hijos') {
        // Solo cuentan los adultos que realmente asistirán
        const adultosQueAsisten = soloAsisten(asistentes).filter((a) => a.tipo === 'adulto').length;
        if (adultosQueAsisten !== 1) {
          return res.status(400).json({
            success: false,
            error:
              'Esta invitación es para 1 adulto con sus hijos: debe asistir exactamente 1 adulto.',
          });
        }
      }
    }

    // Guardar en una transacción: la confirmación + todas sus personas
    // (incluidas las que finalmente no asistirán, con asiste = false)
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
            asiste: p.asiste !== false,
          })),
        },
      },
      include: { asistentes: true },
    });

    // Los conteos solo consideran a quienes realmente asistirán
    const asisten = soloAsisten(confirmacion.asistentes);
    const noAsisten = confirmacion.asistentes.length - asisten.length;
    const adultos = asisten.filter((a) => grupoDe(a) === 'adulto').length;
    const ninosMenores = asisten.filter((a) => grupoDe(a) === 'ninoMenor').length;
    const ninosMayores = asisten.filter((a) => grupoDe(a) === 'ninoMayor').length;
    const ninos = ninosMenores + ninosMayores;

    // ---- Correos automáticos (sin bloquear la confirmación si fallan) ----
    try {
      const eventoNotif = await prisma.event.findFirst();
      const emailInvitado = (body.email || '').trim();

      // 1) Confirmación al invitado
      if (emailInvitado) {
        const resultadoInv = await enviarConfirmacionAsistencia({
          para: emailInvitado,
          nombreFamilia,
          email: emailInvitado,
          telefono: (body.telefono || '').trim() || undefined,
          asistentes: asisten.map((a) => ({
            nombre: a.nombre,
            tipo: a.tipo,
            edad: a.edad,
          })),
          mensaje: (body.mensaje || '').trim() || undefined,
          fechaEvento: eventoNotif?.fecha,
          horaEvento: eventoNotif?.hora,
          lugarEvento: eventoNotif?.lugar,
          numeroConfirmacion: confirmacion.id,
        });
        if (!resultadoInv.success) {
          console.warn(
            '⚠️ No se pudo enviar confirmación de asistencia al invitado:',
            (resultadoInv.error as Error)?.message
          );
        }
      }

      // 2) Notificación a los administradores/configurados
      const destinatarios = obtenerEmailsNotificacion(eventoNotif);
      if (destinatarios.length > 0) {
        // Se avisa también quiénes finalmente no asistirán (útil en el correo)
        const mensajeAdmin =
          [
            (body.mensaje || '').trim(),
            noAsisten > 0
              ? `⚠️ No asistirán (${noAsisten}): ${confirmacion.asistentes
                  .filter((a) => a.asiste === false)
                  .map((a) => a.nombre)
                  .join(', ')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n') || undefined;

        const resultadoAdmin = await enviarNotificacionAsistencia({
          para: destinatarios,
          nombreFamilia,
          email: emailInvitado || undefined,
          telefono: (body.telefono || '').trim() || undefined,
          adultos,
          ninosMenores,
          ninosMayores,
          mensaje: mensajeAdmin,
        });
        if (!resultadoAdmin.success) {
          console.warn(
            '⚠️ No se pudo enviar notificación de asistencia:',
            (resultadoAdmin.error as Error)?.message
          );
        }
      }
    } catch (errorEmail) {
      console.error('⚠️ Error en envío de correos de asistencia:', errorEmail);
    }

    // Vincular la confirmación con su invitación (si venía con token del enlace de WhatsApp)
    if (invitacionToken) {
      try {
        const invitacion = await prisma.invitacion.findUnique({
          where: { token: invitacionToken },
        });
        if (invitacion) {
          await prisma.invitacion.update({
            where: { id: invitacion.id },
            data: {
              estado: 'confirmada',
              fechaConfirmada: new Date(),
              asistenciaId: confirmacion.id,
            },
          });
          console.log(`✅ Invitación de "${invitacion.familia}" marcada como confirmada`);

          // Si la invitación tenía una respuesta previa (una declinación), se
          // elimina para no dejar a la familia duplicada: aparecía a la vez en
          // "Confirmados" y en "No asistirán".
          const previaId = invitacion.asistenciaId;
          if (previaId && previaId !== confirmacion.id) {
            const previa = await prisma.asistencia.findUnique({
              where: { id: previaId },
              include: { asistentes: true },
            });
            if (
              previa &&
              (previa.estado === 'declinada' || previa.asistentes.length === 0)
            ) {
              await prisma.asistencia.delete({ where: { id: previa.id } });
              console.log(
                `🧹 Respuesta anterior (${previa.estado}) de "${invitacion.familia}" eliminada`
              );
            }
          }
        }
      } catch (errorLink) {
        console.warn('⚠️ No se pudo vincular la invitación:', errorLink);
      }
    }

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
        total: asisten.length,
        noAsisten,
      },
    });
  } catch (error) {
    console.error('❌ Error al confirmar asistencia:', error);
    res.status(500).json({ success: false, error: 'Error al confirmar asistencia' });
  }
}

/**
 * Registrar que un invitado no asistirá al evento (declinación)
 * POST /api/declinar-asistencia
 */
export async function declinarAsistencia(req: Request, res: Response) {
  try {
    const body: ConfirmarBody = req.body || {};

    let nombreFamilia = (body.nombreFamilia || '').trim();
    const invitacionToken = (body.invitacionToken || '').trim();

    // Si viene con token, validar la invitación y usar su familia como respaldo
    if (invitacionToken) {
      const invitacion = await prisma.invitacion.findUnique({
        where: { token: invitacionToken },
        select: { id: true, familia: true, estado: true },
      });

      if (!invitacion) {
        return res.status(404).json({ success: false, error: 'Invitación no encontrada' });
      }

      if (invitacion.estado === 'confirmada' || invitacion.estado === 'declinada') {
        return res.status(409).json({
          success: false,
          error:
            'Ya respondiste con este enlace. Si necesitas modificar algo, contáctate directamente con los papás.',
        });
      }

      if (!nombreFamilia) nombreFamilia = invitacion.familia;
    }

    if (!nombreFamilia) {
      return res.status(400).json({
        success: false,
        error: 'Indícanos tu nombre o familia para registrar tu respuesta.',
      });
    }

    const confirmacion = await prisma.asistencia.create({
      data: {
        nombreFamilia,
        email: (body.email || '').trim() || null,
        telefono: (body.telefono || '').trim() || null,
        mensaje: (body.mensaje || '').trim() || null,
        estado: 'declinada',
      },
    });

    // Notificar a los papás por email (sin bloquear la respuesta)
    try {
      const eventoNotif = await prisma.event.findFirst();
      const destinatarios = obtenerEmailsNotificacion(eventoNotif);
      if (destinatarios.length > 0) {
        await enviarNotificacionDeclinacion({
          para: destinatarios,
          nombreFamilia,
          email: (body.email || '').trim() || undefined,
          mensaje: (body.mensaje || '').trim() || undefined,
        });
      }
    } catch (errorEmail) {
      console.error('⚠️ Error al enviar notificación de declinación:', errorEmail);
    }

    // Vincular la invitación (estado "declinada")
    if (invitacionToken) {
      try {
        await prisma.invitacion.update({
          where: { token: invitacionToken },
          data: {
            estado: 'declinada',
            fechaDeclinada: new Date(),
            asistenciaId: confirmacion.id,
          },
        });
        console.log(`💔 Invitación de "${nombreFamilia}" marcada como declinada`);
      } catch (errorLink) {
        console.warn('⚠️ No se pudo vincular la invitación:', errorLink);
      }
    }

    console.log(`💔 Declinación de asistencia registrada: ${nombreFamilia}`);

    res.json({
      success: true,
      data: {
        id: confirmacion.id,
        nombreFamilia,
      },
    });
  } catch (error) {
    console.error('❌ Error al registrar declinación:', error);
    res.status(500).json({ success: false, error: 'Error al registrar tu respuesta' });
  }
}

/**
 * Sincroniza las invitaciones declinadas que no tienen confirmación asociada.
 *
 * El admin puede marcar una invitación como "declinada" desde el panel y en ese
 * caso no existe fila en Asistencia: el resumen las ignoraba y el contador
 * "No asistirán" quedaba en 0. Aquí se crea la confirmación declinada
 * equivalente (operación idempotente) para que todos los declines se cuenten
 * igual sin importar dónde se registraron.
 */
async function sincronizarDeclinadas(): Promise<number> {
  const pendientes = await prisma.invitacion.findMany({
    where: { estado: 'declinada', asistenciaId: null },
    select: { id: true, familia: true, fechaDeclinada: true, createdAt: true },
  });

  let creadas = 0;
  for (const inv of pendientes) {
    try {
      const asistencia = await prisma.asistencia.create({
        data: {
          nombreFamilia: inv.familia,
          estado: 'declinada',
          createdAt: inv.fechaDeclinada || inv.createdAt,
        },
      });
      await prisma.invitacion.update({
        where: { id: inv.id },
        data: { asistenciaId: asistencia.id },
      });
      creadas++;
    } catch (errorSync) {
      console.warn(
        `⚠️ No se pudo sincronizar la invitación declinada "${inv.familia}":`,
        errorSync instanceof Error ? errorSync.message : errorSync
      );
    }
  }

  if (creadas > 0) {
    console.log(`🔁 ${creadas} invitación(es) declinada(s) sincronizadas con su confirmación`);
  }
  return creadas;
}

/**
 * Sincroniza las invitaciones marcadas como "confirmada" que ya no tienen una
 * confirmación de asistencia viva.
 *
 * Casos reales que cubre:
 * - El admin marca la invitación como "confirmada" a mano (sin RSVP): no existía
 *   fila en Asistencia, así que la familia aparecía como "Confirmada" en el panel
 *   de Invitaciones pero desaparecía del listado de Asistencias.
 * - La confirmación asociada se eliminó y el vínculo quedó roto (asistenciaId
 *   apuntando a un registro inexistente).
 *
 * Aquí se re-crea la confirmación (idempotente) usando las personas invitadas de
 * la invitación, para que la familia vuelva a aparecer y se cuente en los totales.
 */
async function sincronizarConfirmadasHuerfanas(): Promise<number> {
  const confirmadas = await prisma.invitacion.findMany({
    where: { estado: 'confirmada' },
    select: {
      id: true,
      familia: true,
      contacto: true,
      modalidad: true,
      asistentes: true,
      asistenciaId: true,
      fechaConfirmada: true,
      createdAt: true,
    },
  });
  if (confirmadas.length === 0) return 0;

  // Confirmaciones que todavía existen (para no duplicar registros)
  const idsReferenciados = confirmadas
    .map((i) => i.asistenciaId)
    .filter((id): id is number => typeof id === 'number');
  const vivas = idsReferenciados.length
    ? await prisma.asistencia.findMany({
        where: { id: { in: idsReferenciados } },
        select: { id: true },
      })
    : [];
  const vivasSet = new Set(vivas.map((a) => a.id));

  // Confirmaciones "confirmada" que ya existen, indexadas por nombre normalizado,
  // para reutilizarlas en lugar de crear una fila duplicada de la misma familia.
  const existentes = await prisma.asistencia.findMany({
    where: { estado: 'confirmada' },
    select: { id: true, nombreFamilia: true },
  });
  const porNombre = new Map<string, number>();
  for (const a of existentes) {
    const clave = normalizarNombre(a.nombreFamilia);
    if (!porNombre.has(clave)) porNombre.set(clave, a.id);
  }

  let creadas = 0;
  for (const inv of confirmadas) {
    // Vínculo sano: la confirmación existe, no hay nada que reparar
    if (inv.asistenciaId && vivasSet.has(inv.asistenciaId)) continue;

    try {
      // Si ya hay una confirmación viva con el mismo nombre, solo se vuelve a
      // enlazar: así la familia no aparece duplicada en el panel.
      const idExistente = porNombre.get(normalizarNombre(inv.familia));
      if (idExistente) {
        await prisma.invitacion.update({
          where: { id: inv.id },
          data: { asistenciaId: idExistente },
        });
        continue;
      }

      const invitados = invitadosEstructurados(inv);
      const filas = invitados.map((p) => ({
        nombre: (p.nombre || '').trim() || inv.familia,
        tipo: p.tipo,
        edad: p.edad,
        asiste: true,
      }));
      if (filas.length === 0) {
        filas.push({ nombre: inv.familia, tipo: 'adulto', edad: null, asiste: true });
      }

      const asistencia = await prisma.asistencia.create({
        data: {
          nombreFamilia: inv.familia,
          estado: 'confirmada',
          createdAt: inv.fechaConfirmada || inv.createdAt,
          asistentes: { create: filas },
        },
      });
      await prisma.invitacion.update({
        where: { id: inv.id },
        data: { asistenciaId: asistencia.id },
      });
      porNombre.set(normalizarNombre(inv.familia), asistencia.id);
      creadas++;
    } catch (errorSync) {
      console.warn(
        `⚠️ No se pudo sincronizar la confirmación de "${inv.familia}":`,
        errorSync instanceof Error ? errorSync.message : errorSync
      );
    }
  }

  if (creadas > 0) {
    console.log(`🔁 ${creadas} invitación(es) confirmada(s) sincronizadas con su confirmación`);
  }
  return creadas;
}

/**
 * Elimina declinaciones "fantasma": registros que quedaron en estado declinada
 * (típicamente generados al marcar una invitación como "declinada" a mano, o por
 * una declinación previa del enlace) cuando la misma familia ya tiene una
 * confirmación viva.
 *
 * Evita que una familia aparezca duplicada: a la vez en "Confirmados" y en
 * "No asistirán".
 */
async function limpiarDeclinadasObsoletas(): Promise<number> {
  const [confirmadas, declinadas] = await Promise.all([
    prisma.asistencia.findMany({
      where: { estado: 'confirmada' },
      select: { nombreFamilia: true },
    }),
    prisma.asistencia.findMany({
      where: {
        estado: 'declinada',
        email: null,
        telefono: null,
        mensaje: null,
        asistentes: { none: {} },
      },
      select: { id: true, nombreFamilia: true },
    }),
  ]);

  const nombresConfirmados = new Set(
    confirmadas.map((a) => normalizarNombre(a.nombreFamilia))
  );

  let borradas = 0;
  for (const d of declinadas) {
    if (!nombresConfirmados.has(normalizarNombre(d.nombreFamilia))) continue;
    try {
      await prisma.asistencia.delete({ where: { id: d.id } });
      borradas++;
    } catch (errorDelete) {
      console.warn(
        `⚠️ No se pudo eliminar la declinación duplicada de "${d.nombreFamilia}":`,
        errorDelete instanceof Error ? errorDelete.message : errorDelete
      );
    }
  }

  if (borradas > 0) {
    console.log(`🧹 ${borradas} declinación(es) duplicadas eliminadas`);
  }
  return borradas;
}

/**
 * Listar todas las confirmaciones de asistencia (admin)
 * GET /api/admin/asistencias
 */
export async function getAsistencias(req: Request, res: Response) {
  try {
    // Reparación idempotente: cualquier decline que exista solo como invitación
    // (marcado manualmente en el panel) se convierte en confirmación declinada.
    try {
      await sincronizarDeclinadas();
    } catch (errorSync) {
      console.warn('⚠️ No se pudieron sincronizar las declinaciones:', errorSync);
    }

    // Reparación idempotente: invitaciones marcadas como "confirmada" sin una
    // confirmación viva (marcadas a mano o con el vínculo roto) se re-crean para
    // que vuelvan a aparecer en el panel y en los totales.
    try {
      await sincronizarConfirmadasHuerfanas();
    } catch (errorSync) {
      console.warn('⚠️ No se pudieron sincronizar las confirmaciones:', errorSync);
    }

    // Limpieza: declinaciones "fantasma" que quedaron cuando una familia declinó
    // y luego confirmó (o el estado se cambió a mano). Evita que aparezca repetida.
    try {
      await limpiarDeclinadasObsoletas();
    } catch (errorSync) {
      console.warn('⚠️ No se pudieron limpiar las declinaciones duplicadas:', errorSync);
    }

    const lista = await prisma.asistencia.findMany({
      include: {
        asistentes: {
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let familias = 0; // familias que asistirán
    let declinadas = 0; // familias que no asistirán
    let adultos = 0;
    let ninosMenores = 0;
    let ninosMayores = 0;
    let personasNoAsisten = 0; // personas marcadas como "no asistirá" dentro de familias que sí van

    for (const a of lista) {
      if (a.estado === 'declinada') {
        declinadas++;
        continue;
      }
      familias++;
      for (const p of a.asistentes) {
        if (p.asiste === false) {
          personasNoAsisten++;
          continue;
        }
        const grupo = grupoDe(p);
        if (grupo === 'adulto') adultos++;
        else if (grupo === 'ninoMenor') ninosMenores++;
        else ninosMayores++;
      }
    }

    const ninos = ninosMenores + ninosMayores;
    const totalAsistentes = adultos + ninos;

    // Invitaciones enviadas: permite comparar cuántas familias ya respondieron
    // frente al total invitado (sin depender de las confirmaciones).
    let invitaciones = { total: 0, respondidas: 0, confirmadas: 0, declinadas: 0, sinResponder: 0 };
    try {
      const [total, confirmadasInv, declinadasInv] = await Promise.all([
        prisma.invitacion.count(),
        prisma.invitacion.count({ where: { estado: 'confirmada' } }),
        prisma.invitacion.count({ where: { estado: 'declinada' } }),
      ]);
      invitaciones = {
        total,
        respondidas: confirmadasInv + declinadasInv,
        confirmadas: confirmadasInv,
        declinadas: declinadasInv,
        sinResponder: Math.max(0, total - confirmadasInv - declinadasInv),
      };
    } catch (errorInv) {
      console.warn('⚠️ No se pudo calcular el resumen de invitaciones:', errorInv);
    }

    res.json({
      success: true,
      data: lista,
      resumen: {
        familias,
        declinadas,
        adultos,
        ninosMenores,
        ninosMayores,
        ninos,
        totalAsistentes, // personas que sí asistirán
        personasNoAsisten, // personas que no asistirán dentro de familias que sí van
        totalNoAsisten: declinadas + personasNoAsisten, // familias declinadas + personas sueltas
        totalRespuestas: lista.length, // confirmadas + declinadas
        invitaciones,
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

    // Si la confirmación venía de una invitación, se libera para que la familia
    // pueda responder de nuevo (antes quedaba "confirmada"/"declinada" para siempre).
    try {
      const liberadas = await prisma.invitacion.updateMany({
        where: { asistenciaId: id },
        data: { asistenciaId: null, fechaConfirmada: null, fechaDeclinada: null, estado: 'enviada' },
      });
      if (liberadas.count > 0) {
        console.log(`↩️ ${liberadas.count} invitación(es) liberada(s) para volver a responder`);
      }
    } catch (errorInv) {
      console.warn('⚠️ No se pudo liberar la invitación asociada:', errorInv);
    }

    res.json({
      success: true,
      message: `Confirmación de "${existente.nombreFamilia}" eliminada`,
    });
  } catch (error) {
    console.error('❌ Error al eliminar asistencia:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar asistencia' });
  }
}