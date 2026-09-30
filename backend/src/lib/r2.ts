/**
 * Almacenamiento de imágenes en Cloudflare R2 (API compatible con S3).
 *
 * Variables de entorno necesarias:
 *   R2_ACCESS_KEY_ID      - Access Key ID del token R2 (32 hex)
 *   R2_SECRET_ACCESS_KEY  - Secret Access Key del token R2 (64 hex)
 *   R2_BUCKET             - Nombre del bucket
 *   R2_PUBLIC_URL         - URL pública del bucket (https://pub-xxxx.r2.dev o
 *                           un dominio propio, SIN barra final)
 *
 * Opcionales:
 *   R2_ACCOUNT_ID - si se define, se deriva el endpoint
 *                   https://<account_id>.r2.cloudflarestorage.com
 *   R2_ENDPOINT   - endpoint explícito (tiene prioridad sobre R2_ACCOUNT_ID)
 *   R2_PREFIX     - carpeta raíz dentro del bucket (por defecto "imagenes")
 *
 * Si falta cualquiera de las variables obligatorias, `r2Configurado()` devuelve
 * false y el controlador mantiene el comportamiento anterior (guardar la imagen
 * como data URL base64 en la base de datos), así que la app nunca deja de
 * funcionar por no tener R2 configurado.
 */

import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import crypto from 'crypto';

interface ConfigR2 {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
  prefijo: string;
}

// Se leen en cada llamada (no al importar) para no depender del orden en que
// dotenv carga las variables respecto a los imports.
function cfg(): ConfigR2 {
  const accountId = (process.env.R2_ACCOUNT_ID || '').trim();
  const endpoint = (
    process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '')
  )
    .trim()
    .replace(/\/+$/, '');

  return {
    endpoint,
    accessKeyId: (process.env.R2_ACCESS_KEY_ID || '').trim(),
    secretAccessKey: (process.env.R2_SECRET_ACCESS_KEY || '').trim(),
    bucket: (process.env.R2_BUCKET || '').trim(),
    publicUrl: (process.env.R2_PUBLIC_URL || '').trim().replace(/\/+$/, ''),
    prefijo: (process.env.R2_PREFIX || 'imagenes').trim().replace(/^\/+|\/+$/g, ''),
  };
}

/** true solo si están todas las variables obligatorias de R2. */
export function r2Configurado(): boolean {
  const c = cfg();
  return Boolean(c.endpoint && c.accessKeyId && c.secretAccessKey && c.bucket && c.publicUrl);
}

/** true si las credenciales están pero falta el bucket o la URL pública. */
export function r2ParcialmenteConfigurado(): boolean {
  const c = cfg();
  const tieneCredenciales = Boolean(c.endpoint && c.accessKeyId && c.secretAccessKey);
  return tieneCredenciales && !(c.bucket && c.publicUrl);
}

let cliente: S3Client | null = null;
let firmaCliente = '';

function getCliente(): S3Client {
  const c = cfg();
  const firma = `${c.endpoint}|${c.accessKeyId}`;
  if (!cliente || firmaCliente !== firma) {
    cliente = new S3Client({
      region: 'auto',
      endpoint: c.endpoint,
      credentials: {
        accessKeyId: c.accessKeyId,
        secretAccessKey: c.secretAccessKey,
      },
    });
    firmaCliente = firma;
  }
  return cliente;
}

const EXTENSION_POR_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/**
 * Genera una key única y ordenada por fecha: imagenes/2026-09-28/<hex>.<ext>
 * Si se indica `categoria` (ej. "fotos"), se agrega como subcarpeta:
 * imagenes/fotos/2026-09-28/<hex>.<ext>
 */
export function generarKey(mime: string, categoria?: string): string {
  const c = cfg();
  const extension = EXTENSION_POR_MIME[mime] || 'bin';
  const fecha = new Date().toISOString().slice(0, 10);
  const aleatorio = crypto.randomBytes(12).toString('hex');
  const subcarpeta = (categoria || '').trim().replace(/^\/+|\/+$/g, '');
  const partes = [c.prefijo, subcarpeta, fecha].filter(Boolean);
  return `${partes.join('/')}/${aleatorio}.${extension}`;
}

/**
 * Sube la imagen a R2 y devuelve su URL pública.
 * Lanza si R2 no está configurado o si la subida falla (lo maneja el controlador).
 */
export async function subirImagenR2(
  buffer: Buffer,
  mime: string,
  categoria?: string
): Promise<string> {
  const c = cfg();
  if (!r2Configurado()) {
    throw new Error('R2 no está configurado');
  }

  const key = generarKey(mime, categoria);

  await getCliente().send(
    new PutObjectCommand({
      Bucket: c.bucket,
      Key: key,
      Body: buffer,
      ContentType: mime,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  console.log(`☁️ Imagen subida a R2: ${c.bucket}/${key}`);
  return `${c.publicUrl}/${key}`;
}

/**
 * Elimina de R2 un archivo a partir de su URL pública.
 * Devuelve true si se eliminó; false si la URL no pertenece al bucket público
 * o si R2 no está configurado (en esos casos no hay nada que borrar).
 */
export async function eliminarImagenR2(url: string): Promise<boolean> {
  const c = cfg();
  if (!r2Configurado() || !url) return false;
  if (!url.startsWith(`${c.publicUrl}/`)) return false;

  const key = url.slice(c.publicUrl.length + 1);
  if (!key) return false;

  await getCliente().send(
    new DeleteObjectCommand({
      Bucket: c.bucket,
      Key: key,
    })
  );

  console.log(`🗑️ Imagen eliminada de R2: ${c.bucket}/${key}`);
  return true;
}
