/**
 * Página de gestión de contribuciones
 */

import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { formatCLP } from '../../utils/format';
import { Link } from 'react-router-dom';

export default function AdminContribuciones() {
  const [contribuciones, setContribuciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    cargarContribuciones();
  }, []);

  const cargarContribuciones = async () => {
    try {
      const response = await adminApi.getContribuciones();
      setContribuciones(response.data);
    } catch (error) {
      console.error('Error al cargar contribuciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const contribucionesFiltradas = contribuciones.filter(c =>
    c.nombreInvitado.toLowerCase().includes(filtro.toLowerCase()) ||
    c.gift?.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pastel-pink"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-display font-bold text-gray-800">
              📊 Contribuciones
            </h1>
            <Link to="/admin/dashboard" className="text-pastel-pink hover:text-pastel-lavender">
              ← Volver al dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filtros y acciones */}
        <div className="bg-white rounded-lg shadow-soft p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por nombre o regalo..."
              className="input-field max-w-md"
            />
            <button
              onClick={() => adminApi.exportarCSV()}
              className="btn-primary"
            >
              📤 Exportar a CSV
            </button>
          </div>
        </div>

        {/* Tabla de contribuciones */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Invitado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Regalo</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Bruto</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Comisión</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Neto</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contribucionesFiltradas.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(c.createdAt).toLocaleDateString('es-CL')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-800">{c.nombreInvitado}</div>
                      {c.emailInvitado && (
                        <div className="text-xs text-gray-500">{c.emailInvitado}</div>
                      )}
                      {c.dedicatoria && (
                        <div className="text-xs text-gray-500 italic mt-1">"{c.dedicatoria}"</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {c.gift?.nombre || 'Aporte libre'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-800">
                      {formatCLP(c.montoBrutoCLP)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-orange-600">
                      {formatCLP(c.comisionCLP)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-green-600">
                      {formatCLP(c.montoNetoCLP)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          c.estadoPago === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : c.estadoPago === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {c.estadoPago}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {contribucionesFiltradas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay contribuciones que mostrar</p>
            </div>
          )}
        </div>

        {/* Resumen */}
        <div className="mt-6 bg-white rounded-lg shadow-soft p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total contribuciones:</p>
              <p className="text-2xl font-bold text-gray-800">{contribucionesFiltradas.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total bruto:</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCLP(contribucionesFiltradas.reduce((sum, c) => sum + c.montoBrutoCLP, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total neto:</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCLP(contribucionesFiltradas.reduce((sum, c) => sum + c.montoNetoCLP, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
