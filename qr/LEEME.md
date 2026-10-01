# Tarjetas QR para las mesas 🍽️📸

Generadas por `npm run qr:mesas` el 01-10-2026.

- **Evento:** bautizo de Antonia y Emilia — 10 de octubre de 2026
- **El QR apunta a:** https://bautizo-anto-emi.vercel.app/fotos

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `qr-fotos-mesas.png` | QR suelto en 1200 px (corrección de errores alta) para pegar en un diseño propio. |
| `qr-fotos-mesas.svg` | El mismo QR en vectorial: se amplía sin perder nitidez (Canva, Illustrator, Word). |
| `tarjetas-mesas-4-por-hoja.pdf` | Hoja A4 **vertical** con **4 tarjetas** (2×2) para cortar y poner una por mesa. |
| `tarjeta-mesas-1-por-hoja.pdf` | **Una tarjeta grande** por hoja A4 vertical (letrero para la entrada o el sector de la torta). |
| `tarjetas-mesas-4-por-hoja-horizontal.pdf` | La hoja de 4 tarjetas, pero en A4 **apaisada (horizontal)**. |
| `tarjeta-mesas-1-por-hoja-horizontal.pdf` | La tarjeta grande en A4 **apaisada (horizontal)**. |
| *(los mismos cuatro nombres en `.html`)* | Las plantillas imprimibles desde el navegador, si prefieres usar `Cmd/Ctrl + P`. |

## Vertical u horizontal, ¿cuál elijo?

- **Vertical (retrato):** el QR va arriba y el texto debajo. La tarjeta queda alta y angosta.
- **Horizontal (apaisada):** el QR va **a la izquierda** y el texto a la derecha. La tarjeta queda
  ancha y baja: se lee de lejos y sirve para **doblarla por la mitad** y dejarla parada sobre la
  mesa (tipo carpeta) o para pegarla en el respaldo de una silla.
- El código QR es el mismo en todas las versiones; solo cambia la forma de la tarjeta.

## Cómo imprimir

1. Doble clic en el archivo `.html` (se abre en el navegador).
2. `Cmd/Ctrl + P` → A4, orientación **Vertical** o **Horizontal** según el archivo que abriste
   (los PDF ya vienen con la orientación correcta), márgenes *Predeterminado*, escala **100 %**,
   activar *gráficos de fondo*.
3. Si aparece un encabezado o pie con la dirección del archivo, desactívalos en el diálogo de impresión.
4. Guardar como PDF si lo vas a mandar a una imprenta, o imprimir directo y cortar por la línea de puntos.
5. Si la tarjeta sale más chica de lo esperado o con el borde blanco desigual, elige márgenes
   **Ninguno**: la plantilla ya viene medida exacta para A4 (8 mm de borde).

## Antes de imprimir

Escanea un código con la cámara del teléfono: debe abrir el álbum de fotos. Si el dominio cambia,
vuelve a generar las tarjetas:

```bash
npm run qr:mesas -- --url https://mi-dominio-nuevo.cl/fotos
```

También puedes ver, descargar (PNG/SVG) o imprimir el QR desde el panel:
**Admin → 📸 Álbum de Fotos → “QR para las mesas”** (ahí eliges 1 o 4 tarjetas por hoja y si la
hoja va en vertical o en horizontal).
