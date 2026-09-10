/**
 * Componente raíz de la aplicación
 * Maneja el enrutamiento entre vista pública y panel admin
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { CarritoProvider } from './context/CarritoContext';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ValidarRetornoPago from './components/pago/ValidarRetornoPago';
import { api } from './services/api';

// Páginas públicas
import Home from './pages/Home';
import Invitacion from './pages/Invitacion';
import InvLink from './pages/InvLink';
import Regalos from './pages/Regalos';
import Checkout from './pages/Checkout';
import ConfirmarAsistencia from './pages/ConfirmarAsistencia';
import PagoExitoso from './pages/PagoExitoso';
import PagoFallido from './pages/PagoFallido';
import PagoPendiente from './pages/PagoPendiente';
import PagoEstadoControlado from './pages/PagoEstadoControlado';
import NotFound from './pages/NotFound';

// Páginas del admin
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminAnalytics from './pages/admin/Analytics';
import AdminContribuciones from './pages/admin/Contribuciones';
import AdminAsistencias from './pages/admin/Asistencias';
import AdminInvitaciones from './pages/admin/Invitaciones';
import AdminRegalos from './pages/admin/Regalos';
import AdminConfiguracion from './pages/admin/Configuracion';
import AdminUsers from './pages/admin/AdminUsers';
import ProtectedRoute from './components/admin/ProtectedRoute';

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;

    let page = 'home';
    if (location.pathname === '/regalos') page = 'regalos';
    else if (location.pathname === '/checkout') page = 'checkout';
    else if (location.pathname === '/confirmar-asistencia') page = 'asistencia';
    else if (location.pathname === '/invitacion') page = 'invitacion';
    else if (location.pathname.startsWith('/i/')) page = 'invitacion-link';
    else if (location.pathname.startsWith('/pago-')) page = 'pago';
    else if (location.pathname !== '/') page = 'otro';

    const params = new URLSearchParams(location.search);
    let invitationToken = params.get('token') || undefined;
    if (!invitationToken && location.pathname.startsWith('/i/')) {
      invitationToken = location.pathname.replace('/i/', '').split('/')[0] || undefined;
    }

    api.trackPageView(page, document.referrer || undefined, invitationToken).catch(() => {
      // No bloquear UX por fallas de analytics
    });
  }, [location.pathname, location.search]);

  return null;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CarritoProvider>
          <ErrorBoundary>
            <RouteTracker />
            <div className="min-h-screen bg-soft-gray">
              <Routes>
                {/* Rutas públicas */}
                <Route path="/" element={<Home />} />
                <Route path="/invitacion" element={<Invitacion />} />
                <Route path="/i/:token" element={<InvLink />} />
                <Route path="/regalos" element={<Regalos />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/confirmar-asistencia" element={<ConfirmarAsistencia />} />

                {/* Páginas de retorno de Mercado Pago (validadas) */}
                <Route
                  path="/pago-exitoso"
                  element={
                    <ValidarRetornoPago esperado="aprobado">
                      <PagoExitoso />
                    </ValidarRetornoPago>
                  }
                />
                <Route
                  path="/pago-fallido"
                  element={
                    <ValidarRetornoPago esperado={['rechazado', 'cancelado']}>
                      <PagoFallido />
                    </ValidarRetornoPago>
                  }
                />
                <Route
                  path="/pago-pendiente"
                  element={
                    <ValidarRetornoPago esperado="pendiente">
                      <PagoPendiente />
                    </ValidarRetornoPago>
                  }
                />
                <Route
                  path="/pago-estado-controlado"
                  element={<PagoEstadoControlado />}
                />

                {/* Panel admin */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <ProtectedRoute>
                      <AdminAnalytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/contribuciones"
                  element={
                    <ProtectedRoute>
                      <AdminContribuciones />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/asistencias"
                  element={
                    <ProtectedRoute>
                      <AdminAsistencias />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/invitaciones"
                  element={
                    <ProtectedRoute>
                      <AdminInvitaciones />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/regalos"
                  element={
                    <ProtectedRoute>
                      <AdminRegalos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/configuracion"
                  element={
                    <ProtectedRoute>
                      <AdminConfiguracion />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/usuarios"
                  element={
                    <ProtectedRoute>
                      <AdminUsers />
                    </ProtectedRoute>
                  }
                />

                {/* Página 404 (catch-all) */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </ErrorBoundary>
        </CarritoProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
