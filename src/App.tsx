/**
 * Componente raíz de la aplicación
 * Maneja el enrutamiento entre vista pública y panel admin
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CarritoProvider } from './context/CarritoContext';
import { AuthProvider } from './context/AuthContext';

// Páginas públicas
import Home from './pages/Home';
import Regalos from './pages/Regalos';
import Checkout from './pages/Checkout';
import PagoExitoso from './pages/PagoExitoso';
import PagoFallido from './pages/PagoFallido';
import PagoPendiente from './pages/PagoPendiente';

// Páginas del admin
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminContribuciones from './pages/admin/Contribuciones';
import AdminRegalos from './pages/admin/Regalos';
import AdminConfiguracion from './pages/admin/Configuracion';
import AdminUsers from './pages/admin/AdminUsers';
import ProtectedRoute from './components/admin/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CarritoProvider>
          <div className="min-h-screen bg-soft-gray">
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/regalos" element={<Regalos />} />
              <Route path="/checkout" element={<Checkout />} />
              
              {/* Páginas de retorno de Mercado Pago */}
              <Route path="/pago-exitoso" element={<PagoExitoso />} />
              <Route path="/pago-fallido" element={<PagoFallido />} />
              <Route path="/pago-pendiente" element={<PagoPendiente />} />

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
                path="/admin/contribuciones"
                element={
                  <ProtectedRoute>
                    <AdminContribuciones />
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
            </Routes>
          </div>
        </CarritoProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
