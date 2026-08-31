/**
 * Cliente API para comunicarse con el backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${endpoint}`, {
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
};
