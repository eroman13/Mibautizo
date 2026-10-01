/**
 * Utilidades de exportación de invitados (RSVP) a Excel.
 *
 * Se genera un archivo CSV en UTF-8 con BOM (U+FEFF), el mismo formato que usa
 * el proyecto para "exportar a Excel": Excel lo abre directamente y el BOM
 * asegura que los acentos se vean correctamente.
 */

import { ConfirmacionAsistencia } from '../types';

/** Escapa el valor de una celda para CSV (comillas, comas y saltos de línea) */
function celda(valor: string | number | null | undefined): string {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  if (/[",\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

/** Una fila por invitado (persona) para el archivo exportable */
export interface InvitadoExport {
  familia: string;
  nombre: string;
  tipo: string;
  edad: string | number;
  asiste: string;
  estado: string;
  email: string;
  telefono: string;
  mensaje: string;
  fecha: string;
}

/**
 * Convierte las confirmaciones en una lista "uno a uno": una fila por invitado.
 *
 * - Cada persona registrada en una confirmación genera su propia fila.
 * - Las familias que declinaron (sin personas cargadas) se incluyen como una
 *   fila con el nombre de la familia y estado "No asistirá", para no perderlas.
 */
export function invitadosUnoAUno(
  asistencias: ConfirmacionAsistencia[]
): InvitadoExport[] {
  const filas: InvitadoExport[] = [];

  for (const conf of asistencias) {
    const estado = conf.estado === 'declinada' ? 'No asistirá' : 'Confirmada';
    const fecha = new Date(conf.createdAt).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const base = {
      familia: conf.nombreFamilia,
      estado,
      email: conf.email || '',
      telefono: conf.telefono || '',
      mensaje: conf.mensaje || '',
      fecha,
    };

    if (conf.asistentes.length === 0) {
      // Familia declinada sin personas cargadas: se registra igual
      filas.push({
        ...base,
        nombre: conf.nombreFamilia,
        tipo: '',
        edad: '',
        asiste: 'No',
      });
      continue;
    }

    for (const persona of conf.asistentes) {
      filas.push({
        ...base,
        nombre: persona.nombre,
        tipo: persona.tipo === 'nino' ? 'Niño/a' : 'Adulto',
        edad: persona.tipo === 'nino' && persona.edad != null ? persona.edad : '',
        asiste: persona.asiste === false ? 'No' : 'Sí',
      });
    }
  }

  return filas;
}

/**
 * Exporta todos los invitados (uno a uno) a un archivo CSV compatible con Excel.
 * Devuelve la cantidad de filas (invitados) exportadas.
 */
export function exportarInvitadosExcel(asistencias: ConfirmacionAsistencia[]): number {
  const filas = invitadosUnoAUno(asistencias);

  const encabezados = [
    'Familia',
    'Nombre',
    'Tipo',
    'Edad',
    'Asiste',
    'Estado',
    'Email',
    'Teléfono',
    'Mensaje',
    'Fecha confirmación',
  ];

  const lineas = filas.map((f) =>
    [
      f.familia,
      f.nombre,
      f.tipo,
      f.edad,
      f.asiste,
      f.estado,
      f.email,
      f.telefono,
      f.mensaje,
      f.fecha,
    ]
      .map(celda)
      .join(',')
  );

  const csv = [encabezados.map(celda).join(','), ...lineas].join('\r\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invitados-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return filas.length;
}
