#!/usr/bin/env node
/**
 * Genera las tarjetas con código QR para las mesas del evento.
 *
 * Salidas (en la carpeta `qr/`):
 *   - qr-fotos-mesas.png              → QR suelto, listo para diseñar (1200 px, corrección H)
 *   - qr-fotos-mesas.svg              → misma versión en vectorial (Canva, Illustrator, Word…)
 *   - tarjetas-mesas-4-por-hoja.html  → hoja A4 vertical con 4 tarjetas (2x2) para cortar
 *   - tarjeta-mesas-1-por-hoja.html   → una tarjeta grande por hoja A4 vertical (letrero)
 *   - los mismos dos en A4 **apaisada** (`…-horizontal.html`): el QR queda a la izquierda
 *     y el texto a la derecha, así la tarjeta es ancha y baja
 *   - los cuatro archivos también en .pdf (si hay Chrome o Edge instalado)
 *
 * El QR apunta al álbum público (`/fotos`) del sitio. Al final el script **decodifica el PNG
 * generado** y comprueba que el contenido sea exactamente la URL, para no imprimir un QR roto.
 *
 * Uso:
 *   npm run qr:mesas
 *   npm run qr:mesas -- --url https://mi-dominio.cl/fotos
 *   npm run qr:mesas -- --nombres "Antonia y Emilia" --fecha "10 de octubre de 2026"
 *   npm run qr:mesas -- --sin-api          (no consulta la API para nombres/fecha)
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULTS = {
  url: 'https://bautizo-anto-emi.vercel.app/fotos',
  api: 'https://mibautizo-production.up.railway.app/api',
  nombres: 'Antonia y Emilia',
  fecha: '10 de octubre de 2026',
  lugar: '',
  salida: 'qr',
  tamano: 1200,
};

function leerArgs(argv) {
  const opciones = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const clave = arg.slice(2);
    if (clave === 'sin-api') {
      opciones.sinApi = true;
      continue;
    }
    opciones[clave] = argv[i + 1];
    i += 1;
  }
  return opciones;
}

const args = leerArgs(process.argv.slice(2));
const config = {
  url: args.url || DEFAULTS.url,
  api: args.api || DEFAULTS.api,
  nombres: args.nombres || DEFAULTS.nombres,
  fecha: args.fecha || DEFAULTS.fecha,
  lugar: args.lugar || DEFAULTS.lugar,
  salida: path.resolve(RAIZ, args.salida || DEFAULTS.salida),
  tamano: Number(args.tamano || DEFAULTS.tamano),
};

const log = (icono, texto) => console.log(`${icono} ${texto}`);

/** Intenta traer nombres y fecha reales desde la API (best-effort). */
async function datosDelEvento() {
  if (args.sinApi) return null;
  try {
    const respuesta = await fetch(`${config.api}/evento`, { signal: AbortSignal.timeout(8000) });
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    const { data } = await respuesta.json();
    if (!data) return null;
    const nombres = [data.nombreMelliza1, data.nombreMelliza2].filter(Boolean).join(' y ');
    const fecha = data.fecha ? formatearFecha(data.fecha) : null;
    log('ℹ️', `Nombres y fecha tomados de la API: ${nombres} · ${fecha}`);
    return {
      nombres: nombres || config.nombres,
      fecha: fecha || config.fecha,
    };
  } catch (error) {
    log('⚠️', `No se pudo consultar la API (${error.message}); uso los valores por defecto.`);
    return null;
  }
}

function formatearFecha(iso) {
  const meses = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  const [anio, mes, dia] = String(iso).slice(0, 10).split('-').map(Number);
  if (!anio || !mes || !dia) return config.fecha;
  return `${dia} de ${meses[mes - 1]} de ${anio}`;
}

/** Genera y verifica el QR. Devuelve { png, svg, base64 }. */
async function generarQr(texto) {
  const png = await QRCode.toBuffer(texto, {
    type: 'png',
    errorCorrectionLevel: 'H',
    width: config.tamano,
    margin: 4,
    color: { dark: '#000000ff', light: '#ffffffff' },
  });

  const svg = await QRCode.toString(texto, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 4,
    color: { dark: '#000000', light: '#ffffff' },
  });

  // Verificación: se decodifica el PNG y se compara con la URL esperada.
  const imagen = PNG.sync.read(png);
  const pixeles = new Uint8ClampedArray(
    imagen.data.buffer,
    imagen.data.byteOffset,
    imagen.data.byteLength
  );
  const leido = jsQR(pixeles, imagen.width, imagen.height);
  if (!leido) throw new Error('el QR generado no se pudo decodificar (revisa la URL o el nivel de corrección)');
  if (leido.data !== texto) throw new Error(`el QR contiene "${leido.data}" en vez de "${texto}"`);

  return { png, svg, base64: png.toString('base64') };
}

/**
 * Tarjeta individual. Va dividida en tres bloques (cabecera, QR y pie) para poder cambiar
 * el orden según la orientación: en vertical se apilan y en horizontal el QR pasa a la
 * izquierda con el texto a la derecha.
 */
function tarjeta({ nombres, fecha, lugar, base64, url, orientacion }) {
  const dominio = url.replace(/^https?:\/\//, '');
  const horizontal = orientacion === 'horizontal';
  return `
      <article class="tarjeta${horizontal ? ' tarjeta--horizontal' : ''}">
        <div class="cabecera">
          <p class="eyebrow">📸 Comparte tus fotos</p>
          <h1>Bautizo de<br /><span>${nombres}</span></h1>
          <p class="fecha">${fecha}${lugar ? ` · ${lugar}` : ''}</p>
        </div>
        <div class="qr">
          <img src="data:image/png;base64,${base64}" alt="Código QR para subir fotos del bautizo" />
        </div>
        <div class="pie">
          <p class="scan">Escanea con la cámara de tu teléfono</p>
          <ol class="pasos">
            <li><b>1</b> Escanea el código</li>
            <li><b>2</b> Elige y envía tus fotos</li>
            <li><b>3</b> Los papás las aprueban y aparecen en la galería</li>
          </ol>
          <p class="url">${dominio}</p>
        </div>
      </article>`;
}

const ESTILOS = (orientacion) => `
  :root {
    --rosa: #b0336f;
    --rosa-suave: #ffb3d9;
    --lavanda: #e0bbe4;
    --tinta: #3f3d56;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: var(--tinta);
    background: #eef0f3;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .ayuda {
    max-width: 194mm;
    margin: 14px auto 0;
    padding: 14px 18px;
    background: #fff;
    border-left: 4px solid var(--rosa-suave);
    border-radius: 10px;
    font-size: 13px;
    line-height: 1.65;
    box-shadow: 0 2px 10px rgba(63, 61, 86, 0.08);
  }
  .ayuda h1 { font-size: 15px; margin: 0 0 6px; font-family: Georgia, serif; }
  .ayuda ol { margin: 8px 0 0 20px; padding: 0; }
  .ayuda code { background: #f3f4f6; padding: 1px 5px; border-radius: 4px; font-size: 12px; }
  .hoja {
    width: 194mm;
    height: 270mm;
    margin: 14px auto;
    padding: 0;
    display: grid;
    gap: 5mm;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    background: #fff;
    box-shadow: 0 8px 30px rgba(63, 61, 86, 0.16);
  }
  .hoja--4 {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  }
  .tarjeta {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 6mm 5mm;
    border: 1.5px dashed #cbd5e1;
    border-radius: 6mm;
    background: linear-gradient(160deg, #ffffff 0%, #fff6fb 55%, #f8f3fd 100%);
    overflow: hidden;
  }
  .cabecera,
  .pie {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .eyebrow {
    margin: 0;
    font-size: 10.5pt;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--rosa);
  }
  .tarjeta h1 {
    margin: 2mm 0 0;
    font-family: Georgia, 'Times New Roman', serif;
    font-weight: 600;
    font-size: 22pt;
    line-height: 1.12;
    color: var(--tinta);
  }
  .hoja--4 .tarjeta h1 { font-size: 16pt; }
  .tarjeta h1 span { color: var(--rosa); }
  .fecha { margin: 1.5mm 0 0; font-size: 9.5pt; color: #6b7280; }
  .hoja--4 .fecha { font-size: 8.5pt; }
  .qr {
    margin: 4mm 0 2.5mm;
    padding: 3.5mm;
    background: #fff;
    border: 0.4mm solid #e5e7eb;
    border-radius: 4mm;
  }
  .qr img { display: block; width: 105mm; height: 105mm; }
  .hoja--4 .qr img { width: 50mm; height: 50mm; }
  .scan { margin: 0 0 3mm; font-size: 10.5pt; font-weight: 600; }
  .hoja--4 .scan { font-size: 9.5pt; margin-bottom: 2mm; }
  .pasos {
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: 10pt;
    line-height: 1.55;
    color: #4b5563;
  }
  .hoja--4 .pasos { font-size: 8.8pt; }
  .pasos li { display: flex; align-items: center; gap: 5px; justify-content: center; }
  .pasos b {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 4.6mm;
    height: 4.6mm;
    border-radius: 50%;
    background: var(--rosa-suave);
    color: #7a1244;
    font-size: 7.5pt;
    flex: 0 0 auto;
  }
  .url { margin: 3mm 0 0; font-size: 8pt; letter-spacing: 0.06em; color: #9ca3af; }

  /* ------------------------------------------------------------------ *
   *  Hoja apaisada (horizontal): el QR va a la izquierda y el texto a
   *  la derecha, así la tarjeta queda ancha y baja.
   * ------------------------------------------------------------------ */
  .hoja--horizontal {
    width: 281mm;
    height: 194mm;
  }
  .tarjeta--horizontal {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    align-content: center;
    justify-items: start;
    column-gap: 9mm;
    row-gap: 3mm;
    text-align: left;
    padding: 8mm 10mm;
  }
  .tarjeta--horizontal .cabecera { grid-column: 2; grid-row: 1; align-items: flex-start; align-self: end; }
  .tarjeta--horizontal .qr { grid-column: 1; grid-row: 1 / span 2; margin: 0; }
  .tarjeta--horizontal .pie { grid-column: 2; grid-row: 2; align-items: flex-start; align-self: start; }
  .tarjeta--horizontal .pasos li { justify-content: flex-start; }
  .hoja--horizontal .qr img { width: 115mm; height: 115mm; }
  .hoja--horizontal .tarjeta h1 { font-size: 26pt; }
  .hoja--horizontal .eyebrow { font-size: 11pt; }
  .hoja--horizontal .fecha { font-size: 11pt; }
  .hoja--horizontal .scan { font-size: 12pt; }
  .hoja--horizontal .pasos { font-size: 11pt; }
  .hoja--horizontal .url { font-size: 9pt; }
  /* Cuatro tarjetas en hoja apaisada: 2 columnas x 2 filas, QR más pequeño */
  .hoja--horizontal.hoja--4 .tarjeta { padding: 5mm; column-gap: 6mm; row-gap: 2mm; }
  .hoja--horizontal.hoja--4 .qr { padding: 2.5mm; }
  .hoja--horizontal.hoja--4 .qr img { width: 60mm; height: 60mm; }
  .hoja--horizontal.hoja--4 .tarjeta h1 { font-size: 14pt; }
  .hoja--horizontal.hoja--4 .eyebrow { font-size: 8.5pt; letter-spacing: 0.1em; }
  .hoja--horizontal.hoja--4 .fecha { font-size: 8.5pt; }
  .hoja--horizontal.hoja--4 .scan { font-size: 9pt; }
  .hoja--horizontal.hoja--4 .pasos { font-size: 8.5pt; }
  .hoja--horizontal.hoja--4 .url { font-size: 7.5pt; }

  @page { size: A4 ${orientacion === 'horizontal' ? 'landscape' : 'portrait'}; margin: 8mm; }
  @media print {
    body { background: #fff; }
    .ayuda { display: none; }
    .hoja {
      margin: 0;
      box-shadow: none;
      break-after: page;
      page-break-after: always;
    }
    .hoja:last-of-type { break-after: auto; page-break-after: auto; }
    .tarjeta { break-inside: avoid; page-break-inside: avoid; }
  }
`;


/** Documento HTML imprimible con 1 o 4 tarjetas por hoja A4, en vertical o apaisada. */
function plantilla({ porHoja, orientacion, nombres, fecha, lugar, base64, url }) {
  const horizontal = orientacion === 'horizontal';
  const tarjetas = Array.from({ length: porHoja }, () =>
    tarjeta({ nombres, fecha, lugar, base64, url, orientacion })
  ).join('\n');

  const clases = ['hoja'];
  if (porHoja === 4) clases.push('hoja--4');
  if (horizontal) clases.push('hoja--horizontal');

  return `<!doctype html>
<html lang="es-CL">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Tarjetas QR para las mesas · Bautizo de ${nombres}${horizontal ? ' (horizontal)' : ''}</title>
    <style>${ESTILOS(orientacion)}</style>
  </head>
  <body>
    <div class="ayuda">
      <h1>🖨️ Cómo imprimir estas tarjetas</h1>
      <p><b>A4 ${horizontal ? 'apaisada (horizontal)' : 'vertical (retrato)'}</b> · ${
        porHoja === 4 ? '4 tarjetas por hoja' : 'una tarjeta por hoja'
      }${horizontal ? ' · el QR queda a la izquierda' : ''}</p>
      <ol>
        <li>Abre el diálogo de impresión con <code>Cmd/Ctrl + P</code>.</li>
        <li>Destino: tu impresora o <b>“Guardar como PDF”</b>.</li>
        <li>Tamaño <b>A4</b>, orientación <b>${horizontal ? 'Horizontal' : 'Vertical'}</b>, márgenes <b>Predeterminado</b>, escala <b>100 %</b> (no “ajustar a la página”) y activa <b>gráficos de fondo</b>.</li>
        <li>Las tarjetas están marcadas con línea de puntos: <b>corta por el borde</b>.</li>
        <li>Si el navegador agrega encabezado o pie con la dirección, <b>desactívalos</b> en el diálogo de impresión.</li>
        <li>El código apunta a <code>${url}</code> — antes de la impresión definitiva, escanéalo con tu teléfono.</li>
      </ol>
      <p>Este recuadro no se imprime.</p>
    </div>
    <section class="${clases.join(' ')}">${tarjetas}
    </section>
  </body>
</html>
`;
}

function leeme({ nombres, fecha, url }) {
  return `# Tarjetas QR para las mesas 🍽️📸

Generadas por \`npm run qr:mesas\` el ${new Date().toLocaleDateString('es-CL')}.

- **Evento:** bautizo de ${nombres} — ${fecha}
- **El QR apunta a:** ${url}

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| \`qr-fotos-mesas.png\` | QR suelto en 1200 px (corrección de errores alta) para pegar en un diseño propio. |
| \`qr-fotos-mesas.svg\` | El mismo QR en vectorial: se amplía sin perder nitidez (Canva, Illustrator, Word). |
| \`tarjetas-mesas-4-por-hoja.pdf\` | Hoja A4 **vertical** con **4 tarjetas** (2×2) para cortar y poner una por mesa. |
| \`tarjeta-mesas-1-por-hoja.pdf\` | **Una tarjeta grande** por hoja A4 vertical (letrero para la entrada o el sector de la torta). |
| \`tarjetas-mesas-4-por-hoja-horizontal.pdf\` | La hoja de 4 tarjetas, pero en A4 **apaisada (horizontal)**. |
| \`tarjeta-mesas-1-por-hoja-horizontal.pdf\` | La tarjeta grande en A4 **apaisada (horizontal)**. |
| *(los mismos cuatro nombres en \`.html\`)* | Las plantillas imprimibles desde el navegador, si prefieres usar \`Cmd/Ctrl + P\`. |

## Vertical u horizontal, ¿cuál elijo?

- **Vertical (retrato):** el QR va arriba y el texto debajo. La tarjeta queda alta y angosta.
- **Horizontal (apaisada):** el QR va **a la izquierda** y el texto a la derecha. La tarjeta queda
  ancha y baja: se lee de lejos y sirve para **doblarla por la mitad** y dejarla parada sobre la
  mesa (tipo carpeta) o para pegarla en el respaldo de una silla.
- El código QR es el mismo en todas las versiones; solo cambia la forma de la tarjeta.

## Cómo imprimir

1. Doble clic en el archivo \`.html\` (se abre en el navegador).
2. \`Cmd/Ctrl + P\` → A4, orientación **Vertical** o **Horizontal** según el archivo que abriste
   (los PDF ya vienen con la orientación correcta), márgenes *Predeterminado*, escala **100 %**,
   activar *gráficos de fondo*.
3. Si aparece un encabezado o pie con la dirección del archivo, desactívalos en el diálogo de impresión.
4. Guardar como PDF si lo vas a mandar a una imprenta, o imprimir directo y cortar por la línea de puntos.
5. Si la tarjeta sale más chica de lo esperado o con el borde blanco desigual, elige márgenes
   **Ninguno**: la plantilla ya viene medida exacta para A4 (8 mm de borde).

## Antes de imprimir

Escanea un código con la cámara del teléfono: debe abrir el álbum de fotos. Si el dominio cambia,
vuelve a generar las tarjetas:

\`\`\`bash
npm run qr:mesas -- --url https://mi-dominio-nuevo.cl/fotos
\`\`\`

También puedes ver, descargar (PNG/SVG) o imprimir el QR desde el panel:
**Admin → 📸 Álbum de Fotos → “QR para las mesas”** (ahí eliges 1 o 4 tarjetas por hoja y si la
hoja va en vertical o en horizontal).
`;
}

const RUTAS_NAVEGADOR = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

/** Busca un navegador capaz de convertir HTML a PDF (Chrome, Chromium o Edge). */
function buscarNavegador() {
  return RUTAS_NAVEGADOR.find((ruta) => fs.existsSync(ruta)) || null;
}

/**
 * Convierte un HTML imprimible en PDF con el navegador, para dejar las tarjetas listas
 * (sin encabezado ni pie con la dirección del archivo).
 */
function htmlAPdf(navegador, html, pdf) {
  const resultado = spawnSync(
    navegador,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--no-pdf-header-footer',
      `--print-to-pdf=${pdf}`,
      `file://${html}`,
    ],
    { stdio: 'ignore', timeout: 90000 }
  );
  return resultado.status === 0 && fs.existsSync(pdf);
}

async function main() {
  console.log('\n📷 Generando tarjetas QR para las mesas…\n');

  const delEvento = await datosDelEvento();
  const datos = {
    nombres: delEvento?.nombres || config.nombres,
    fecha: delEvento?.fecha || config.fecha,
    lugar: delEvento?.lugar || config.lugar,
  };

  const { png, svg, base64 } = await generarQr(config.url);
  log('✅', `QR verificado: al decodificarlo contiene "${config.url}"`);

  fs.mkdirSync(config.salida, { recursive: true });
  const escritos = [];
  const escribir = (nombre, contenido) => {
    const destino = path.join(config.salida, nombre);
    fs.writeFileSync(destino, contenido);
    escritos.push([nombre, fs.statSync(destino).size]);
  };

  escribir('qr-fotos-mesas.png', png);
  escribir('qr-fotos-mesas.svg', svg);

  // Cuatro variantes: 1 o 4 tarjetas por hoja, en vertical (retrato) o apaisada (horizontal)
  const variantes = [
    { nombre: 'tarjetas-mesas-4-por-hoja', porHoja: 4, orientacion: 'vertical' },
    { nombre: 'tarjetas-mesas-4-por-hoja-horizontal', porHoja: 4, orientacion: 'horizontal' },
    { nombre: 'tarjeta-mesas-1-por-hoja', porHoja: 1, orientacion: 'vertical' },
    { nombre: 'tarjeta-mesas-1-por-hoja-horizontal', porHoja: 1, orientacion: 'horizontal' },
  ];
  for (const variante of variantes) {
    escribir(
      `${variante.nombre}.html`,
      plantilla({ ...variante, base64, url: config.url, ...datos })
    );
  }
  escribir('LEEME.md', leeme({ ...datos, url: config.url }));

  // PDF listos para imprimir (se generan con Chrome/Edge si está disponible)
  const navegador = buscarNavegador();
  if (navegador) {
    for (const { nombre } of variantes) {
      const html = path.join(config.salida, `${nombre}.html`);
      const pdf = path.join(config.salida, `${nombre}.pdf`);
      if (htmlAPdf(navegador, html, pdf)) {
        escritos.push([`${nombre}.pdf`, fs.statSync(pdf).size]);
      } else {
        log('⚠️', `No se pudo generar ${nombre}.pdf; imprime el .html desde el navegador.`);
      }
    }
  } else {
    log('ℹ️', 'No encontré Chrome/Edge para armar los PDF: imprime los .html desde el navegador.');
  }

  console.log(`\n📁 ${path.relative(RAIZ, config.salida)}/`);
  for (const [nombre, bytes] of escritos) {
    console.log(`   • ${nombre.padEnd(34)} ${(bytes / 1024).toFixed(1)} kB`);
  }
  console.log(`\n🎉 Listo. Bautizo de ${datos.nombres} · ${datos.fecha}`);
  console.log('   Para las mesas: "tarjetas-mesas-4-por-hoja.pdf" (4 mesas por hoja, vertical)');
  console.log('   o "...-horizontal.pdf" (la misma hoja en apaisado).\n');
}

main().catch((error) => {
  console.error(`\n❌ ${error.message}\n`);
  process.exit(1);
});

