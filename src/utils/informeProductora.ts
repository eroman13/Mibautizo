/**
 * Informe de invitados y valores para la productora del evento.
 *
 * Categorías de precio acordadas:
 *   - Niños/as de 0 a 7 años: no pagan.
 *   - Niños/as de 8 a 13 años: $15.000 c/u.
 *   - Resto (jóvenes y adultos de 14 años o más): $29.000 c/u.
 *
 * El conteo reutiliza la clasificación que ya calcula el backend en el resumen
 * de asistencias (`ninosMenores` / `ninosMayores` / `adultos`), considerando solo
 * a quienes realmente asistirán: las familias que declinaron y las personas
 * marcadas como "no asistirá" quedan fuera.
 */

import { ResumenAsistencias } from '../types';

/** Valor por niño/a de 8 a 13 años (CLP) */
export const PRECIO_NINO_MAYOR = 15000;
/** Valor por persona de 14 años o más / adulto (CLP) */
export const PRECIO_ADULTO = 29000;

export interface FilaInformeProductora {
  categoria: string;
  detalle: string;
  cantidad: number;
  /** 0 indica que no paga */
  precioUnitario: number;
  subtotal: number;
}

export interface InformeProductora {
  filas: FilaInformeProductora[];
  ninos0a7: number;
  ninos8a13: number;
  adultos: number;
  totalPersonas: number;
  subtotalNinos8a13: number;
  subtotalAdultos: number;
  total: number;
  familias: number;
  noAsisten: number;
}

/** Formatea un monto en pesos chilenos sin decimales (ej. $29.000). */
export function formatearClp(monto: number): string {
  return '$' + monto.toLocaleString('es-CL');
}

/** Calcula el desglose de invitados por categoría y el total a pagar. */
export function calcularInformeProductora(resumen: ResumenAsistencias): InformeProductora {
  const ninos0a7 = resumen.ninosMenores || 0;
  const ninos8a13 = resumen.ninosMayores || 0;
  const adultos = resumen.adultos || 0;

  const subtotalNinos8a13 = ninos8a13 * PRECIO_NINO_MAYOR;
  const subtotalAdultos = adultos * PRECIO_ADULTO;

  const filas: FilaInformeProductora[] = [
    {
      categoria: 'Niños/as de 0 a 7 años',
      detalle: 'Bebés y niños pequeños · no pagan',
      cantidad: ninos0a7,
      precioUnitario: 0,
      subtotal: 0,
    },
    {
      categoria: 'Niños/as de 8 a 13 años',
      detalle: 'Niños en edad escolar',
      cantidad: ninos8a13,
      precioUnitario: PRECIO_NINO_MAYOR,
      subtotal: subtotalNinos8a13,
    },
    {
      categoria: 'Jóvenes y adultos (14 años o más)',
      detalle: 'Adolescentes y adultos',
      cantidad: adultos,
      precioUnitario: PRECIO_ADULTO,
      subtotal: subtotalAdultos,
    },
  ];

  return {
    filas,
    ninos0a7,
    ninos8a13,
    adultos,
    totalPersonas: ninos0a7 + ninos8a13 + adultos,
    subtotalNinos8a13,
    subtotalAdultos,
    total: subtotalNinos8a13 + subtotalAdultos,
    familias: resumen.familias || 0,
    noAsisten: resumen.totalNoAsisten || 0,
  };
}

/** Escapa el valor de una celda para CSV (comillas, comas y saltos de línea). */
function celda(valor: string | number): string {
  const texto = String(valor);
  return /[",\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/**
 * Descarga el informe (resumen por categoría + total) como CSV compatible con
 * Excel, para enviárselo a la productora.
 */
export function exportarInformeProductoraExcel(resumen: ResumenAsistencias): void {
  const inf = calcularInformeProductora(resumen);

  const encabezados = [
    'Categoría (por edad)',
    'Invitados',
    'Valor por persona (CLP)',
    'Subtotal a pagar (CLP)',
  ];

  const lineas = inf.filas.map((f) =>
    [f.categoria, f.cantidad, f.precioUnitario, f.subtotal].map(celda).join(',')
  );

  lineas.push('');
  lineas.push(['TOTAL A PAGAR', inf.totalPersonas, '', inf.total].map(celda).join(','));

  const csv = [encabezados.map(celda).join(','), ...lineas].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `informe-productora-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


/** Documento HTML listo para imprimir o guardar como PDF. */
function plantillaInforme(inf: InformeProductora): string {
  const hoy = new Date().toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const filas = inf.filas
    .map(
      (f) => `<tr>
        <td>${f.categoria}<br><span class="detalle">${f.detalle}</span></td>
        <td class="num">${f.cantidad}</td>
        <td class="num">${f.precioUnitario === 0 ? 'No pagan' : formatearClp(f.precioUnitario)}</td>
        <td class="num">${f.subtotal === 0 ? '—' : formatearClp(f.subtotal)}</td>
      </tr>`
    )
    .join('');

  const familiasTexto =
    inf.familias === 1 ? '1 familia confirmada' : `${inf.familias} familias confirmadas`;

  return `<!doctype html>
<html lang="es-CL">
  <head>
    <meta charset="utf-8" />
    <title>Informe para la productora</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #1f2937; margin: 0; padding: 40px; }
      h1 { font-size: 22px; margin: 0 0 4px; }
      .sub { color: #6b7280; margin: 0 0 24px; font-size: 14px; }
      table { width: 100%; border-collapse: collapse; font-size: 14px; }
      th, td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
      th { background: #f9fafb; text-transform: uppercase; font-size: 11px; letter-spacing: .04em; color: #6b7280; }
      .num { text-align: right; }
      .detalle { color: #9ca3af; font-size: 12px; }
      tfoot td { font-weight: 700; border-top: 2px solid #d1d5db; border-bottom: none; }
      .total { text-align: right; color: #059669; font-size: 18px; }
      .nota { margin-top: 18px; font-size: 12px; color: #6b7280; line-height: 1.5; }
      .pie { margin-top: 28px; font-size: 12px; color: #9ca3af; }
      @media print { body { padding: 0; } }
    </style>
  </head>
  <body>
    <h1>Informe para la productora</h1>
    <p class="sub">Bautizo de las mellizas · Invitados y valores · Generado el ${hoy}</p>
    <table>
      <thead>
        <tr>
          <th>Categoría (por edad)</th>
          <th class="num">Invitados</th>
          <th class="num">Valor por persona</th>
          <th class="num">Subtotal a pagar</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
      <tfoot>
        <tr>
          <td>TOTAL A PAGAR</td>
          <td class="num">${inf.totalPersonas} invitados</td>
          <td class="num"></td>
          <td class="num total">${formatearClp(inf.total)}</td>
        </tr>
      </tfoot>
    </table>
    <p class="nota">
      Solo se cuentan los invitados que asistirán (${familiasTexto}). Quedan fuera las familias que
      declinaron y las personas marcadas como "no asistirá".<br />
      Valores: niños/as de 0 a 7 años no pagan · niños/as de 8 a 13 años ${formatearClp(
        PRECIO_NINO_MAYOR
      )} c/u · jóvenes y adultos de 14 años o más ${formatearClp(PRECIO_ADULTO)} c/u.
    </p>
    <p class="pie">Documento generado automáticamente desde el panel de administración.</p>
  </body>
</html>`;
}

/**
 * Abre una pestaña con el informe listo para imprimir o guardar como PDF.
 * Devuelve `false` si el navegador bloqueó las ventanas emergentes.
 */
export function imprimirInformeProductora(resumen: ResumenAsistencias): boolean {
  const inf = calcularInformeProductora(resumen);
  const ventana = window.open('', '_blank');
  if (!ventana) return false;
  ventana.document.write(plantillaInforme(inf));
  ventana.document.close();
  ventana.focus();
  // Pequeña espera para que el navegador calcule el diseño antes de abrir el diálogo
  window.setTimeout(() => ventana.print(), 400);
  return true;
}

