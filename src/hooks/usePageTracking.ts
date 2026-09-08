/**
 * Hook para rastrear visitas a página
 */

import { useEffect } from 'react';
import { api } from '../services/api';

export function usePageTracking(pageName: string) {
  useEffect(() => {
    // Rastrear visita de forma asincrónica sin bloquear
    const trackVisit = async () => {
      try {
        const referrer = document.referrer || undefined;
        await api.trackPageView(pageName, referrer);
      } catch (error) {
        // Silenciosamente ignorar errores de analytics
        console.debug('Analytics error:', error);
      }
    };

    // Ejecutar con un pequeño delay para no bloquear la renderización
    const timeout = setTimeout(trackVisit, 500);

    return () => clearTimeout(timeout);
  }, [pageName]);
}
