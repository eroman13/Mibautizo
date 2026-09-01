/**
 * Página 404 personalizada
 * Se muestra cuando el usuario navega a una ruta que no existe.
 * Gracias a la configuración de rewrites en Vercel, el router del cliente
 * maneja estas rutas en lugar de devolver un 404 estático.
 */

import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-soft-gray flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-display font-bold text-gray-800 mb-3">
          404 - Página no encontrada
        </h1>
        <p className="text-gray-600 mb-6">
          Lo sentimos, la página que buscas no existe o fue movida.
        </p>
        <div className="space-y-3">
          <Link to="/" className="btn-primary inline-block w-full">
            Volver a la tienda
          </Link>
          <Link to="/regalos" className="btn-secondary inline-block w-full">
            Ver la lista de regalos
          </Link>
        </div>
      </div>
    </div>
  );
}
