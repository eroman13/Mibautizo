/**
 * Utilidades de manipulación de imágenes en el navegador.
 *
 * Comprime y redimensiona imágenes antes de subirlas para reducir su peso,
 * ya que se guardan como data URL (base64) en la base de datos.
 */

/**
 * Comprime y redimensiona una imagen antes de subirla.
 *
 * @param file Archivo de imagen original (File)
 * @param maxSize Dimensión máxima en píxeles (default 800)
 * @param quality Calidad de compresión JPEG (0-1, default 0.7)
 * @returns Promise<string> con el data URL comprimido (image/jpeg)
 */
export async function comprimirImagen(
  file: File,
  maxSize = 800,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

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
          reject(new Error('No se pudo crear el contexto del canvas'));
          return;
        }

        // Fondo blanco para evitar transparencia en JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a data URL JPEG con la calidad indicada
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
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

