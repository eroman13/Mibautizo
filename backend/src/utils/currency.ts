/**
 * Utilidades para formateo de moneda chilena (CLP)
 */

/**
 * Formatea un número como pesos chilenos
 * @param amount Monto en CLP (sin decimales)
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
 * Calcula el monto a cobrar cuando el invitado cubre la comisión (Modo A)
 * @param baseAmount Monto base del regalo
 * @param commissionRate Tasa de comisión (ej: 0.038 para 3.8%)
 * @returns Objeto con monto a cobrar, comisión y neto
 */
export function calculateWithGuestCoverage(baseAmount: number, commissionRate: number) {
  // Monto a cobrar = baseAmount / (1 - commission)
  const totalCharge = Math.ceil(baseAmount / (1 - commissionRate));
  const commission = totalCharge - baseAmount;
  const netAmount = baseAmount;

  return {
    totalCharge,   // Lo que paga el invitado
    commission,    // Comisión de Mercado Pago
    netAmount,     // Lo que recibe el organizador (igual al regalo)
  };
}

/**
 * Calcula el monto cuando el organizador asume la comisión (Modo B)
 * @param baseAmount Monto base del regalo
 * @param commissionRate Tasa de comisión (ej: 0.038 para 3.8%)
 * @returns Objeto con monto a cobrar, comisión y neto
 */
export function calculateWithOrganizerCoverage(baseAmount: number, commissionRate: number) {
  const totalCharge = baseAmount;
  const commission = Math.ceil(baseAmount * commissionRate);
  const netAmount = baseAmount - commission;

  return {
    totalCharge,   // Lo que paga el invitado (igual al regalo)
    commission,    // Comisión de Mercado Pago
    netAmount,     // Lo que recibe el organizador (menos comisión)
  };
}

/**
 * Calcula el monto según el modo de comisión configurado
 * @param baseAmount Monto base del regalo
 * @param commissionRate Tasa de comisión
 * @param mode Modo de comisión ("A" o "B")
 * @returns Objeto con cálculos de pago
 */
export function calculatePayment(
  baseAmount: number,
  commissionRate: number,
  mode: 'A' | 'B'
) {
  if (mode === 'A') {
    return calculateWithGuestCoverage(baseAmount, commissionRate);
  } else {
    return calculateWithOrganizerCoverage(baseAmount, commissionRate);
  }
}
