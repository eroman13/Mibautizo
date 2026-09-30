# Tarjetas QR para las mesas 🍽️📸

Generadas por `npm run qr:mesas` el 30-09-2026.

- **Evento:** bautizo de Antonia y Emilia — 10 de octubre de 2026
- **El QR apunta a:** https://bautizo-anto-emi.vercel.app/fotos

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `qr-fotos-mesas.png` | QR suelto en 1200 px (corrección de errores alta) para pegar en un diseño propio. |
| `qr-fotos-mesas.svg` | El mismo QR en vectorial: se amplía sin perder nitidez (Canva, Illustrator, Word). |
| `tarjetas-mesas-4-por-hoja.html` | Hoja A4 con **4 tarjetas** para cortar y poner una por mesa. |
| `tarjeta-mesas-1-por-hoja.html` | **Una tarjeta grande por hoja** (letrero para la entrada o el sector de la torta). |
| `tarjetas-mesas-4-por-hoja.pdf` | La hoja de 4 tarjetas **ya en PDF**: se imprime tal cual o se manda a una imprenta. |
| `tarjeta-mesas-1-por-hoja.pdf` | La tarjeta grande, ya en PDF. |

## Cómo imprimir

1. Doble clic en el archivo `.html` (se abre en el navegador).
2. `Cmd/Ctrl + P` → A4, márgenes *Predeterminado*, escala **100 %**, activar *gráficos de fondo*.
3. Si aparece un encabezado o pie con la dirección del archivo, desactívalos en el diálogo de impresión.
4. Guardar como PDF si lo vas a mandar a una imprenta, o imprimir directo y cortar por la línea de puntos.

## Antes de imprimir

Escanea un código con la cámara del teléfono: debe abrir el álbum de fotos. Si el dominio cambia,
vuelve a generar las tarjetas:

```bash
npm run qr:mesas -- --url https://mi-dominio-nuevo.cl/fotos
```

También puedes ver, descargar (PNG/SVG) o imprimir el QR desde el panel:
**Admin → 📸 Álbum de Fotos → “QR para las mesas”**.
