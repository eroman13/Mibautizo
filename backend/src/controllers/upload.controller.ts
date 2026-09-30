/**
 * Controlador de subida de archivos
 *
 * Si Cloudflare R2 está configurado (ver lib/r2.ts), la imagen se sube al bucket
 * y se devuelve su URL pública. Si no, se mantiene el comportamiento anterior:
 * devolver un data URL (base64) que se guarda en la base de datos
 * (campo imagenUrl/portadaUrl).
 *
 * SEGURIDAD: la validación de las imágenes (formatos raster jpeg/png/webp/gif,
 * tamaño máximo y magic bytes) vive en lib/imagen.ts y se comparte con el álbum
 * de fotos.
 */

import { Request, Response } from 'express';
import { r2Configurado, r2ParcialmenteConfigurado, subirImagenR2 } from '../lib/r2';
import { ImagenInvalidaError, parsearImagenBase64 } from '../lib/imagen';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const { base64 } = req.body;

    let buffer: Buffer;
    let mime: string;
    try {
      ({ buffer, mime } = parsearImagenBase64(base64));
    } catch (errorValidacion) {
      if (errorValidacion instanceof ImagenInvalidaError) {
        return res.status(400).json({ success: false, error: errorValidacion.message });
      }
      throw errorValidacion;
    }

    console.log('✅ Imagen válida recibida');

    // 1) Si R2 está configurado, subir el archivo al bucket y devolver su URL pública
    if (r2Configurado()) {
      try {
        const imageUrl = await subirImagenR2(buffer, mime);
        return res.json({ success: true, imageUrl, storage: 'r2' });
      } catch (error) {
        // No rompemos la subida: si R2 falla se guarda como data URL
        console.error(
          '⚠️ Error subiendo a R2, se guardará como data URL:',
          error instanceof Error ? error.message : error
        );
      }
    } else if (r2ParcialmenteConfigurado()) {
      console.warn(
        '⚠️ R2 tiene credenciales pero falta R2_BUCKET o R2_PUBLIC_URL: se guardará como data URL'
      );
    }

    // 2) Sin R2: devolver la imagen como data URL para que se guarde en la base de datos
    res.json({
      success: true,
      imageUrl: base64,
      storage: 'base64',
    });
  } catch (error) {
    console.error('❌ Error en uploadImage:', error);
    res.status(500).json({
      success: false,
      error: 'Error al subir imagen',
    });
  }
};
