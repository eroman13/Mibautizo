/**
 * Utilidades para formateo de moneda chilena (CLP)
 */

/**
 * Formatea un número como pesos chilenos
 * @param amount Monto en CLP
 * @returns String formateado (ej: "$50.000")
 */
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea una fecha en formato chileno
 * @param dateString Fecha en formato ISO
 * @returns String formateado (ej: "15 de septiembre de 2026")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
