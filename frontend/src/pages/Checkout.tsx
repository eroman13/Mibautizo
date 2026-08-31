/**
 * Página de checkout
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';
import { api } from '../services/api';
import { formatCLP } from '../utils/format';
import { Evento } from '../types';

export default function Checkout() {
  const { items, limpiarCarrito, regalosGemela1, regalosGemela2 } = useCarrito();
  const navigate = useNavigate();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    dedicatoria: '',
    montoLibre: undefined as number | undefined,
  });

  useEffect(() => {
    cargarEvento();
    
    if (items.length === 0 || regalosGemela1 === 0 || regalosGemela2 === 0) {
      navigate('/regalos');
    }
  }, [items, navigate, regalosGemela1, regalosGemela2]);

  const cargarEvento = async () => {
    try {
      const response = await api.getEvento();
      setEvento(response.data);
    } catch (error) {
      console.error('Error al cargar evento:', error);
    }
  };

  const calcularTotal = () => {
    let total = items.reduce((sum, item) => {
      return sum + (item.montoLibre || item.regalo.precioCLP);
    }, 0);
    
    // Si hay un aporte libre y se ingresó un monto, actualizar el total
    if (items.some(item => item.regalo.precioCLP === 0) && formData.montoLibre) {
      // Restar el aporte libre anterior (si lo hay) y sumar el nuevo
      total = total - (items.find(item => item.regalo.precioCLP === 0)?.montoLibre || 0) + formData.montoLibre;
    }
    
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validaciones
      if (!formData.nombre.trim()) {
        throw new Error('El nombre es obligatorio');
      }

      if (regalosGemela1 === 0 || regalosGemela2 === 0) {
        throw new Error('Debes seleccionar al menos un regalo para cada gemela');
      }

      // Preparar datos para el backend
      const regalos = items.map(item => ({
        id: item.regalo.id,
        paraGemela: item.paraGemela,
      }));

      // Validar si hay regalo de aporte libre y si se ingresó un monto
      const tieneAporteLibre = items.some(item => item.regalo.precioCLP === 0);
      if (tieneAporteLibre && (!formData.montoLibre || formData.montoLibre < 1000)) {
        throw new Error('Para el aporte libre, debes ingresar un monto mínimo de $1.000');
      }

      // Crear preferencia de pago
      const response = await api.crearPreferencia({
        regalos,
        invitado: {
          nombre: formData.nombre,
          email: formData.email || undefined,
          dedicatoria: formData.dedicatoria || undefined,
        },
        montoLibre: formData.montoLibre,
      });

      console.log('✅ Preferencia creada:', response.data);

      // Redirigir a Mercado Pago
      if (response.data.initPoint) {
        window.location.href = response.data.initPoint;
      } else {
        throw new Error('No se recibió el link de pago');
      }
    } catch (err) {
      console.error('Error al crear preferencia:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar el pago');
      setLoading(false);
    }
  };

  if (items.length === 0 || !evento) return null;

  const total = calcularTotal();
  const itemsGemela1 = items.filter(item => item.paraGemela === 'gemela1');
  const itemsGemela2 = items.filter(item => item.paraGemela === 'gemela2');

  return (
    <div className="min-h-screen bg-soft-gray py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-display font-bold text-gray-800 mb-8 text-center">
          💳 Finalizar Regalo
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Formulario */}
          <div className="bg-white rounded-2xl shadow-card p-8">
            <h2 className="text-2xl font-display font-semibold text-gray-800 mb-6">
              Tus datos
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="input-field"
                  placeholder="Ej: María González"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  placeholder="tu@email.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Para recibir la confirmación del pago
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Mensaje para los papás (opcional)
                </label>
                <textarea
                  value={formData.dedicatoria}
                  onChange={(e) => setFormData({ ...formData, dedicatoria: e.target.value })}
                  className="input-field"
                  rows={4}
                  placeholder="Escribe un mensaje cariñoso..."
                />
              </div>

              {/* Campo para aporte libre */}
              {items.some(item => item.regalo.precioCLP === 0) && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="block text-gray-700 font-medium mb-2">
                    Monto del aporte libre <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 font-semibold">$</span>
                    <input
                      type="number"
                      required
                      min="1000"
                      step="1000"
                      value={formData.montoLibre || ''}
                      onChange={(e) => setFormData({ ...formData, montoLibre: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="input-field flex-1"
                      placeholder="Ingresa un monto (mínimo $1.000)"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Monto mínimo: $1.000 CLP
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Procesando...' : 'Continuar al pago 💳'}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Serás redirigido a Mercado Pago para completar el pago de forma segura
              </p>
            </form>
          </div>

          {/* Resumen */}
          <div className="bg-white rounded-2xl shadow-card p-8">
            <h2 className="text-2xl font-display font-semibold text-gray-800 mb-6">
              Resumen
            </h2>

            {/* Regalos para Gemela 1 */}
            {itemsGemela1.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-pastel-pink mb-3 flex items-center gap-2">
                  👧 Para {evento.nombreGemela1} ({itemsGemela1.length})
                </h3>
                <div className="space-y-3">
                  {itemsGemela1.map((item, index) => (
                    <div key={`${item.regalo.id}-gemela1-${index}`} className="flex gap-3 bg-gray-50 p-3 rounded-lg">
                      <img
                        src={item.regalo.imagenUrl}
                        alt={item.regalo.nombre}
                        className="w-14 h-14 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">
                          {item.regalo.nombre}
                        </p>
                        <p className="text-pastel-pink font-bold text-sm">
                          {formatCLP(item.montoLibre || item.regalo.precioCLP)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regalos para Gemela 2 */}
            {itemsGemela2.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-pastel-lavender mb-3 flex items-center gap-2">
                  👧 Para {evento.nombreGemela2} ({itemsGemela2.length})
                </h3>
                <div className="space-y-3">
                  {itemsGemela2.map((item, index) => (
                    <div key={`${item.regalo.id}-gemela2-${index}`} className="flex gap-3 bg-gray-50 p-3 rounded-lg">
                      <img
                        src={item.regalo.imagenUrl}
                        alt={item.regalo.nombre}
                        className="w-14 h-14 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">
                          {item.regalo.nombre}
                        </p>
                        <p className="text-pastel-lavender font-bold text-sm">
                          {formatCLP(item.montoLibre || item.regalo.precioCLP)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Desglose */}
            <div className="border-t pt-6 space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCLP(total)}</span>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ El desglose final se mostrará en la página de Mercado Pago según la configuración del evento.
                </p>
              </div>

              <div className="flex justify-between text-lg font-bold text-gray-800 pt-3 border-t">
                <span>Estimado a pagar</span>
                <span>{formatCLP(total)}</span>
              </div>
            </div>

            {/* Info de seguridad */}
            <div className="mt-6 bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800 flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>
                  Pago 100% seguro procesado por Mercado Pago. Acepta tarjetas de crédito y débito con opción de pagar en cuotas.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
