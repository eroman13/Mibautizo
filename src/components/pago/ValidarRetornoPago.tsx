/**
 * Guard (middleware de ruta) para las páginas de retorno de Mercado Pago.
 *
 * Verifica que la URL contenga los parámetros esperados de Mercado Pago
 * (payment_id, status, preference_id) y que el estado del pago coincida con
 * la página que se está mostrando.
 *
 * - URL malformada → redirige a una página de estado controlado.
 * - Estado incorrecto (ej: pago cancelado en la página de éxito) →
 *   redirige a la página correcta.
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useValidarRetornoPago, EstadoPago } from '../../hooks/useValidarRetornoPago';

interface ValidarRetornoPagoProps {
  children: ReactNode;
  /** Estado(s) de pago que esta página está autorizada a mostrar */
  esperado: EstadoPago | EstadoPago[];
}

// Ruta correcta para cada estado de pago
const RUTA_POR_ESTADO: Record<EstadoPago, string> = {
  aprobado: '/pago-exitoso',
  rechazado: '/pago-fallido',
  pendiente: '/pago-pendiente',
  cancelado: '/pago-fallido',
  malformado: '/pago-estado-controlado?motivo=url-invalida',
};

export default function ValidarRetornoPago({ children, esperado }: ValidarRetornoPagoProps) {
  const { estado } = useValidarRetornoPago();

  const esperados = Array.isArray(esperado) ? esperado : [esperado];

  // URL malformada → página de estado controlado
  if (estado === 'malformado') {
    return <Navigate to={RUTA_POR_ESTADO.malformado} replace />;
  }

  // El estado no coincide con esta página → redirigir a la página correcta
  if (!esperados.includes(estado)) {
    return <Navigate to={RUTA_POR_ESTADO[estado]} replace />;
  }

  return <>{children}</>;
}

