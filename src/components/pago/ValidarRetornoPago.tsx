/**
 * Guard (middleware de ruta) para las páginas de retorno de Mercado Pago.
 *
 * Verifica que la URL contenga los parámetros esperados de Mercado Pago
 * (payment_id, status, preference_id). Si la URL está incompleta o mal
 * formada, redirige al usuario a una página de estado controlado en lugar
 * de mostrar una interfaz rota.
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useValidarRetornoPago } from '../../hooks/useValidarRetornoPago';

interface ValidarRetornoPagoProps {
  children: ReactNode;
}

export default function ValidarRetornoPago({ children }: ValidarRetornoPagoProps) {
  const { estado } = useValidarRetornoPago();

  // Si la URL no contiene los parámetros de Mercado Pago, redirigir de forma
  // segura a una página de estado controlado (evita mostrar información falsa
  // como "pago exitoso" ante una URL inválida).
  if (estado === 'malformado') {
    return <Navigate to="/pago-estado-controlado?motivo=url-invalida" replace />;
  }

  return <>{children}</>;
}
