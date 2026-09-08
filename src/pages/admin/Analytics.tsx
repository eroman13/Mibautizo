/**
 * Pagina de Analytics - Muestra estadisticas de visitantes
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { useAuth } from '../../context/AuthContext';

interface AnalyticsStats {
  totalViews: number;
  uniqueSessions: number;
  viewsPerSession: string | number;
  daysTracked: number;
  pageViewsByPage: Array<{ page: string; count: number }>;
  pageViewsByDay: Array<{ day: string; count: number }>;
  topSessions: Array<{
    sessionId: string;
    visits: number;
    pages: string[];
    lastVisit: Date | string;
  }>;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterPage, setFilterPage] = useState('');
  const [filterDays, setFilterDays] = useState(30);
  const { logout } = useAuth();

  useEffect(() => {
    cargarAnalytics();
  }, [filterPage, filterDays]);

  const cargarAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAnalytics({
        page: filterPage || undefined,
        days: filterDays,
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error al cargar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pastel-pink"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-800">Analytics - Visitantes</h1>
              <p className="text-gray-600 text-sm">Seguimiento de interaccion en el sitio</p>
            </div>
            <button onClick={logout} className="text-red-500 hover:text-red-700 font-medium">
              Cerrar sesion
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <nav className="bg-white rounded-lg shadow-soft p-4 mb-8">
          <div className="flex flex-wrap gap-4">
            <Link to="/admin/dashboard" className="text-gray-600 hover:text-pastel-pink">Dashboard</Link>
            <Link to="/admin/analytics" className="text-pastel-pink font-semibold">Analytics</Link>
            <Link to="/admin/contribuciones" className="text-gray-600 hover:text-pastel-pink">Contribuciones</Link>
            <Link to="/admin/asistencias" className="text-gray-600 hover:text-pastel-pink">Asistencia</Link>
            <Link to="/admin/invitaciones" className="text-gray-600 hover:text-pastel-pink">Invitaciones</Link>
            <Link to="/admin/regalos" className="text-gray-600 hover:text-pastel-pink">Gestionar Regalos</Link>
            <Link to="/admin/configuracion" className="text-gray-600 hover:text-pastel-pink">Configuracion</Link>
            <Link to="/admin/usuarios" className="text-gray-600 hover:text-pastel-pink">Usuarios</Link>
          </div>
        </nav>

        {!stats ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
            No hay datos de analytics disponibles
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-soft p-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Filtrar por pagina:</label>
                <select
                  value={filterPage}
                  onChange={(e) => setFilterPage(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="">Todas</option>
                  <option value="regalos">Regalos</option>
                  <option value="invitacion">Invitacion</option>
                  <option value="asistencia">Asistencia</option>
                  <option value="checkout">Checkout</option>
                  <option value="home">Home</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Ultimos:</label>
                <select
                  value={filterDays}
                  onChange={(e) => setFilterDays(parseInt(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="7">7 dias</option>
                  <option value="30">30 dias</option>
                  <option value="90">90 dias</option>
                  <option value="180">6 meses</option>
                  <option value="365">1 ano</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-lg shadow-card p-4">
                <div className="text-sm opacity-90 mb-1">Vistas Totales</div>
                <div className="text-3xl font-bold">{stats.totalViews.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-lg shadow-card p-4">
                <div className="text-sm opacity-90 mb-1">Visitantes Unicos</div>
                <div className="text-3xl font-bold">{stats.uniqueSessions.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-pink-400 to-pink-600 text-white rounded-lg shadow-card p-4">
                <div className="text-sm opacity-90 mb-1">Vistas por Visitante</div>
                <div className="text-3xl font-bold">{stats.viewsPerSession}</div>
              </div>
              <div className="bg-gradient-to-br from-green-400 to-green-600 text-white rounded-lg shadow-card p-4">
                <div className="text-sm opacity-90 mb-1">Periodo Analizado</div>
                <div className="text-3xl font-bold">{stats.daysTracked}d</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-soft p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Vistas por Pagina</h3>
              <div className="space-y-3">
                {stats.pageViewsByPage.length > 0 ? (
                  stats.pageViewsByPage.map((item) => (
                    <div key={item.page} className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">{item.page}</span>
                      <span className="text-gray-600 font-semibold">{item.count.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No hay datos</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-soft p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Top 10 Visitantes Mas Activos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4 font-semibold text-gray-700">ID Visitante</th>
                      <th className="text-center py-2 px-4 font-semibold text-gray-700">Visitas</th>
                      <th className="text-left py-2 px-4 font-semibold text-gray-700">Paginas</th>
                      <th className="text-right py-2 px-4 font-semibold text-gray-700">Ultima Visita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topSessions.map((session) => (
                      <tr key={session.sessionId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs">{session.sessionId.substring(0, 12)}...</span>
                        </td>
                        <td className="text-center py-3 px-4">{session.visits}</td>
                        <td className="py-3 px-4">{session.pages.join(', ')}</td>
                        <td className="py-3 px-4 text-right text-gray-600 text-xs">
                          {new Date(session.lastVisit).toLocaleString('es-CL')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
