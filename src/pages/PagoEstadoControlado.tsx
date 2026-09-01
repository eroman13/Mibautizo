/**
 * Página de estado controlado para retornos de pago inválidos o incompletos.
 *
 * Se muestra cuando la URL de retorno de Mercado Pago no contiene la
 * información necesaria para determinar el estado del pago. Evita que el
 * usuario vea una interfaz rota o un 404 estático.
 */

import { Link, useSearchParams } from 'react-router-dom';

export default function PagoEstadoControlado() {
  const [searchParams] = useSearchParams();
  const motivo = searchParams.get('motivo');

  const esUrlInvalida = motivo === 'url-invalida';

  return (
    <div className="min-h-screen bg-soft-gray flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 text-center">
        <div className="text-5xl mb-4">{esUrlInvalida ? '⚠️' : 'ℹ️'}</div>
        <h1 className="text-2xl font-display font-bold text-gray-800 mb-3">
          {esUrlInvalida ? 'Enlace de pago no válido' : 'No pudimos confirmar tu pago'}
        </h1>
        <p className="text-gray-600 mb-6">
          {esUrlInvalida
            ? 'El enlace de retorno no contiene la información necesaria para verificar tu pago. Esto puede ocurrir si la URL fue modificada o si el pago fue cancelado.'
            : 'No pudimos determinar el estado de tu pago. No te preocupes, si realizaste un pago este se procesará correctamente.'}
        </p>
        <div className="space-y-3">
          <Link to="/regalos" className="btn-primary inline-block w-full">
            Volver a la lista de regalos
          </Link>
          <Link to="/" className="btn-secondary inline-block w-full">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
