/**
 * Componente de tarjeta de regalo
 * Al hacer clic abre un modal con las características completas del regalo
 */

import { useState } from 'react';
import { Regalo } from '../../types';
import { formatCLP } from '../../utils/format';
import { useCarrito } from '../../context/CarritoContext';
import DetalleRegaloModal from './DetalleRegaloModal';

interface TarjetaRegaloProps {
  regalo: Regalo;
  melliza1: string;
  melliza2: string;
}

export default function TarjetaRegalo({ regalo, melliza1, melliza2 }: TarjetaRegaloProps) {
  const { agregarAlCarrito } = useCarrito();
  const [notificacion, setNotificacion] = useState<{ visible: boolean; melliza: string }>({ visible: false, melliza: '' });
  const [detalleAbierto, setDetalleAbierto] = useState(false);

  const porcentajeRecaudado = regalo.permiteColaborativo
    ? Math.min((regalo.montoRecaudadoCLP / regalo.precioCLP) * 100, 100)
    : 0;

  const mostrarNotificacion = (melliza: string) => {
    setNotificacion({ visible: true, melliza });
    setTimeout(() => {
      setNotificacion({ visible: false, melliza: '' });
    }, 2000);
  };

  const agregarPara = (melliza: 'melliza1' | 'melliza2') => {
    agregarAlCarrito(regalo, melliza);
    setDetalleAbierto(false);
    mostrarNotificacion(melliza === 'melliza1' ? melliza1 : melliza2);
  };

  return (
    <>
      <div
        className="gift-card group relative cursor-pointer"
        onClick={() => setDetalleAbierto(true)}
      >
        {/* Notificación de confirmación */}
        {notificacion.visible && (
          <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center z-50 backdrop-blur-sm pointer-events-none">
            <div className="text-center text-white">
              <div className="text-4xl mb-2">✓</div>
              <p className="font-semibold">¡Agregado para {notificacion.melliza}!</p>
            </div>
          </div>
        )}

        {/* Imagen */}
        <div className="relative overflow-hidden bg-soft-gray md:aspect-square">
          <img
            src={regalo.imagenUrl}
            alt={regalo.nombre}
            className="w-full h-auto md:h-full md:object-contain"
          />

          {/* Sugerencia al pasar el mouse: abrir características */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 text-gray-700 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
              🔍 Ver características
            </span>
          </div>

          {/* Badge de colaborativo */}
          {regalo.permiteColaborativo && (
            <div className="absolute top-3 left-3 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              🤝 Colaborativo
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-5">
          <h3 className="text-lg font-display font-semibold text-gray-800 mb-2">
            {regalo.nombre}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {regalo.descripcion}
          </p>

          {/* Precio */}
          <div className="mb-4">
            {regalo.precioCLP > 0 ? (
              <p className="text-2xl font-bold text-pastel-pink">
                {formatCLP(regalo.precioCLP)}
              </p>
            ) : (
              <p className="text-lg font-semibold text-pastel-lavender">
                Monto a elección 💰
              </p>
            )}
          </div>

          {/* Barra de progreso para colaborativos */}
          {regalo.permiteColaborativo && regalo.precioCLP > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Recaudado</span>
                <span>{Math.round(porcentajeRecaudado)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-pastel-pink to-pastel-lavender h-2 rounded-full transition-all duration-500"
                  style={{ width: `${porcentajeRecaudado}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatCLP(regalo.montoRecaudadoCLP)} de {formatCLP(regalo.precioCLP)}
              </p>
            </div>
          )}

          {/* Botones para cada melliza */}
          <div className="space-y-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                agregarPara('melliza1');
              }}
              className="w-full py-2 px-4 rounded-full font-semibold transition-all duration-300 text-sm bg-pastel-pink/20 text-pastel-pink hover:bg-pastel-pink/40"
            >
              🎁 Para {melliza1}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                agregarPara('melliza2');
              }}
              className="w-full py-2 px-4 rounded-full font-semibold transition-all duration-300 text-sm bg-pastel-lavender/20 text-pastel-lavender hover:bg-pastel-lavender/40"
            >
              🎁 Para {melliza2}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de detalle */}
      {detalleAbierto && (
        <DetalleRegaloModal
          regalo={regalo}
          melliza1={melliza1}
          melliza2={melliza2}
          onCerrar={() => setDetalleAbierto(false)}
          onAgregar={agregarPara}
        />
      )}
    </>
  );
}

