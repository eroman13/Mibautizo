/**
 * Componente de carrito flotante
 */

import { useState, useEffect } from 'react';
import { useCarrito } from '../../context/CarritoContext';
import { formatCLP } from '../../utils/format';
import { useNavigate } from 'react-router-dom';

interface CarritoFlotanteProps {
  gemela1: string;
  gemela2: string;
}

export default function CarritoFlotante({ gemela1, gemela2 }: CarritoFlotanteProps) {
  const { items, eliminarDelCarrito, totalItems, regalosGemela1, regalosGemela2 } = useCarrito();
  const [abierto, setAbierto] = useState(false);
  const navigate = useNavigate();

  // Cerrar el carrito cuando esté vacío
  useEffect(() => {
    if (totalItems === 0) {
      setAbierto(false);
    }
  }, [totalItems]);

  if (totalItems === 0) return null;

  const total = items.reduce((sum, item) => {
    return sum + (item.montoLibre || item.regalo.precioCLP);
  }, 0);

  const itemsGemela1 = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.paraGemela === 'gemela1');
  
  const itemsGemela2 = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.paraGemela === 'gemela2');

  // Validar si hay regalos para ambas gemelas
  const puedeCheckout = regalosGemela1 > 0 && regalosGemela2 > 0;

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-pastel-pink to-pastel-lavender text-white p-4 rounded-full shadow-card hover:shadow-xl transition-all duration-300 hover:scale-110 z-40"
      >
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {totalItems}
          </span>
        </div>
      </button>

      {/* Panel deslizante */}
      {abierto && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setAbierto(false)}
          />

          {/* Panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-display font-bold text-gray-800">
                  🎁 Tu carrito
                </h2>
                <button
                  onClick={() => setAbierto(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Validación de ambas gemelas */}
              {!puedeCheckout && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <p className="text-sm text-yellow-700">
                    <strong>⚠️ Debes seleccionar al menos 1 regalo para cada gemela</strong>
                    <br />
                    Para {gemela1}: {regalosGemela1} regalo{regalosGemela1 !== 1 ? 's' : ''}
                    <br />
                    Para {gemela2}: {regalosGemela2} regalo{regalosGemela2 !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Regalos para Gemela 1 */}
              {itemsGemela1.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-pastel-pink mb-3 flex items-center gap-2">
                    👧 Para {gemela1} ({itemsGemela1.length})
                  </h3>
                  <div className="space-y-3">
                    {itemsGemela1.map(({ item, index }) => (
                      <div key={`${item.regalo.id}-gemela1-${index}`} className="flex gap-3 bg-gray-50 p-3 rounded-lg">
                        <img
                          src={item.regalo.imagenUrl}
                          alt={item.regalo.nombre}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 text-sm mb-1">
                            {item.regalo.nombre}
                          </h4>
                          <p className="text-pastel-pink font-bold text-sm">
                            {formatCLP(item.montoLibre || item.regalo.precioCLP)}
                          </p>
                        </div>
                        <button
                          onClick={() => eliminarDelCarrito(index)}
                          className="text-red-500 hover:text-red-700 self-center"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regalos para Gemela 2 */}
              {itemsGemela2.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-pastel-lavender mb-3 flex items-center gap-2">
                    👧 Para {gemela2} ({itemsGemela2.length})
                  </h3>
                  <div className="space-y-3">
                    {itemsGemela2.map(({ item, index }) => (
                      <div key={`${item.regalo.id}-gemela2-${index}`} className="flex gap-3 bg-gray-50 p-3 rounded-lg">
                        <img
                          src={item.regalo.imagenUrl}
                          alt={item.regalo.nombre}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 text-sm mb-1">
                            {item.regalo.nombre}
                          </h4>
                          <p className="text-pastel-lavender font-bold text-sm">
                            {formatCLP(item.montoLibre || item.regalo.precioCLP)}
                          </p>
                        </div>
                        <button
                          onClick={() => eliminarDelCarrito(index)}
                          className="text-red-500 hover:text-red-700 self-center"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-xl font-bold text-gray-800">
                    {formatCLP(total)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  El desglose completo se mostrará en el checkout
                </p>
              </div>

              {/* Botones */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    navigate('/checkout');
                    setAbierto(false);
                  }}
                  disabled={!puedeCheckout}
                  className={`w-full py-3 px-4 rounded-full font-semibold transition-all duration-300 ${
                    puedeCheckout
                      ? 'btn-primary'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Continuar al pago 💳
                </button>
                <button
                  onClick={() => setAbierto(false)}
                  className="btn-secondary w-full"
                >
                  Seguir eligiendo
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
