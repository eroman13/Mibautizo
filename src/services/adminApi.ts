/**
 * Cliente API para el panel admin
 */

import { API_URL } from './config';

function getAuthHeaders() {
  const token = localStorage.getItem('admin_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export const adminApi = {
  // Estadísticas del dashboard
  getStats: async () => {
    const response = await fetch(`${API_URL}/admin/stats`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    return response.json();
  },

  // Contribuciones
  getContribuciones: async () => {
    const response = await fetch(`${API_URL}/admin/contribuciones`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    return response.json();
  },

  // Registrar un regalo recibido por fuera de Mercado Pago (transferencia, efectivo u otro)
  crearContribucion: async (data: {
    nombreInvitado: string;
    emailInvitado?: string;
    montoCLP: number;
    giftId?: number | null;
    paraMelliza?: 'melliza1' | 'melliza2' | null;
    metodoPago?: 'transferencia' | 'efectivo' | 'otro';
    referencia?: string;
    fecha?: string;
    dedicatoria?: string;
  }) => {
    const response = await fetch(`${API_URL}/admin/contribuciones`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Editar un aporte registrado a mano
  actualizarContribucion: async (id: number, data: any) => {
    const response = await fetch(`${API_URL}/admin/contribuciones/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Eliminar un aporte registrado a mano
  eliminarContribucion: async (id: number) => {
    const response = await fetch(`${API_URL}/admin/contribuciones/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // CRUD de regalos
  crearRegalo: async (data: any) => {
    const response = await fetch(`${API_URL}/admin/regalos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Carga masiva de regalos
  crearRegalosMasivo: async (regalos: any[]) => {
    const response = await fetch(`${API_URL}/admin/regalos/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ regalos }),
    });
    return response.json();
  },

  actualizarRegalo: async (id: number, data: any) => {
    const response = await fetch(`${API_URL}/admin/regalos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  eliminarRegalo: async (id: number) => {
    const response = await fetch(`${API_URL}/admin/regalos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Evento
  getEventoAdmin: async () => {
    const response = await fetch(`${API_URL}/admin/evento`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    return response.json();
  },

  actualizarEvento: async (data: any) => {
    const response = await fetch(`${API_URL}/admin/evento`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Exportar CSV
  exportarCSV: async () => {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_URL}/admin/export-csv`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contribuciones-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  // Limpiar todos los pagos de prueba
  limpiarPagos: async () => {
    const response = await fetch(`${API_URL}/admin/limpiar-pagos`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Enviar correo de prueba
  testEmail: async (email: string) => {
    const response = await fetch(`${API_URL}/admin/test-email`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  // Confirmaciones de asistencia
  getAsistencias: async () => {
    const response = await fetch(`${API_URL}/admin/asistencias`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    return response.json();
  },

  eliminarAsistencia: async (id: number) => {
    const response = await fetch(`${API_URL}/admin/asistencias/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Invitaciones (enlaces por WhatsApp)
  getInvitaciones: async () => {
    const response = await fetch(`${API_URL}/admin/invitaciones`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    return response.json();
  },

  crearInvitacion: async (data: any) => {
    const response = await fetch(`${API_URL}/admin/invitaciones`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  crearInvitacionesMasivo: async (invitaciones: any[]) => {
    const response = await fetch(`${API_URL}/admin/invitaciones/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ invitaciones }),
    });
    return response.json();
  },

  actualizarInvitacion: async (id: number, data: any) => {
    const response = await fetch(`${API_URL}/admin/invitaciones/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  marcarEnviadaInvitacion: async (id: number) => {
    const response = await fetch(`${API_URL}/admin/invitaciones/${id}/marcar-enviada`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Registrar el envío de un recordatorio por WhatsApp (quienes no confirman)
  registrarRecordatorio: async (id: number) => {
    const response = await fetch(`${API_URL}/admin/invitaciones/${id}/recordatorio`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  eliminarInvitacion: async (id: number) => {
    const response = await fetch(`${API_URL}/admin/invitaciones/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Analytics de visitantes
  getAnalytics: async (filters?: any) => {
    const query = new URLSearchParams();
    if (filters?.page) query.append('page', filters.page);
    if (filters?.days) query.append('days', filters.days);
    
    const response = await fetch(`${API_URL}/admin/analytics?${query}`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    return response.json();
  },

  // Subir una imagen (portada, portada móvil o foto de regalo).
  // El backend la guarda en Cloudflare R2 y devuelve { success, imageUrl }.
  subirImagen: async (base64: string) => {
    const response = await fetch(`${API_URL}/upload-image`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ base64 }),
    });
    return response.json();
  },

  // Álbum de fotos: listado completo con resumen por estado
  getFotos: async () => {
    const response = await fetch(`${API_URL}/admin/fotos`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    return response.json();
  },

  // Álbum de fotos: subir una foto desde el panel (se aprueba automáticamente)
  subirFotoAdmin: async (data: { base64: string; autor?: string; mensaje?: string }) => {
    const response = await fetch(`${API_URL}/admin/fotos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Álbum de fotos: aprobar o rechazar
  actualizarEstadoFoto: async (id: number, estado: 'aprobada' | 'rechazada' | 'pendiente') => {
    const response = await fetch(`${API_URL}/admin/fotos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ estado }),
    });
    return response.json();
  },

  // Álbum de fotos: eliminar (también la borra de R2)
  eliminarFoto: async (id: number) => {
    const response = await fetch(`${API_URL}/admin/fotos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return response.json();
  },
};
