/**
 * Controlador de subida de archivos
 *
 * Devuelve la imagen como data URL (base64) directamente, sin guardarla en
 * el filesystem. Esto es necesario porque Railway usa un filesystem efímero:
 * cualquier archivo guardado en disco se pierde en el siguiente redeploy.
 * La imagen se guarda en la base de datos (campo imagenUrl/portadaUrl).
 */

import { Request, Response } from 'express';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const { base64 } = req.body;

    if (!base64) {
      return res.status(400).json({
        success: false,
        error: 'base64 es requerido',
      });
    }

    // Validar que sea una imagen
    if (!base64.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'Solo se permiten imágenes',
      });
    }

    console.log('✅ Imagen recibida (data URL)');

    // Devolver la imagen como data URL para que se guarde en la base de datos
    res.json({
      success: true,
      imageUrl: base64,
    });
  } catch (error: any) {
    console.error('❌ Error en uploadImage:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al subir imagen',
    });
  }
};
