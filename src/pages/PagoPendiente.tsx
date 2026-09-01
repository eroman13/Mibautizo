/**
 * Página de pago pendiente
 */

import { Link } from 'react-router-dom';
import { useValidarRetornoPago } from '../hooks/useValidarRetornoPago';

export default function PagoPendiente() {
  const { paymentId } = useValidarRetornoPago();

  return (
    <div className="min-h-screen bg-soft-gray flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-card p-8 md:p-12 text-center">
        {/* Ícono de pendiente */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-800 mb-3">
            Pago en proceso ⏳
          </h1>
        </div>

        {/* Mensaje */}
        <div className="mb-8 space-y-4">
          <p className="text-lg text-gray-700">
            Tu pago está siendo procesado.
          </p>
          <p className="text-gray-600">
            Esto puede demorar algunos minutos. Te notificaremos cuando el pago sea confirmado.
            No es necesario que vuelvas a intentar el pago.
          </p>
          
          {paymentId && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>ID de pago:</strong> {paymentId}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Guarda este número para consultas futuras
              </p>
            </div>
          )}
        </div>

        {/* Info adicional */}
        <div className="bg-blue-50 p-6 rounded-lg mb-8 text-left">
          <h3 className="font-semibold text-blue-900 mb-3">¿Por qué está pendiente?</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>El banco está verificando tu transacción</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Algunos medios de pago tardan más en confirmarse</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Puede requerir aprobación adicional</span>
            </li>
          </ul>
        </div>

        {/* Botones */}
        <div className="space-y-3">
          <Link to="/" className="btn-primary inline-block w-full">
            Volver al inicio
          </Link>
          <Link to="/regalos" className="btn-secondary inline-block w-full">
            Ver la lista de regalos
          </Link>
        </div>

        {/* Nota adicional */}
        <div className="mt-8 pt-6 border-t">
          <p className="text-sm text-gray-500">
            Si después de 24 horas tu pago sigue pendiente, contacta al soporte de Mercado Pago.
          </p>
        </div>
      </div>
    </div>
  );
}
