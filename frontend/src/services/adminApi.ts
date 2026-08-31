/**
 * Cliente API para el panel admin
 */

const API_URL = 'http://localhost:3000/api';

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
    });
    return response.json();
  },

  // Contribuciones
  getContribuciones: async () => {
    const response = await fetch(`${API_URL}/admin/contribuciones`, {
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
};
