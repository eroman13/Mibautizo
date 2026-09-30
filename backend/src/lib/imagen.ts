/**
 * Validación de imágenes recibidas como data URL base64.
 *
 * Centraliza las reglas que antes vivían solo en upload.controller.ts para que
 * tanto la subida del admin (portadas, regalos) como el álbum de fotos de los
 * invitados apliquen exactamente los mismos límites.
 *
 * SEGURIDAD: solo se aceptan formatos raster (jpeg/png/webp/gif). Se rechazan
 * SVG, HTML y cualquier otro tipo (un SVG puede ejecutar scripts/XSS cuando se
 * abre directamente). También se limita el tamaño del archivo decodificado y se
 * verifican los "magic bytes" para confirmar que el archivo es realmente la
 * imagen que declara ser.
 */

// Formatos de imagen permitidos
export const MIMES_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// Tamaño máximo por defecto en bytes (8 MB aprox) para la imagen decodificada
export const MAX_BYTES_IMAGEN = 8 * 1024 * 1024;

export interface ImagenParseada {
  buffer: Buffer;
  mime: string;
}

/** Error de validación de imagen: el mensaje es apto para mostrar al usuario. */
export class ImagenInvalidaError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ImagenInvalidaError';
  }
}

/**
 * Valida y decodifica un data URL de imagen.
 *
 * @param base64 Data URL con formato `data:<mime>;base64,<datos>`
 * @param maxBytes Tamaño máximo permitido del archivo decodificado
 * @throws ImagenInvalidaError si el data URL no es una imagen permitida
 */
export function parsearImagenBase64(
  base64: unknown,
  maxBytes: number = MAX_BYTES_IMAGEN
): ImagenParseada {
  if (typeof base64 !== 'string' || !base64) {
    throw new ImagenInvalidaError('base64 es requerido');
  }

  // Parsear el encabezado data URL: data:<mime>;base64,<datos>
  const match = base64.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/s);
  if (!match) {
    throw new ImagenInvalidaError('Solo se permiten imágenes JPEG, PNG, WebP o GIF');
  }

  const mime = match[1];
  if (!MIMES_PERMITIDOS.has(mime)) {
    throw new ImagenInvalidaError('Solo se permiten imágenes JPEG, PNG, WebP o GIF');
  }

  const datosB64 = match[2];

  // Rechazar archivos demasiado pequeños (no es una imagen real)
  if (datosB64.length < 64) {
    throw new ImagenInvalidaError('La imagen es demasiado pequeña');
  }

  // El tamaño decodificado ≈ (len/4)*3 (descontando padding). Se valida antes de
  // decodificar para no gastar memoria con payloads enormes.
  const padding = datosB64.endsWith('==') ? 2 : datosB64.endsWith('=') ? 1 : 0;
  const aproxBytes = (datosB64.length / 4) * 3 - padding;
  const maxMb = Math.round((maxBytes / (1024 * 1024)) * 10) / 10;
  if (aproxBytes > maxBytes) {
    throw new ImagenInvalidaError(`La imagen supera los ${maxMb} MB`);
  }

  // Verificación de "magic bytes" para confirmar que realmente es la imagen declarada
  const buffer = Buffer.from(datosB64, 'base64');
  const magicoValido =
    (mime === 'image/jpeg' && buffer.length > 2 && buffer[0] === 0xff && buffer[1] === 0xd8) ||
    (mime === 'image/png' &&
      buffer.length > 4 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47) ||
    (mime === 'image/gif' && buffer.length > 4 && buffer.toString('latin1', 0, 4) === 'GIF8') ||
    (mime === 'image/webp' &&
      buffer.length > 12 &&
      buffer.toString('latin1', 0, 4) === 'RIFF' &&
      buffer.toString('latin1', 8, 12) === 'WEBP');

  if (!magicoValido) {
    throw new ImagenInvalidaError('El archivo no es una imagen válida');
  }

  return { buffer, mime };
}
