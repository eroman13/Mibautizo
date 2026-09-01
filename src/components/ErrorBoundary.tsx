/**
 * Error Boundary global
 * Captura cualquier error de renderizado o de carga de datos dentro de la
 * aplicación y muestra una interfaz amigable en lugar de romper la página.
 */

import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Aquí podrías enviar el error a un servicio de monitoreo (Sentry, etc.)
    console.error('[ErrorBoundary] Error capturado:', error, errorInfo);
  }

  private handleReintentar = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleVolverTienda = () => {
    // Forzar recarga completa para limpiar cualquier estado corrupto
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-soft-gray flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 text-center">
            <div className="text-5xl mb-4">😕</div>
            <h1 className="text-2xl font-display font-bold text-gray-800 mb-3">
              Algo salió mal
            </h1>
            <p className="text-gray-600 mb-6">
              Ocurrió un error inesperado al cargar la página. Puedes intentar
              nuevamente o volver a la tienda.
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={this.handleReintentar}
                className="btn-primary w-full"
              >
                Reintentar
              </button>
              <button
                type="button"
                onClick={this.handleVolverTienda}
                className="btn-secondary w-full"
              >
                Volver a la tienda
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
