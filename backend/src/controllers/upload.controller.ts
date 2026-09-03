/**
 * Controlador de subida de archivos
 *
 * Devuelve la imagen como data URL (base64) directamente, sin guardarla en
 * el filesystem. La imagen se guarda en la base de datos (campo imagenUrl/portadaUrl).
 *
 * SEGURIDAD: solo se aceptan formatos raster (jpeg/png/webp/gif). Se rechazan
 * SVG, HTML y cualquier otro tipo (un SVG puede ejecutar scripts/XSS cuando se
 * abre directamente). También se limita el tamaño del archivo decodificado.
 */

import { Request, Response } from 'express';

// Formatos de imagen permitidos
const MIMES_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// Tamaño máximo en bytes (8 MB aprox) para la imagen decodificada
const MAX_BYTES = 8 * 1024 * 1024;

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const { base64 } = req.body;

    if (typeof base64 !== 'string' || !base64) {
      return res.status(400).json({
        success: false,
        error: 'base64 es requerido',
      });
    }

    // Parsear el encabezado data URL: data:<mime>;base64,<datos>
    const match = base64.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/s);
    if (!match) {
      return res.status(400).json({
        success: false,
        error: 'Solo se permiten imágenes JPEG, PNG, WebP o GIF',
      });
    }

    const mime = match[1];
    if (!MIMES_PERMITIDOS.has(mime)) {
      return res.status(400).json({
        success: false,
        error: 'Solo se permiten imágenes JPEG, PNG, WebP o GIF',
      });
    }

    const datosB64 = match[2];

    // Rechazar archivos demasiado pequeños (no es una imagen real) o enormes
    if (datosB64.length < 64) {
      return res.status(400).json({ success: false, error: 'La imagen es demasiado pequeña' });
    }

    // El tamaño decodificado ≈ (len/4)*3 (descontando padding). Si el string
    // supera ~11 MB (≈8 MB reales), se rechaza antes de decodificar.
    const padding = (datosB64.endsWith('==') ? 2 : datosB64.endsWith('=') ? 1 : 0);
    const aproxBytes = (datosB64.length / 4) * 3 - padding;
    if (aproxBytes > MAX_BYTES) {
      return res.status(400).json({ success: false, error: 'La imagen supera los 8 MB' });
    }

    // Verificación de "magic bytes" para confirmar que realmente es la imagen declarada
    const buffer = Buffer.from(datosB64, 'base64');
    const magicoValido =
      (mime === 'image/jpeg' && buffer.length > 2 && buffer[0] === 0xff && buffer[1] === 0xd8) ||
      (mime === 'image/png' && buffer.length > 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) ||
      (mime === 'image/gif' && buffer.length > 4 && buffer.toString('latin1', 0, 4) === 'GIF8') ||
      (mime === 'image/webp' && buffer.length > 12 && buffer.toString('latin1', 0, 4) === 'RIFF' && buffer.toString('latin1', 8, 12) === 'WEBP');

    if (!magicoValido) {
      return res.status(400).json({
        success: false,
        error: 'El archivo no es una imagen válida',
      });
    }

    console.log('✅ Imagen válida recibida (data URL)');

    // Devolver la imagen como data URL para que se guarde en la base de datos
    res.json({
      success: true,
      imageUrl: base64,
    });
  } catch (error) {
    console.error('❌ Error en uploadImage:', error);
    res.status(500).json({
      success: false,
      error: 'Error al subir imagen',
    });
  }
};
