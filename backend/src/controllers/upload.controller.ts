/**
 * Controlador de subida de archivos
 */

import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

// Crear carpeta de uploads si no existe
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const { base64, filename } = req.body;

    if (!base64 || !filename) {
      return res.status(400).json({
        success: false,
        error: 'base64 y filename son requeridos',
      });
    }

    // Validar que sea una imagen
    if (!base64.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'Solo se permiten imágenes',
      });
    }

    // Extraer el tipo y datos
    const matches = base64.match(/^data:image\/([^;]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({
        success: false,
        error: 'Formato de imagen inválido',
      });
    }

    const [, ext, data] = matches;

    // Sanitizar nombre de archivo
    const safeName = filename
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '_')
      .slice(0, 100);

    // Generar nombre único con timestamp
    const timestamp = Date.now();
    const uniqueName = `${timestamp}_${safeName}`;
    const filePath = path.join(uploadsDir, uniqueName);

    // Guardar archivo
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(filePath, buffer);

    // Retornar URL relativa
    const imageUrl = `/uploads/${uniqueName}`;

    console.log('✅ Imagen subida:', imageUrl);

    res.json({
      success: true,
      imageUrl,
      filename: uniqueName,
    });
  } catch (error: any) {
    console.error('❌ Error en uploadImage:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al subir imagen',
    });
  }
};
