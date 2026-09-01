/**
 * Página de pago fallido
 */

import { Link } from 'react-router-dom';
import { useValidarRetornoPago } from '../hooks/useValidarRetornoPago';

export default function PagoFallido() {
  const { paymentId, estado } = useValidarRetornoPago();
  const esCancelado = estado === 'cancelado';

  return (
    <div className="min-h-screen bg-soft-gray flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-card p-8 md:p-12 text-center">
        {/* Ícono de error */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-800 mb-3">
            {esCancelado ? 'Pago cancelado' : 'Pago no procesado'}
          </h1>
        </div>

        {/* Mensaje */}
        <div className="mb-8 space-y-4">
          <p className="text-lg text-gray-700">
            {esCancelado
              ? 'Cancelaste el pago.'
              : 'Hubo un problema al procesar tu pago. 😔'}
          </p>
          <p className="text-gray-600">
            {esCancelado
              ? 'No se realizó ningún cobro. Puedes volver a intentarlo cuando quieras.'
              : 'Esto puede ocurrir por varios motivos: fondos insuficientes, datos incorrectos de la tarjeta, o un problema temporal con el procesador de pagos.'}
          </p>
          
          {paymentId && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Referencia:</strong> {paymentId}
              </p>
            </div>
          )}
        </div>

        {/* Sugerencias */}
        <div className="bg-blue-50 p-6 rounded-lg mb-8 text-left">
          <h3 className="font-semibold text-blue-900 mb-3">¿Qué puedo hacer?</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Verifica que los datos de tu tarjeta sean correctos</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Asegúrate de tener fondos suficientes</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Intenta con otra tarjeta</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Si el problema persiste, contacta a tu banco</span>
            </li>
          </ul>
        </div>

        {/* Botones */}
        <div className="space-y-3">
          <Link to="/checkout" className="btn-primary inline-block w-full">
            Intentar nuevamente
          </Link>
          <Link to="/regalos" className="btn-secondary inline-block w-full">
            Volver a la lista de regalos
          </Link>
          <Link to="/" className="text-pastel-pink hover:text-pastel-lavender text-sm inline-block">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
