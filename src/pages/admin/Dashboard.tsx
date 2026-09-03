/**
 * Dashboard del admin con estadísticas
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { formatCLP } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    cargarStats();
  }, []);

  const cargarStats = async () => {
    try {
      const response = await adminApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-800">
                🎛️ Panel Administrativo
              </h1>
              <p className="text-gray-600 text-sm">Mesa de Regalos - Bautizo</p>
            </div>
            <button
              onClick={logout}
              className="text-red-500 hover:text-red-700 font-medium"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Navegación */}
        <nav className="bg-white rounded-lg shadow-soft p-4 mb-8">
          <div className="flex flex-wrap gap-4">
            <Link to="/admin/dashboard" className="text-pastel-pink font-semibold">
              Dashboard
            </Link>
            <Link to="/admin/contribuciones" className="text-gray-600 hover:text-pastel-pink">
              Contribuciones
            </Link>
            <Link to="/admin/asistencias" className="text-gray-600 hover:text-pastel-pink">
              📋 Asistencia
            </Link>
            <Link to="/admin/regalos" className="text-gray-600 hover:text-pastel-pink">
              Gestionar Regalos
            </Link>
            <Link to="/admin/configuracion" className="text-gray-600 hover:text-pastel-pink">
              Configuración
            </Link>
            <Link to="/admin/usuarios" className="text-gray-600 hover:text-pastel-pink">
              👥 Usuarios
            </Link>
            <a href="/" className="text-gray-600 hover:text-pastel-pink">
              Ver sitio público →
            </a>
          </div>
        </nav>

        {/* Tarjetas de estadísticas */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Neto Recaudado */}
          <div className="bg-gradient-to-br from-green-400 to-green-600 text-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Neto</h3>
              <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">
              {formatCLP(stats?.contribuciones.montoNeto || 0)}
            </p>
            <p className="text-sm opacity-80 mt-1">
              Lo que realmente recibiste
            </p>
          </div>

          {/* Contribuciones */}
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Contribuciones</h3>
              <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{stats?.contribuciones.total || 0}</p>
            <p className="text-sm opacity-80 mt-1">
              Promedio: {formatCLP(stats?.contribuciones.promedio || 0)}
            </p>
          </div>

          {/* Comisiones */}
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Comisiones MP</h3>
              <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">
              {formatCLP(stats?.contribuciones.comision || 0)}
            </p>
            <p className="text-sm opacity-80 mt-1">
              ~{((stats?.contribuciones.comision / stats?.contribuciones.montoBruto * 100) || 0).toFixed(2)}% del total
            </p>
          </div>

          {/* Regalos */}
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Regalos</h3>
              <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{stats?.regalos.pagados}/{stats?.regalos.total}</p>
            <p className="text-sm opacity-80 mt-1">
              {stats?.regalos.disponibles} disponibles
            </p>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="grid md:grid-cols-4 gap-6">
          <Link
            to="/admin/contribuciones"
            className="bg-white rounded-2xl shadow-card p-6 hover:shadow-xl transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              📊 Ver Contribuciones
            </h3>
            <p className="text-gray-600 text-sm">
              Lista detallada de todos los aportes recibidos
            </p>
          </Link>

          <Link
            to="/admin/regalos"
            className="bg-white rounded-2xl shadow-card p-6 hover:shadow-xl transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              🎁 Gestionar Regalos
            </h3>
            <p className="text-gray-600 text-sm">
              Agregar, editar o eliminar regalos del catálogo
            </p>
          </Link>

          <Link
            to="/admin/usuarios"
            className="bg-white rounded-2xl shadow-card p-6 hover:shadow-xl transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              👥 Gestionar Usuarios
            </h3>
            <p className="text-gray-600 text-sm">
              Crear y administrar usuarios del panel
            </p>
          </Link>

          <button
            onClick={() => adminApi.exportarCSV()}
            className="bg-white rounded-2xl shadow-card p-6 hover:shadow-xl transition-shadow text-left"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              📤 Exportar CSV
            </h3>
            <p className="text-gray-600 text-sm">
              Descargar reporte de contribuciones
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
