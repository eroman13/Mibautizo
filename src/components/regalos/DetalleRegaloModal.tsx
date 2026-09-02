/**
 * Modal de detalle del regalo
 * Muestra la imagen grande, descripción completa y las características del regalo
 */

import { useEffect } from 'react';
import { Regalo } from '../../types';
import { formatCLP } from '../../utils/format';

interface DetalleRegaloModalProps {
  regalo: Regalo;
  gemela1: string;
  gemela2: string;
  onCerrar: () => void;
  onAgregar: (paraGemela: 'gemela1' | 'gemela2') => void;
}

export default function DetalleRegaloModal({
  regalo,
  gemela1,
  gemela2,
  onCerrar,
  onAgregar,
}: DetalleRegaloModalProps) {
  const porcentajeRecaudado =
    regalo.permiteColaborativo && regalo.precioCLP > 0
      ? Math.min((regalo.montoRecaudadoCLP / regalo.precioCLP) * 100, 100)
      : 0;

  // Cerrar con tecla Escape y bloquear el scroll del fondo mientras está abierto
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Fondo oscuro */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCerrar}
      />

      {/* Contenido */}
      <div className="relative bg-white rounded-2xl shadow-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Botón cerrar */}
        <button
          onClick={onCerrar}
          className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white text-gray-500 hover:text-gray-800 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-colors text-xl leading-none"
          aria-label="Cerrar"
        >
          ✕
        </button>

        {/* Imagen */}
        <div className="relative h-60 md:h-72">
          <img
            src={regalo.imagenUrl}
            alt={regalo.nombre}
            className="w-full h-full object-cover"
          />
          {regalo.permiteColaborativo && (
            <div className="absolute top-3 left-3 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              🤝 Colaborativo
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-6">
          <h3 className="text-2xl font-display font-bold text-gray-800 mb-3">
            {regalo.nombre}
          </h3>

          {/* Características / descripción completa */}
          <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-5">
            {regalo.descripcion}
          </p>

          {/* Precio */}
          <div className="mb-5">
            {regalo.precioCLP > 0 ? (
              <p className="text-3xl font-bold text-pastel-pink">
                {formatCLP(regalo.precioCLP)}
              </p>
            ) : (
              <p className="text-xl font-semibold text-pastel-lavender">
                Monto a elección 💰
              </p>
            )}
          </div>

          {/* Barra de progreso para colaborativos */}
          {regalo.permiteColaborativo && regalo.precioCLP > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Recaudado</span>
                <span>{Math.round(porcentajeRecaudado)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-pastel-pink to-pastel-lavender h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${porcentajeRecaudado}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatCLP(regalo.montoRecaudadoCLP)} de {formatCLP(regalo.precioCLP)}
              </p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="space-y-3">
            <p className="text-center text-sm text-gray-500">
              ¿Para quién quieres regalar?
            </p>
            <button
              onClick={() => onAgregar('gemela1')}
              className="w-full py-3 px-4 rounded-full font-semibold transition-all duration-300 bg-pastel-pink/20 text-pastel-pink hover:bg-pastel-pink/40"
            >
              🎁 Para {gemela1}
            </button>
            <button
              onClick={() => onAgregar('gemela2')}
              className="w-full py-3 px-4 rounded-full font-semibold transition-all duration-300 bg-pastel-lavender/20 text-pastel-lavender hover:bg-pastel-lavender/40"
            >
              🎁 Para {gemela2}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
