/**
 * Hook para validar los parámetros de retorno de Mercado Pago.
 *
 * Mercado Pago redirige al usuario de vuelta con parámetros en la URL como:
 *   payment_id, status, preference_id, merchant_order_id, external_reference
 *
 * Este hook normaliza estos parámetros (Mercado Pago a veces envía el literal
 * "null" como string) y determina un estado de pago coherente.
 */

import { useSearchParams } from 'react-router-dom';

export type EstadoPago =
  | 'aprobado'
  | 'rechazado'
  | 'pendiente'
  | 'cancelado'
  | 'malformado';

export interface RetornoPago {
  paymentId: string | null;
  status: string | null;
  preferenceId: string | null;
  merchantOrderId: string | null;
  externalReference: string | null;
  estado: EstadoPago;
}

export function useValidarRetornoPago(): RetornoPago {
  const [searchParams] = useSearchParams();

  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const preferenceId = searchParams.get('preference_id');
  const merchantOrderId = searchParams.get('merchant_order_id');
  const externalReference = searchParams.get('external_reference');

  const estado = determinarEstado(status, paymentId, preferenceId);

  return {
    paymentId,
    status,
    preferenceId,
    merchantOrderId,
    externalReference,
    estado,
  };
}

/**
 * Determina el estado real del pago a partir de los parámetros de la URL.
 */
function determinarEstado(
  status: string | null,
  paymentId: string | null,
  preferenceId: string | null
): EstadoPago {
  // Normalizar: Mercado Pago a veces envía el literal "null" como string
  const statusLimpio = status && status !== 'null' ? status : null;
  const paymentIdLimpio = paymentId && paymentId !== 'null' ? paymentId : null;
  const preferenceIdLimpio =
    preferenceId && preferenceId !== 'null' ? preferenceId : null;

  // URL malformada: no hay ningún parámetro de Mercado Pago
  if (!statusLimpio && !paymentIdLimpio && !preferenceIdLimpio) {
    return 'malformado';
  }

  // Pago cancelado por el usuario: hay preference_id pero status/payment_id son null
  if (!statusLimpio && !paymentIdLimpio && preferenceIdLimpio) {
    return 'cancelado';
  }

  switch (statusLimpio) {
    case 'approved':
      return 'aprobado';
    case 'rejected':
      return 'rechazado';
    case 'pending':
    case 'in_process':
    case 'in_mediation':
      return 'pendiente';
    case 'cancelled':
      return 'cancelado';
    default:
      // Tiene preference_id pero el status es desconocido → tratar como malformado
      return 'malformado';
  }
}
