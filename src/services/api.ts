/**
 * Cliente API para comunicarse con el backend
 */

import { buildApiUrl } from './config';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(buildApiUrl(endpoint), {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en la solicitud');
  }

  return data;
}

export const api = {
  // Obtener lista de regalos
  getRegalos: async () => {
    return fetchAPI('/regalos');
  },

  // Obtener un regalo específico
  getRegalo: async (id: number) => {
    return fetchAPI(`/regalos/${id}`);
  },

  // Obtener información del evento
  getEvento: async () => {
    return fetchAPI('/evento');
  },

  // Crear preferencia de pago
  crearPreferencia: async (data: {
    regalos: Array<{ id: number; cantidad?: number; paraGemela?: 'gemela1' | 'gemela2' }>;
    invitado: {
      nombre: string;
      email?: string;
      dedicatoria?: string;
    };
    montoLibre?: number;
  }) => {
    return fetchAPI('/crear-preferencia', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Confirmar asistencia al evento (RSVP)
  confirmarAsistencia: async (data: {
    nombreFamilia: string;
    email?: string;
    telefono?: string;
    mensaje?: string;
    asistentes: Array<{ nombre: string; tipo: 'adulto' | 'nino'; edad?: number | null }>;
  }) => {
    return fetchAPI('/confirmar-asistencia', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
