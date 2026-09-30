/**
 * Tarjeta con el código QR del álbum de fotos, pensada para imprimir y poner en las mesas
 * del evento (y para mandar el enlace por WhatsApp).
 *
 * El QR apunta a `/fotos` del mismo dominio donde esté abierto el panel, así que nunca queda
 * con un dominio viejo. Permite descargarlo en PNG/SVG, copiar el enlace, copiar un mensaje
 * listo para WhatsApp e imprimir tarjetas (1 o 4 por hoja A4).
 *
 * Se genera en el navegador con `qrcode.react`; no depende de servicios externos.
 */

import { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { api } from '../../services/api';

const RUTA_ALBUM = '/fotos';

type DatosEvento = {
  nombreMelliza1?: string;
  nombreMelliza2?: string;
  fecha?: string;
};

type Props = {
  /** Sobreescribe los nombres del evento (por defecto se toman de la API). */
  nombreEvento?: string;
};

/** Hoja imprimible: se abre en una pestaña nueva para no depender de los estilos del panel. */
const ESTILOS_IMPRESION = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #3f3d56;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .hoja {
    width: 194mm;
    height: 270mm;
    margin: 0 auto;
    display: grid;
    gap: 5mm;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    background: #fff;
  }
  .hoja--4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
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
  .eyebrow {
    margin: 0;
    font-size: 10.5pt;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #b0336f;
  }
  h1 {
    margin: 2mm 0 0;
    font-family: Georgia, 'Times New Roman', serif;
    font-weight: 600;
    font-size: 22pt;
    line-height: 1.12;
  }
  .hoja--4 h1 { font-size: 16pt; }
  h1 span { color: #b0336f; }
  .fecha { margin: 1.5mm 0 0; font-size: 9.5pt; color: #6b7280; }
  .hoja--4 .fecha { font-size: 8.5pt; }
  .qr {
    margin: 4mm 0 2.5mm;
    padding: 3.5mm;
    background: #fff;
    border: 0.4mm solid #e5e7eb;
    border-radius: 4mm;
  }
  .qr svg { display: block; width: 105mm; height: 105mm; }
  .hoja--4 .qr svg { width: 50mm; height: 50mm; }
  .scan { margin: 0 0 3mm; font-size: 10.5pt; font-weight: 600; }
  .hoja--4 .scan { font-size: 9.5pt; margin-bottom: 2mm; }
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: 10pt;
    line-height: 1.55;
    color: #4b5563;
  }
  .hoja--4 ol { font-size: 8.8pt; }
  li { display: flex; align-items: center; gap: 5px; justify-content: center; }
  li b {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 4.6mm;
    height: 4.6mm;
    border-radius: 50%;
    background: #ffb3d9;
    color: #7a1244;
    font-size: 7.5pt;
    flex: 0 0 auto;
  }
  .url { margin: 3mm 0 0; font-size: 8pt; letter-spacing: 0.06em; color: #9ca3af; }
  @page { size: A4; margin: 8mm; }
  @media print {
    .hoja { break-after: page; page-break-after: always; }
    .tarjeta { break-inside: avoid; page-break-inside: avoid; }
  }
`;

/** Serializa el SVG del QR (agregando el namespace si React no lo incluyó). */
function svgComoTexto(svg: SVGSVGElement | null) {
  const markup = svg?.outerHTML || '';
  return markup.includes('xmlns=')
    ? markup
    : markup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
}

function formatearFecha(iso?: string) {
  if (!iso) return '';
  const fecha = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return String(iso);
  return fecha.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function descargar(contenido: string, nombre: string) {
  const enlace = document.createElement('a');
  enlace.href = contenido;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
}


type DatosTarjeta = { svg: string; url: string; nombres: string; fecha: string };

function tarjetaImpresion({ svg, url, nombres, fecha }: DatosTarjeta) {
  return `
      <article class="tarjeta">
        <p class="eyebrow">📸 Comparte tus fotos</p>
        <h1>Bautizo de<br /><span>${nombres}</span></h1>
        ${fecha ? `<p class="fecha">${fecha}</p>` : ''}
        <div class="qr">${svg}</div>
        <p class="scan">Escanea con la cámara de tu teléfono</p>
        <ol>
          <li><b>1</b> Escanea el código</li>
          <li><b>2</b> Elige y envía tus fotos</li>
          <li><b>3</b> Los papás las aprueban y aparecen en la galería</li>
        </ol>
        <p class="url">${url.replace(/^https?:\/\//, '')}</p>
      </article>`;
}

/** Documento completo que se abre en una pestaña nueva para imprimir. */
function plantillaImpresion(datos: DatosTarjeta & { porHoja: number }) {
  const tarjetas = Array.from({ length: datos.porHoja }, () => tarjetaImpresion(datos)).join('');
  return `<!doctype html>
<html lang="es-CL">
  <head>
    <meta charset="utf-8" />
    <title>Tarjetas QR · Bautizo de ${datos.nombres}</title>
    <style>${ESTILOS_IMPRESION}</style>
  </head>
  <body>
    <section class="hoja${datos.porHoja === 4 ? ' hoja--4' : ''}">${tarjetas}</section>
  </body>
</html>`;
}

export default function QrMesas({ nombreEvento }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [url, setUrl] = useState('');
  const [evento, setEvento] = useState<DatosEvento | null>(null);
  const [porHoja, setPorHoja] = useState(4);
  const [aviso, setAviso] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const temporizadorRef = useRef<number>();

  const origen = typeof window === 'undefined' ? '' : window.location.origin;
  const urlPropuesta = `${origen}${RUTA_ALBUM}`;
  const urlLimpia = url.trim() || urlPropuesta;
  const dominio = urlLimpia.replace(/^https?:\/\//, '');

  const nombres =
    nombreEvento ||
    [evento?.nombreMelliza1, evento?.nombreMelliza2].filter(Boolean).join(' y ') ||
    'nuestras mellizas';
  const fechaTexto = formatearFecha(evento?.fecha);

  // Los nombres y la fecha del evento adornan la tarjeta; se piden recién al abrir la sección
  useEffect(() => {
    if (!abierto || evento) return;
    let activo = true;
    api
      .getEvento()
      .then((respuesta) => {
        if (activo) setEvento((respuesta?.data as DatosEvento) || null);
      })
      .catch(() => {
        // Si falla, la tarjeta usa un texto genérico
      });
    return () => {
      activo = false;
    };
  }, [abierto, evento]);

  useEffect(() => () => window.clearTimeout(temporizadorRef.current), []);

  const mostrarAviso = (texto: string) => {
    setAviso(texto);
    window.clearTimeout(temporizadorRef.current);
    temporizadorRef.current = window.setTimeout(() => setAviso(''), 5000);
  };

  const copiar = async (texto: string, mensaje: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      mostrarAviso(mensaje);
    } catch {
      mostrarAviso('No se pudo copiar automáticamente: selecciona el texto y cópialo a mano.');
    }
  };

  const descargarPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      mostrarAviso('Espera un instante: el QR todavía se está generando.');
      return;
    }
    descargar(canvas.toDataURL('image/png'), 'qr-fotos-mesas.png');
  };

  const descargarSvg = () => {
    const svg = svgComoTexto(svgRef.current);
    if (!svg) {
      mostrarAviso('Espera un instante: el QR todavía se está generando.');
      return;
    }
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${svg}`], {
      type: 'image/svg+xml',
    });
    const objectUrl = URL.createObjectURL(blob);
    descargar(objectUrl, 'qr-fotos-mesas.svg');
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
  };

  const imprimir = () => {
    const svg = svgComoTexto(svgRef.current);
    if (!svg) return;
    const ventana = window.open('', '_blank');
    if (!ventana) {
      mostrarAviso('Permite las ventanas emergentes del navegador para poder imprimir.');
      return;
    }
    ventana.document.write(
      plantillaImpresion({ svg, url: urlLimpia, nombres, fecha: fechaTexto, porHoja })
    );
    ventana.document.close();
    ventana.focus();
    // Pequeña espera para que el navegador calcule el diseño antes de abrir el diálogo
    window.setTimeout(() => ventana.print(), 400);
  };

  const mensajeWhatsApp = `📸 ¡Comparte las fotos del bautizo de ${nombres}!
Entra aquí desde tu teléfono: ${urlLimpia}
(Las fotos pasan por revisión: los papás las aprueban y quedan en la galería 💕)`;

  return (
    <section className="bg-white rounded-2xl shadow-card p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">🔳 QR para las mesas</h2>
          <p className="text-sm text-gray-500 max-w-2xl">
            Imprime una tarjeta y ponla en cada mesa (o mándala por WhatsApp) para que los invitados
            entren al álbum con la cámara del teléfono: <span className="font-medium text-gray-700">{dominio}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAbierto((valor) => !valor)}
          className="btn-secondary text-sm py-2 px-5 whitespace-nowrap"
        >
          {abierto ? 'Ocultar QR ▲' : 'Ver QR ▾'}
        </button>
      </div>

      {abierto && (
        <div className="mt-6 grid lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] gap-6 items-start">
          {/* Vista previa de la tarjeta */}
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gradient-to-b from-white to-pink-50/70 p-5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-pastel-pink">
              📸 Comparte tus fotos
            </p>
            <p className="font-display text-xl font-bold text-gray-800 mt-1 leading-tight">
              Bautizo de
              <br />
              <span className="text-pastel-pink">{nombres}</span>
            </p>
            {fechaTexto && <p className="text-[11px] text-gray-500 mt-1">{fechaTexto}</p>}
            <div className="mt-3 inline-block rounded-xl bg-white p-2 shadow-soft">
              <QRCodeSVG
                ref={svgRef}
                value={urlLimpia}
                size={196}
                level="H"
                marginSize={4}
                title={`Código QR del álbum de fotos (${urlLimpia})`}
              />
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-3">
              Escanea con la cámara de tu teléfono
            </p>
            <ol className="mt-2 space-y-1 text-[11px] text-gray-500 text-left">
              <li>1️⃣ Escanea el código</li>
              <li>2️⃣ Elige y envía tus fotos</li>
              <li>3️⃣ Los papás las aprueban y aparecen en la galería</li>
            </ol>
            <p className="mt-3 text-[10px] tracking-wide text-gray-400">{dominio}</p>
          </div>


          {/* Acciones */}
          <div>
            <label htmlFor="qr-url" className="block text-sm font-medium text-gray-700 mb-1.5">
              Enlace que abrirá el QR
            </label>
            <div className="flex gap-2">
              <input
                id="qr-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={urlPropuesta}
                className="input-field"
              />
              <button
                type="button"
                onClick={() => setUrl('')}
                title="Volver al enlace propuesto"
                className="px-4 rounded-lg border-2 border-gray-200 text-gray-500 hover:border-pastel-pink hover:text-pastel-pink"
              >
                ↺
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Si lo dejas vacío, el QR apunta al dominio desde el que abriste el panel (
              {urlPropuesta}).
            </p>

            <div className="flex flex-wrap gap-2 mt-5">
              <button type="button" onClick={descargarPng} className="btn-primary text-sm py-2 px-5">
                ⬇️ Descargar PNG
              </button>
              <button
                type="button"
                onClick={descargarSvg}
                className="btn-secondary text-sm py-2 px-5"
              >
                ⬇️ Descargar SVG
              </button>
              <button
                type="button"
                onClick={() => copiar(urlLimpia, '✅ Enlace copiado. Ya puedes pegarlo donde quieras.')}
                className="btn-secondary text-sm py-2 px-5"
              >
                🔗 Copiar enlace
              </button>
              <button
                type="button"
                onClick={() => copiar(mensajeWhatsApp, '✅ Mensaje copiado. Pégalo en el grupo de WhatsApp.')}
                className="btn-secondary text-sm py-2 px-5"
              >
                💬 Copiar mensaje
              </button>
              <a
                href={urlLimpia}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-sm py-2 px-5"
              >
                🔍 Probar enlace
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-5">
              <span className="text-sm text-gray-600">Tarjetas por hoja A4:</span>
              <div className="inline-flex rounded-full border-2 border-gray-200 p-1">
                <button
                  type="button"
                  onClick={() => setPorHoja(4)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    porHoja === 4 ? 'bg-pastel-pink text-white' : 'text-gray-500 hover:text-pastel-pink'
                  }`}
                >
                  4 (una por mesa)
                </button>
                <button
                  type="button"
                  onClick={() => setPorHoja(1)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    porHoja === 1 ? 'bg-pastel-pink text-white' : 'text-gray-500 hover:text-pastel-pink'
                  }`}
                >
                  1 (letrero grande)
                </button>
              </div>
              <button
                type="button"
                onClick={imprimir}
                className="btn-primary text-sm py-2 px-5"
              >
                🖨️ Imprimir tarjetas
              </button>
            </div>

            <ul className="mt-5 text-xs text-gray-500 space-y-1 list-disc pl-4">
              <li>
                Escanea una tarjeta con el teléfono <strong>antes</strong> de imprimir el resto: debe
                abrir el álbum de fotos.
              </li>
              <li>
                Mantén el código en blanco y negro y con su espacio blanco alrededor (no lo pegues
                sobre una foto).
              </li>
              <li>
                En el diálogo de impresión: A4, escala <strong>100 %</strong>, márgenes
                predeterminados y <em>gráficos de fondo</em> activados.
              </li>
              <li>
                Si el navegador agrega un encabezado o pie con la dirección, desactívalos en el
                diálogo de impresión.
              </li>
            </ul>

            {aviso && (
              <p className="mt-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{aviso}</p>
            )}
          </div>

          {/* Canvas oculto: sirve para exportar el QR como PNG */}
          <div className="hidden" aria-hidden="true">
            <QRCodeCanvas ref={canvasRef} value={urlLimpia} size={1024} level="H" marginSize={4} />
          </div>
        </div>
      )}
    </section>
  );
}

