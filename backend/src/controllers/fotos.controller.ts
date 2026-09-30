/**
 * Controladores del álbum de fotos del evento
 *
 * - GET  /api/fotos              (público) lista solo las fotos aprobadas
 * - POST /api/fotos              (público) los invitados suben fotos (quedan pendientes de aprobación)
 * - GET  /api/admin/fotos        (admin)   lista todas las fotos + resumen por estado
 * - POST /api/admin/fotos        (admin)   sube una foto ya aprobada
 * - PUT  /api/admin/fotos/:id    (admin)   aprueba/rechaza (o vuelve a dejar pendiente)
 * - DELETE /api/admin/fotos/:id  (admin)   elimina la foto (también del bucket R2 si aplica)
 *
 * Si Cloudflare R2 está configurado (ver lib/r2.ts) la imagen se sube al bucket
 * (carpeta `fotos/`) y en la base de datos solo queda la URL pública. Si no,
 * se guarda como data URL siempre que no supere el límite seguro (evita inflar
 * PostgreSQL con fotos en base64).
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { r2Configurado, r2ParcialmenteConfigurado, subirImagenR2, eliminarImagenR2 } from '../lib/r2';
import { ImagenInvalidaError, parsearImagenBase64 } from '../lib/imagen';

// Tamaño máximo de una foto cuando NO hay R2 (se guarda en la base de datos)
const MAX_BYTES_FOTO_BASE64 = 3 * 1024 * 1024; // 3 MB

// Límites de texto (se recortan para no guardar basura)
const MAX_AUTOR = 80;
const MAX_MENSAJE = 280;

// Máximo de fotos devueltas en la galería pública
const MAX_FOTOS_PUBLICAS = 300;

// Estados válidos de una foto
const ESTADOS_VALIDOS = ['pendiente', 'aprobada', 'rechazada'];

interface FotoBody {
  base64?: string;
  autor?: string;
  mensaje?: string;
  invitacionToken?: string;
  estado?: string;
}

function limpiarTexto(valor: unknown, max: number): string | null {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim().replace(/\s+/g, ' ').slice(0, max);
  return limpio || null;
}

/**
 * Guarda la imagen: en R2 si está configurado, o como data URL si no.
 * Devuelve la URL y el modo de almacenamiento usado.
 */
async function almacenarImagen(
  base64: string,
  buffer: Buffer,
  mime: string
): Promise<{ url: string; storage: 'r2' | 'base64' } | { error: string }> {
  if (r2Configurado()) {
    try {
      const url = await subirImagenR2(buffer, mime, 'fotos');
      return { url, storage: 'r2' };
    } catch (error) {
      console.error(
        '⚠️ Error subiendo foto a R2, se intentará guardar como data URL:',
        error instanceof Error ? error.message : error
      );
    }
  } else if (r2ParcialmenteConfigurado()) {
    console.warn(
      '⚠️ R2 incompleto (falta R2_BUCKET o R2_PUBLIC_URL): la foto se guarda como data URL'
    );
  }

  // Sin R2: solo se aceptan fotos pequeñas para no inflar la base de datos
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  const aproxBytes = (base64.length / 4) * 3 - padding;
  if (aproxBytes > MAX_BYTES_FOTO_BASE64) {
    return {
      error:
        'La foto es muy pesada para guardarla en el servidor (máximo 3 MB). Intenta con otra foto más liviana.',
    };
  }

  return { url: base64, storage: 'base64' };
}

/**
 * Listar las fotos aprobadas del álbum (público)
 * GET /api/fotos
 */
export async function getFotosPublicas(req: Request, res: Response) {
  try {
    const fotos = await prisma.foto.findMany({
      where: { estado: 'aprobada' },
      orderBy: { createdAt: 'desc' },
      take: MAX_FOTOS_PUBLICAS,
      select: { id: true, url: true, autor: true, mensaje: true, createdAt: true },
    });

    res.json({ success: true, data: fotos, total: fotos.length });
  } catch (error) {
    console.error('❌ Error al obtener fotos públicas:', error);
    res.status(500).json({ success: false, error: 'Error al obtener las fotos' });
  }
}

/**
 * Subir una foto al álbum (público, queda pendiente de aprobación)
 * POST /api/fotos
 */
export async function subirFotoPublica(req: Request, res: Response) {
  try {
    const body: FotoBody = req.body || {};

    let buffer: Buffer;
    let mime: string;
    try {
      // Mismo límite técnico que la subida del admin (8 MB); si no hay R2 se
      // aplica además el límite de 3 MB antes de guardar en la base de datos.
      ({ buffer, mime } = parsearImagenBase64(body.base64));
    } catch (errorValidacion) {
      if (errorValidacion instanceof ImagenInvalidaError) {
        return res.status(400).json({ success: false, error: errorValidacion.message });
      }
      throw errorValidacion;
    }

    const almacenada = await almacenarImagen(body.base64 as string, buffer, mime);
    if ('error' in almacenada) {
      return res.status(400).json({ success: false, error: almacenada.error });
    }

    // Se vincula a la invitación si la familia subió la foto desde su enlace
    const invitacionToken = limpiarTexto(body.invitacionToken, 120);

    const foto = await prisma.foto.create({
      data: {
        url: almacenada.url,
        storage: almacenada.storage,
        autor: limpiarTexto(body.autor, MAX_AUTOR),
        mensaje: limpiarTexto(body.mensaje, MAX_MENSAJE),
        invitacionToken,
        estado: 'pendiente',
      },
      select: { id: true, autor: true, mensaje: true, estado: true, createdAt: true },
    });

    console.log(
      `📸 Foto recibida de ${foto.autor || 'invitado anónimo'} (pendiente de aprobación)`
    );

    res.json({
      success: true,
      message: '¡Gracias por compartir tu foto! Se publicará cuando los papás la revisen 💕',
      data: foto,
    });
  } catch (error) {
    console.error('❌ Error al subir foto:', error);
    res.status(500).json({ success: false, error: 'Error al subir la foto' });
  }
}

/**
 * Listar todas las fotos para el panel admin
 * GET /api/admin/fotos
 */
export async function getFotosAdmin(req: Request, res: Response) {
  try {
    const fotos = await prisma.foto.findMany({ orderBy: { createdAt: 'desc' } });

    const resumen = {
      total: fotos.length,
      pendientes: fotos.filter((f) => f.estado === 'pendiente').length,
      aprobadas: fotos.filter((f) => f.estado === 'aprobada').length,
      rechazadas: fotos.filter((f) => f.estado === 'rechazada').length,
    };

    res.json({ success: true, data: fotos, resumen });
  } catch (error) {
    console.error('❌ Error al obtener fotos:', error);
    res.status(500).json({ success: false, error: 'Error al obtener las fotos' });
  }
}

/**
 * Subir una foto desde el panel admin (se aprueba automáticamente)
 * POST /api/admin/fotos
 */
export async function subirFotoAdmin(req: Request, res: Response) {
  try {
    const body: FotoBody = req.body || {};

    let buffer: Buffer;
    let mime: string;
    try {
      ({ buffer, mime } = parsearImagenBase64(body.base64));
    } catch (errorValidacion) {
      if (errorValidacion instanceof ImagenInvalidaError) {
        return res.status(400).json({ success: false, error: errorValidacion.message });
      }
      throw errorValidacion;
    }

    const almacenada = await almacenarImagen(body.base64 as string, buffer, mime);
    if ('error' in almacenada) {
      return res.status(400).json({ success: false, error: almacenada.error });
    }

    const estado = body.estado && ESTADOS_VALIDOS.includes(body.estado) ? body.estado : 'aprobada';

    const foto = await prisma.foto.create({
      data: {
        url: almacenada.url,
        storage: almacenada.storage,
        autor: limpiarTexto(body.autor, MAX_AUTOR) || 'Administración',
        mensaje: limpiarTexto(body.mensaje, MAX_MENSAJE),
        estado,
      },
    });

    console.log(`📸 Foto subida por el admin (${estado})`);

    res.json({ success: true, data: foto });
  } catch (error) {
    console.error('❌ Error al subir foto (admin):', error);
    res.status(500).json({ success: false, error: 'Error al subir la foto' });
  }
}


/**
 * Aprobar / rechazar una foto (admin)
 * PUT /api/admin/fotos/:id
 */
export async function actualizarEstadoFoto(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const { estado } = (req.body || {}) as { estado?: string };
    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: `Estado inválido. Usa uno de: ${ESTADOS_VALIDOS.join(', ')}`,
      });
    }

    const existente = await prisma.foto.findUnique({ where: { id } });
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Foto no encontrada' });
    }

    const foto = await prisma.foto.update({ where: { id }, data: { estado } });

    console.log(`🖼️ Foto ${id} marcada como ${estado}`);
    res.json({ success: true, data: foto });
  } catch (error) {
    console.error('❌ Error al actualizar foto:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar la foto' });
  }
}

/**
 * Eliminar una foto (admin). También borra el archivo de R2 si aplica.
 * DELETE /api/admin/fotos/:id
 */
export async function eliminarFoto(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const existente = await prisma.foto.findUnique({ where: { id } });
    if (!existente) {
      return res.status(404).json({ success: false, error: 'Foto no encontrada' });
    }

    await prisma.foto.delete({ where: { id } });

    if (existente.storage === 'r2') {
      try {
        await eliminarImagenR2(existente.url);
      } catch (errorR2) {
        // La fila ya se eliminó: si R2 falla solo se deja registro en los logs
        console.warn(
          '⚠️ La foto se eliminó de la base de datos pero no del bucket R2:',
          errorR2 instanceof Error ? errorR2.message : errorR2
        );
      }
    }

    console.log(`🗑️ Foto ${id} eliminada`);
    res.json({ success: true, message: 'Foto eliminada' });
  } catch (error) {
    console.error('❌ Error al eliminar foto:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar la foto' });
  }
}

