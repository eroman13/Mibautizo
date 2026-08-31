/**
 * Página de pago exitoso
 */

import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function PagoExitoso() {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    // Aquí podrías hacer un tracking o analytics
    console.log('Pago exitoso:', { paymentId, externalReference });
  }, [paymentId, externalReference]);

  return (
    <div className="min-h-screen bg-soft-gray flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-card p-8 md:p-12 text-center">
        {/* Ícono de éxito */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-800 mb-3">
            ¡Pago exitoso! 🎉
          </h1>
        </div>

        {/* Mensaje */}
        <div className="mb-8 space-y-4">
          <p className="text-lg text-gray-700">
            Tu regalo ha sido procesado correctamente. 💝
          </p>
          <p className="text-gray-600">
            Los papás de las gemelas recibirán tu mensaje y tu aporte con mucho cariño.
            ¡Gracias por ser parte de este momento tan especial!
          </p>
          
          {paymentId && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>ID de pago:</strong> {paymentId}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Guarda este número como comprobante
              </p>
            </div>
          )}
        </div>

        {/* Ilustración o decoración */}
        <div className="mb-8">
          <div className="text-6xl mb-4">🍼👶👶💝</div>
        </div>

        {/* Botones */}
        <div className="space-y-3">
          <Link to="/" className="btn-primary inline-block w-full">
            Volver al inicio
          </Link>
          <Link to="/regalos" className="btn-secondary inline-block w-full">
            Ver otros regalos
          </Link>
        </div>

        {/* Nota adicional */}
        <div className="mt-8 pt-6 border-t">
          <p className="text-sm text-gray-500">
            Si tienes alguna pregunta sobre tu pago, puedes contactar directamente a los papás.
          </p>
        </div>
      </div>
    </div>
  );
}
