/**
 * Página de gestión de regalos (CRUD)
 */

import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { formatCLP } from '../../utils/format';
import { Link } from 'react-router-dom';
import { Regalo } from '../../types';

export default function AdminRegalos() {
  const [regalos, setRegalos] = useState<Regalo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [regaloEditando, setRegaloEditando] = useState<Regalo | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precioCLP: 0,
    imagenUrl: '',
    permiteColaborativo: false,
  });

  useEffect(() => {
    cargarRegalos();
  }, []);

  const cargarRegalos = async () => {
    try {
      const response = await api.getRegalos();
      setRegalos(response.data.regalos);
    } catch (error) {
      console.error('Error al cargar regalos:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (regalo?: Regalo) => {
    if (regalo) {
      setRegaloEditando(regalo);
      setFormData({
        nombre: regalo.nombre,
        descripcion: regalo.descripcion,
        precioCLP: regalo.precioCLP,
        imagenUrl: regalo.imagenUrl,
        permiteColaborativo: regalo.permiteColaborativo,
      });
    } else {
      setRegaloEditando(null);
      setFormData({
        nombre: '',
        descripcion: '',
        precioCLP: 0,
        imagenUrl: '',
        permiteColaborativo: false,
      });
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setRegaloEditando(null);
  };

  const guardarRegalo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (regaloEditando) {
        await adminApi.actualizarRegalo(regaloEditando.id, formData);
      } else {
        await adminApi.crearRegalo(formData);
      }
      await cargarRegalos();
      cerrarModal();
    } catch (error) {
      console.error('Error al guardar regalo:', error);
      alert('Error al guardar el regalo');
    }
  };

  const subirImagen = async (file: File) => {
    try {
      setSubiendo(true);
      
      // Leer archivo como base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        // Enviar al backend
        const response = await fetch('http://localhost:3000/api/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            base64,
            filename: file.name,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setFormData({ ...formData, imagenUrl: `http://localhost:3000${data.imageUrl}` });
          console.log('✅ Imagen subida:', data.imageUrl);
        } else {
          alert('Error al subir imagen: ' + data.error);
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error al subir imagen:', error);
      alert('Error al subir imagen');
    } finally {
      setSubiendo(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      if (files[0].type.startsWith('image/')) {
        subirImagen(files[0]);
      } else {
        alert('Por favor sube una imagen');
      }
    }
  };

  const eliminarRegalo = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este regalo?')) return;

    try {
      const response = await adminApi.eliminarRegalo(id);
      if (response.success) {
        await cargarRegalos();
      } else {
        alert(response.error);
      }
    } catch (error) {
      console.error('Error al eliminar regalo:', error);
      alert('Error al eliminar el regalo');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pastel-pink"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-display font-bold text-gray-800">
              🎁 Gestión de Regalos
            </h1>
            <Link to="/admin/dashboard" className="text-pastel-pink hover:text-pastel-lavender">
              ← Volver al dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Botón agregar */}
        <div className="mb-6">
          <button onClick={() => abrirModal()} className="btn-primary">
            ➕ Agregar Nuevo Regalo
          </button>
        </div>

        {/* Grid de regalos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regalos.map((regalo) => (
            <div key={regalo.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
              <img
                src={regalo.imagenUrl}
                alt={regalo.nombre}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {regalo.nombre}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {regalo.descripcion}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xl font-bold text-pastel-pink">
                    {formatCLP(regalo.precioCLP)}
                  </p>
                  <span
                    className={`badge ${
                      regalo.estado === 'disponible'
                        ? 'badge-success'
                        : 'badge-warning'
                    }`}
                  >
                    {regalo.estado}
                  </span>
                </div>
                {regalo.permiteColaborativo && (
                  <div className="mb-4 text-xs text-purple-600">
                    🤝 Regalo colaborativo
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => abrirModal(regalo)}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarRegalo(regalo.id)}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de agregar/editar */}
      {modalAbierto && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={cerrarModal}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
              <h2 className="text-2xl font-display font-bold text-gray-800 mb-6">
                {regaloEditando ? 'Editar Regalo' : 'Nuevo Regalo'}
              </h2>

              <form onSubmit={guardarRegalo} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Nombre del regalo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="input-field"
                    placeholder="Ej: Pack de 2 bodies de algodón"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Descripción
                  </label>
                  <textarea
                    required
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="Describe el regalo..."
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Precio (CLP)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.precioCLP}
                    onChange={(e) => setFormData({ ...formData, precioCLP: parseInt(e.target.value) })}
                    className="input-field"
                    placeholder="25000"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Imagen del regalo
                  </label>
                  
                  {/* Vista previa de imagen */}
                  {formData.imagenUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden border-2 border-pastel-pink">
                      <img 
                        src={formData.imagenUrl} 
                        alt="Preview" 
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  )}

                  {/* Drag and drop area */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      dragActive
                        ? 'border-pastel-pink bg-pastel-pink/10'
                        : 'border-gray-300 bg-gray-50 hover:border-pastel-pink'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">📸</span>
                      <p className="text-gray-700 font-medium">
                        Arrastra una imagen aquí
                      </p>
                      <p className="text-gray-500 text-sm">
                        o usa el botón para seleccionar
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && subirImagen(e.target.files[0])}
                        disabled={subiendo}
                        className="hidden"
                        id="imageInput"
                      />
                      <label
                        htmlFor="imageInput"
                        className="mt-2 px-4 py-2 bg-pastel-pink text-white rounded-lg hover:bg-pastel-lavender disabled:opacity-50 cursor-pointer inline-block"
                      >
                        {subiendo ? '⏳ Subiendo...' : '📁 Seleccionar archivo'}
                      </label>
                    </div>
                  </div>

                  {/* Alternativa: URL manual */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-gray-600 text-sm mb-2">O pega una URL de imagen:</p>
                    <input
                      type="url"
                      value={formData.imagenUrl}
                      onChange={(e) => setFormData({ ...formData, imagenUrl: e.target.value })}
                      className="input-field"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="colaborativo"
                    checked={formData.permiteColaborativo}
                    onChange={(e) => setFormData({ ...formData, permiteColaborativo: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="colaborativo" className="text-gray-700">
                    Permitir aportes colaborativos
                  </label>
                </div>

                <div className="flex gap-3">
                  <button type="submit" className="btn-primary flex-1">
                    {regaloEditando ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
