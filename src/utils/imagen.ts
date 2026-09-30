/**
 * Utilidades de manipulación de imágenes en el navegador.
 *
 * Comprime y redimensiona imágenes antes de subirlas para reducir su peso: el
 * resultado es siempre un JPEG en base64 (data URL) que el backend valida,
 * guarda en Cloudflare R2 y publica por su URL pública.
 */

/** Formatos que el navegador puede decodificar y que el backend acepta. */
export const FORMATOS_SOPORTADOS = 'JPG, PNG, WebP o GIF';

/** Peso máximo del archivo original (una foto de móvil normal pesa 2-8 MB). */
export const MAX_BYTES_ORIGINAL = 40 * 1024 * 1024;

/** Tiempo máximo que damos a decodificar una foto antes de avisar al usuario. */
const TIEMPO_MAX_DECODIFICACION_MS = 60_000;

// Formatos que usan las cámaras (sobre todo iPhone) pero que la mayoría de los
// navegadores no sabe decodificar. Sirven solo para explicar el fallo: si el
// navegador sí puede leerlos (Safari en macOS/iOS), la foto se convierte a JPEG.
const MIMES_ILEGIBLES: Record<string, string> = {
  'image/heic': 'HEIC',
  'image/heif': 'HEIF',
  'image/heic-sequence': 'HEIC',
  'image/heif-sequence': 'HEIF',
  'image/tiff': 'TIFF',
  'image/x-tiff': 'TIFF',
  'image/x-canon-cr2': 'RAW (CR2)',
  'image/x-canon-cr3': 'RAW (CR3)',
  'image/x-nikon-nef': 'RAW (NEF)',
  'image/x-sony-arw': 'RAW (ARW)',
  'image/x-adobe-dng': 'RAW (DNG)',
  'image/x-olympus-orf': 'RAW (ORF)',
  'image/x-panasonic-rw2': 'RAW (RW2)',
  'image/x-fuji-raf': 'RAW (RAF)',
};

const EXTENSIONES_ILEGIBLES: Record<string, string> = {
  heic: 'HEIC',
  heif: 'HEIF',
  tif: 'TIFF',
  tiff: 'TIFF',
  cr2: 'RAW (CR2)',
  cr3: 'RAW (CR3)',
  nef: 'RAW (NEF)',
  arw: 'RAW (ARW)',
  dng: 'RAW (DNG)',
  orf: 'RAW (ORF)',
  rw2: 'RAW (RW2)',
  raf: 'RAW (RAF)',
};

/**
 * Detecta si un archivo viene en un formato que suele fallar al decodificar
 * (HEIC/HEIF de iPhone, TIFF o RAW) mirando el MIME y, si viene vacío, el
 * nombre del archivo (las fotos reenviadas por WhatsApp pierden el MIME).
 *
 * @param archivo Archivo elegido por el usuario
 * @returns Nombre legible del formato, o null si parece un formato normal
 */
export function formatoIlegible(archivo: File): string | null {
  const mime = (archivo.type || '').toLowerCase();
  if (MIMES_ILEGIBLES[mime]) return MIMES_ILEGIBLES[mime];

  const extension = (archivo.name || '').split('.').pop()?.toLowerCase() || '';
  return EXTENSIONES_ILEGIBLES[extension] || null;
}

/** Mensaje accionable cuando el navegador no pudo abrir la foto. */
function mensajeFormatoIlegible(archivo: File, formato: string): string {
  const consejoiPhone =
    formato === 'HEIC' || formato === 'HEIF'
      ? ' Es el formato de las fotos de iPhone: en el teléfono, Ajustes → Cámara → Formatos → "Más compatible" hace que las próximas salgan en JPG.'
      : '';

  return `La foto "${archivo.name}" está en formato ${formato} y este navegador no puede convertirla.${consejoiPhone} Solución rápida: envíatela por WhatsApp o correo, o hazle una captura de pantalla, y sube esa versión. Formatos que funcionan: ${FORMATOS_SOPORTADOS}.`;
}

/** Descripción corta del archivo (tipo y peso) para los mensajes de error. */
function describirArchivo(archivo: File): string {
  const pesoMb = archivo.size / (1024 * 1024);
  const peso = pesoMb >= 0.1 ? `${pesoMb.toFixed(1)} MB` : `${archivo.size} bytes`;
  return `${archivo.type || 'tipo no identificado'}, ${peso}`;
}

/**
 * Comprime y redimensiona una imagen antes de subirla.
 *
 * @param file Archivo de imagen original (File)
 * @param maxSize Dimensión máxima en píxeles (default 800)
 * @param quality Calidad de compresión JPEG (0-1, default 0.7)
 * @returns Promise<string> con el data URL comprimido (image/jpeg)
 * @throws Error con un mensaje listo para mostrar al usuario si la foto no se
 *         puede leer (formato no soportado por el navegador, archivo dañado…)
 */
export async function comprimirImagen(
  file: File,
  maxSize = 800,
  quality = 0.7
): Promise<string> {
  // Fallos rápidos y explicables: archivo vacío o desproporcionadamente grande
  if (file.size === 0) {
    throw new Error(
      `El archivo "${file.name}" está vacío o se descargó incompleto. Escoge otra copia de la foto.`
    );
  }

  if (file.size > MAX_BYTES_ORIGINAL) {
    const maxMb = Math.round(MAX_BYTES_ORIGINAL / (1024 * 1024));
    throw new Error(
      `La foto "${file.name}" pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB, más de los ${maxMb} MB que podemos procesar. Prueba con una versión más liviana.`
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    // Red de seguridad: en móviles una foto enorme puede quedar decodificando
    // sin dar señales de vida.
    const temporizador = setTimeout(() => {
      reject(
        new Error(
          `La foto "${file.name}" tardó demasiado en procesarse. Intenta con una foto más liviana o recarga la página.`
        )
      );
    }, TIEMPO_MAX_DECODIFICACION_MS);

    const fallar = (mensaje: string) => {
      clearTimeout(temporizador);
      reject(new Error(mensaje));
    };

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        clearTimeout(temporizador);

        let { width, height } = img;
        if (!width || !height) {
          fallar(`No pudimos leer las dimensiones de "${file.name}". El archivo puede estar dañado.`);
          return;
        }

        // Redimensionar manteniendo la proporción, limitando el lado más grande
        const maxDimension = Math.max(width, height);
        if (maxDimension > maxSize) {
          const ratio = maxSize / maxDimension;
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Dibujar la imagen redimensionada en un canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          fallar('No se pudo crear el contexto del canvas para procesar la imagen.');
          return;
        }

        // Fondo blanco para evitar transparencia en JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a data URL JPEG con la calidad indicada
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (!dataUrl || !dataUrl.startsWith('data:image/')) {
          fallar(`No pudimos convertir "${file.name}" a JPG. Intenta con otra foto.`);
          return;
        }

        resolve(dataUrl);
      };

      img.onerror = () => {
        // El navegador no pudo decodificar el archivo: casi siempre es HEIC/HEIF
        // (iPhone), TIFF/RAW, o un archivo dañado / a medio descargar.
        const formato = formatoIlegible(file);
        if (formato) {
          fallar(mensajeFormatoIlegible(file, formato));
          return;
        }

        fallar(
          `No pudimos procesar "${file.name}" (${describirArchivo(file)}). Puede estar dañada, descargada a medias o en un formato que este navegador no reconoce. Formatos que funcionan: ${FORMATOS_SOPORTADOS}.`
        );
      };

      img.src = reader.result as string;
    };

    reader.onerror = () => {
      fallar(
        `No pudimos leer el archivo "${file.name}". Cópialo a otra carpeta o inténtalo desde otro navegador.`
      );
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Genera el atributo `srcset` para servir imágenes en diferentes resoluciones
 * según el dispositivo/navegador. Solo funciona con URLs que aceptan el
 * parámetro `w=` (Pexels, Unsplash). Para data URLs (base64) devuelve undefined.
 *
 * @param url URL de la imagen
 * @returns String para el atributo srcset, o undefined si no aplica
 */
export function generarSrcSet(url: string): string | undefined {
  if (!url || url.startsWith('data:')) return undefined;
  if (!url.includes('w=')) return undefined;

  const conAncho = (w: number) => url.replace(/w=\d+/, `w=${w}`);

  return [
    `${conAncho(480)} 480w`,
    `${conAncho(800)} 800w`,
    `${conAncho(1200)} 1200w`,
  ].join(', ');
}

