/**
 * Página de administración de usuarios admin
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/adminApi';

interface AdminUser {
  id: number;
  username: string;
  nombre: string;
  email?: string;
  activo: boolean;
  createdAt: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [usuarios, setUsuarios] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  
  // Para crear nuevo usuario
  const [mostrarForm, setMostrarForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [creando, setCreando] = useState(false);

  // Para editar usuario
  const [editando, setEditando] = useState<number | null>(null);
  const [formEditData, setFormEditData] = useState({
    nombre: '',
    email: '',
    activo: true,
    password: '',
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:3000/api/admin-users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setUsuarios(data.data);
      } else {
        setError(data.error || 'Error al cargar usuarios');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const crearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos
    if (!formData.username || !formData.nombre || !formData.password) {
      setError('Usuario, nombre y contraseña son requeridos');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setCreando(true);
      setError('');
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch('http://localhost:3000/api/admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: formData.username,
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMensaje('✅ Usuario creado exitosamente');
        setFormData({ username: '', nombre: '', email: '', password: '', confirmPassword: '' });
        setMostrarForm(false);
        cargarUsuarios();
        setTimeout(() => setMensaje(''), 3000);
      } else {
        setError(data.error || 'Error al crear usuario');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError('Error al crear usuario');
    } finally {
      setCreando(false);
    }
  };

  const abrirEditar = (usuario: AdminUser) => {
    setEditando(usuario.id);
    setFormEditData({
      nombre: usuario.nombre,
      email: usuario.email || '',
      activo: usuario.activo,
      password: '',
    });
    setError('');
  };

  const actualizarUsuario = async (userId: number) => {
    try {
      setCreando(true);
      setError('');
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(`http://localhost:3000/api/admin-users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formEditData),
      });

      const data = await response.json();
      if (data.success) {
        setMensaje('✅ Usuario actualizado exitosamente');
        setEditando(null);
        cargarUsuarios();
        setTimeout(() => setMensaje(''), 3000);
      } else {
        setError(data.error || 'Error al actualizar usuario');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError('Error al actualizar usuario');
    } finally {
      setCreando(false);
    }
  };

  const eliminarUsuario = async (userId: number, username: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el usuario "${username}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:3000/api/admin-users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setMensaje('✅ Usuario eliminado exitosamente');
        cargarUsuarios();
        setTimeout(() => setMensaje(''), 3000);
      } else {
        setError(data.error || 'Error al eliminar usuario');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError('Error al eliminar usuario');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-blue via-pastel-pink to-pastel-lavender">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-800">
                👥 Gestionar Usuarios
              </h1>
              <p className="text-gray-600 mt-1">
                Administra los usuarios que pueden acceder al panel
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <Link
              to="/admin/dashboard"
              className="px-4 py-4 text-gray-600 hover:text-pastel-pink border-b-2 border-transparent hover:border-pastel-pink transition"
            >
              Dashboard
            </Link>
            <Link
              to="/admin/contribuciones"
              className="px-4 py-4 text-gray-600 hover:text-pastel-pink border-b-2 border-transparent hover:border-pastel-pink transition"
            >
              Contribuciones
            </Link>
            <Link
              to="/admin/regalos"
              className="px-4 py-4 text-gray-600 hover:text-pastel-pink border-b-2 border-transparent hover:border-pastel-pink transition"
            >
              Gestionar Regalos
            </Link>
            <Link
              to="/admin/configuracion"
              className="px-4 py-4 text-gray-600 hover:text-pastel-pink border-b-2 border-transparent hover:border-pastel-pink transition"
            >
              Configuración
            </Link>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-4 text-gray-600 hover:text-pastel-pink border-b-2 border-transparent hover:border-pastel-pink transition"
            >
              Ver sitio público →
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensajes */}
        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-lg">
            {mensaje}
          </div>
        )}

        {/* Botón crear nuevo usuario */}
        <div className="mb-6">
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="btn-primary"
          >
            {mostrarForm ? 'Cancelar' : '➕ Crear Nuevo Usuario'}
          </button>
        </div>

        {/* Formulario crear usuario */}
        {mostrarForm && (
          <div className="bg-white rounded-2xl shadow-card p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Crear Nuevo Usuario
            </h2>

            <form onSubmit={crearUsuario} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Usuario
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="input-field"
                    placeholder="Ej: pareja_name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    className="input-field"
                    placeholder="Ej: Mi pareja"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="input-field"
                    placeholder="Ej: pareja@example.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="input-field"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="input-field"
                    placeholder="Confirma la contraseña"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creando}
                  className="btn-primary"
                >
                  {creando ? '⏳ Creando...' : '✅ Crear Usuario'}
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de usuarios */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando usuarios...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-8 text-center">
            <p className="text-gray-600">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {usuarios.map((usuario) => (
              <div
                key={usuario.id}
                className="bg-white rounded-2xl shadow-card p-6"
              >
                {editando === usuario.id ? (
                  // Modo edición
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800">
                      Editar: {usuario.username}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={formEditData.nombre}
                          onChange={(e) =>
                            setFormEditData({
                              ...formEditData,
                              nombre: e.target.value,
                            })
                          }
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formEditData.email}
                          onChange={(e) =>
                            setFormEditData({
                              ...formEditData,
                              email: e.target.value,
                            })
                          }
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Nueva Contraseña (dejar vacío para no cambiar)
                        </label>
                        <input
                          type="password"
                          value={formEditData.password}
                          onChange={(e) =>
                            setFormEditData({
                              ...formEditData,
                              password: e.target.value,
                            })
                          }
                          className="input-field"
                          placeholder="Dejar vacío para mantener la actual"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Estado
                        </label>
                        <select
                          value={formEditData.activo ? 'activo' : 'inactivo'}
                          onChange={(e) =>
                            setFormEditData({
                              ...formEditData,
                              activo: e.target.value === 'activo',
                            })
                          }
                          className="input-field"
                        >
                          <option value="activo">Activo</option>
                          <option value="inactivo">Inactivo</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => actualizarUsuario(usuario.id)}
                        disabled={creando}
                        className="btn-primary"
                      >
                        {creando ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                      </button>
                      <button
                        onClick={() => setEditando(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  // Modo visualización
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {usuario.nombre}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Usuario: <code className="bg-gray-100 px-2 py-1 rounded">
                          {usuario.username}
                        </code>
                      </p>
                      {usuario.email && (
                        <p className="text-gray-600 text-sm">
                          Email: {usuario.email}
                        </p>
                      )}
                      <p className="text-gray-500 text-xs mt-2">
                        Creado: {new Date(usuario.createdAt).toLocaleDateString('es-CL')}
                      </p>
                      <p className={`text-xs mt-1 font-medium ${usuario.activo ? 'text-green-600' : 'text-red-600'}`}>
                        {usuario.activo ? '✓ Activo' : '✗ Inactivo'}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirEditar(usuario)}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                      >
                        ✏️ Editar
                      </button>
                      {usuarios.length > 1 && (
                        <button
                          onClick={() =>
                            eliminarUsuario(usuario.id, usuario.username)
                          }
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                        >
                          🗑️ Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
