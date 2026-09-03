/**
 * Página admin: confirmaciones de asistencia (RSVP)
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { ConfirmacionAsistencia } from '../../types';

export default function AdminAsistencias() {
  const [asistencias, setAsistencias] = useState<ConfirmacionAsistencia[]>([]);
  const [resumen, setResumen] = useState({ familias: 0, adultos: 0, ninos: 0 });
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    cargarAsistencias();
  }, []);

  const cargarAsistencias = async () => {
    try {
      const response = await adminApi.getAsistencias();
      setAsistencias(response.data || []);
      setResumen(response.resumen || { familias: 0, adultos: 0, ninos: 0 });
    } catch (error) {
      console.error('Error al cargar asistencias:', error);
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id: number, nombreFamilia: string) => {
    const confirmacion = confirm(
      `⚠️ ¿Eliminar la confirmación de "${nombreFamilia}"?\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmacion) return;

    try {
      const response = await adminApi.eliminarAsistencia(id);
      if (response.success) {
        alert(response.message || 'Confirmación eliminada');
        await cargarAsistencias();
      } else {
        alert(response.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar la confirmación');
    }
  };

  const asistenciasFiltradas = asistencias.filter((a) =>
    a.nombreFamilia.toLowerCase().includes(filtro.toLowerCase())
  );

  const formatearFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

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
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-800">
                📋 Confirmaciones de Asistencia
              </h1>
              <p className="text-gray-600 text-sm">Invitados que confirmaron su presencia</p>
            </div>
            <Link
              to="/admin/dashboard"
              className="text-pastel-pink hover:text-pastel-lavender"
            >
              ← Volver al dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Resumen */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-pink-400 to-pink-600 text-white rounded-2xl shadow-card p-6">
            <h3 className="text-sm font-medium opacity-90">Familias</h3>
            <p className="text-3xl font-bold mt-1">{resumen.familias}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl shadow-card p-6">
            <h3 className="text-sm font-medium opacity-90">Adultos</h3>
            <p className="text-3xl font-bold mt-1">{resumen.adultos}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-2xl shadow-card p-6">
            <h3 className="text-sm font-medium opacity-90">Niños</h3>
            <p className="text-3xl font-bold mt-1">{resumen.ninos}</p>
          </div>
        </div>

        {/* Filtro */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar por familia..."
            className="input-field max-w-sm"
          />
          <span className="text-gray-500 text-sm">
            {asistenciasFiltradas.length} confirmacion
            {asistenciasFiltradas.length !== 1 ? 'es' : ''}
          </span>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {asistenciasFiltradas.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Todavía no hay confirmaciones de asistencia.
              <br />
              Comparte el link de la web para que las familias confirmen. 💌
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Familia</th>
                    <th className="px-6 py-3">Contacto</th>
                    <th className="px-6 py-3">Asistentes</th>
                    <th className="px-6 py-3">Confirmado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {asistenciasFiltradas.map((a) => {
                    const adultos = a.asistentes.filter((p) => p.tipo === 'adulto').length;
                    const ninos = a.asistentes.filter((p) => p.tipo === 'nino');
                    return (
                      <tr key={a.id} className="hover:bg-pink-50/30">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-800">{a.nombreFamilia}</div>
                          {a.mensaje && (
                            <div className="text-xs text-gray-500 mt-1 italic">
                              “{a.mensaje}”
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {a.email && <div>{a.email}</div>}
                          {a.telefono && <div>{a.telefono}</div>}
                          {!a.email && !a.telefono && <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="badge bg-blue-100 text-blue-700">
                              👤 {adultos} adulto{adultos !== 1 ? 's' : ''}
                            </span>
                            <span className="badge bg-purple-100 text-purple-700">
                              🧒 {ninos.length} niño{ninos.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {a.asistentes.map((p) => p.nombre).join(', ')}
                            {ninos.length > 0 && (
                              <span className="text-gray-400">
                                {' '}
                                ·{' '}
                                {ninos
                                  .map((p) => `${p.nombre} (${p.edad} años)`)
                                  .join(', ')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                          {formatearFecha(a.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => eliminar(a.id, a.nombreFamilia)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            🗑️ Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}