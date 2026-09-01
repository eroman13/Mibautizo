/**
 * Configuración central de la URL de la API
 * Usa VITE_API_URL (configurado en Vercel) o un fallback razonable
 */

const rawApiUrl = import.meta.env.VITE_API_URL || 'https://mibautizo-production.up.railway.app';
const apiBaseUrl = rawApiUrl.replace(/\/$/, '');

// Asegurar que termine en /api
export const API_URL = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`;

export function buildApiUrl(endpoint: string) {
  const trimmedEndpoint = endpoint.replace(/^\//, '');
  return `${API_URL}/${trimmedEndpoint}`;
}
