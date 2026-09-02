/**
 * Página de gestión de regalos (CRUD)
 */

import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { buildApiUrl } from '../../services/config';
import { comprimirImagen } from '../../utils/imagen';
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

  // Estados para carga masiva
  const [modalMasivoAbierto, setModalMasivoAbierto] = useState(false);
  const [modoCarga, setModoCarga] = useState<'json' | 'formulario'>('json');
  const [jsonText, setJsonText] = useState('');
  const [cargandoMasivo, setCargandoMasivo] = useState(false);
  const [filasMasivo, setFilasMasivo] = useState<Array<{
    nombre: string;
    descripcion: string;
    precioCLP: number;
    imagenUrl: string;
    imagenBase64: string;
    permiteColaborativo: boolean;
  }>>([{ nombre: '', descripcion: '', precioCLP: 0, imagenUrl: '', imagenBase64: '', permiteColaborativo: false }]);

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

      // Comprimir y redimensionar la imagen antes de subirla
      const base64 = await comprimirImagen(file);

      // Enviar al backend
      const response = await fetch(buildApiUrl('/upload-image'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64 }),
      });

      const data = await response.json();
      if (data.success) {
        setFormData({ ...formData, imagenUrl: data.imageUrl });
        console.log('✅ Imagen subida');
      } else {
        alert('Error al subir imagen: ' + data.error);
      }
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

  // ---------- Funciones de carga masiva ----------

  const procesarJsonMasivo = async () => {
    setCargandoMasivo(true);
    try {
      const regalos = JSON.parse(jsonText);
      if (!Array.isArray(regalos)) throw new Error('El JSON debe ser un array');

      const response = await adminApi.crearRegalosMasivo(regalos);
      if (response.success) {
        const { creados, errores } = response.data;
        if (errores.length > 0) {
          console.error('Errores en carga masiva:', errores);
          alert(`✅ ${creados} regalos creados.\n⚠️ ${errores.length} con error (ver consola).`);
        } else {
          alert(`✅ ${creados} regalos creados exitosamente.`);
        }
        await cargarRegalos();
        setModalMasivoAbierto(false);
        setJsonText('');
      } else {
        alert(response.error || 'Error en carga masiva');
      }
    } catch (e: any) {
      alert('JSON inválido: ' + (e.message || 'Error al parsear'));
    } finally {
      setCargandoMasivo(false);
    }
  };

  const agregarFilaMasivo = () => {
    setFilasMasivo([
      ...filasMasivo,
      { nombre: '', descripcion: '', precioCLP: 0, imagenUrl: '', imagenBase64: '', permiteColaborativo: false },
    ]);
  };

  const eliminarFilaMasivo = (index: number) => {
    if (filasMasivo.length === 1) return;
    setFilasMasivo(filasMasivo.filter((_, i) => i !== index));
  };

  const actualizarFilaMasivo = (index: number, campo: string, valor: any) => {
    const nuevas = [...filasMasivo];
    nuevas[index] = { ...nuevas[index], [campo]: valor };
    setFilasMasivo(nuevas);
  };

  const subirImagenFila = async (index: number, file: File) => {
    const base64 = await comprimirImagen(file);
    actualizarFilaMasivo(index, 'imagenBase64', base64);
  };

  const procesarFormularioMasivo = async () => {
    setCargandoMasivo(true);
    try {
      const regalosValidos = filasMasivo.filter(
        (f) => f.nombre.trim() && f.descripcion.trim() && f.precioCLP > 0 && (f.imagenUrl || f.imagenBase64)
      );

      if (regalosValidos.length === 0) {
        alert('Agrega al menos un regalo completo (nombre, descripción, precio e imagen)');
        return;
      }

      const response = await adminApi.crearRegalosMasivo(regalosValidos);
      if (response.success) {
        const { creados, errores } = response.data;
        if (errores.length > 0) {
          console.error('Errores en carga masiva:', errores);
          alert(`✅ ${creados} regalos creados.\n⚠️ ${errores.length} con error (ver consola).`);
        } else {
          alert(`✅ ${creados} regalos creados exitosamente.`);
        }
        await cargarRegalos();
        setModalMasivoAbierto(false);
        setFilasMasivo([{ nombre: '', descripcion: '', precioCLP: 0, imagenUrl: '', imagenBase64: '', permiteColaborativo: false }]);
      } else {
        alert(response.error || 'Error en carga masiva');
      }
    } catch (error) {
      console.error('Error en carga masiva:', error);
      alert('Error al procesar la carga masiva');
    } finally {
      setCargandoMasivo(false);
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
        <div className="mb-6 flex gap-3 flex-wrap">
          <button onClick={() => abrirModal()} className="btn-primary">
            ➕ Agregar Nuevo Regalo
          </button>
          <button onClick={() => setModalMasivoAbierto(true)} className="btn-secondary">
            📦 Carga Masiva
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

      {/* Modal de carga masiva */}
      {modalMasivoAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-card w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-gray-800">
                📦 Carga Masiva de Regalos
              </h2>
              <button
                onClick={() => setModalMasivoAbierto(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setModoCarga('json')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    modoCarga === 'json' ? 'bg-pastel-pink text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  📋 Pegar JSON
                </button>
                <button
                  onClick={() => setModoCarga('formulario')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    modoCarga === 'formulario' ? 'bg-pastel-pink text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  ✍️ Formulario múltiple
                </button>
              </div>

              {modoCarga === 'json' ? (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Pega un array JSON de regalos. Cada regalo puede tener <code className="bg-gray-100 px-1 rounded">imagenUrl</code> (URL externa) o <code className="bg-gray-100 px-1 rounded">imagenBase64</code> (data URL).
                  </p>
                  <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    className="input-field w-full font-mono text-sm h-64"
                    placeholder={`[\n  {\n    "nombre": "Coche para bebé",\n    "descripcion": "Coche ligero y plegable",\n    "precioCLP": 120000,\n    "imagenUrl": "https://ejemplo.com/foto.jpg",\n    "permiteColaborativo": false\n  }\n]`}
                  />
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={procesarJsonMasivo}
                      disabled={cargandoMasivo}
                      className="btn-primary flex-1"
                    >
                      {cargandoMasivo ? '⏳ Procesando...' : '📦 Cargar regalos'}
                    </button>
                    <button
                      onClick={() => setModalMasivoAbierto(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Completa los campos de cada regalo. Para la imagen puedes subir un archivo o pegar una URL.
                  </p>

                  <div className="space-y-4">
                    {filasMasivo.map((fila, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-medium text-gray-700 text-sm">
                            Regalo #{index + 1}
                          </span>
                          {filasMasivo.length > 1 && (
                            <button
                              onClick={() => eliminarFilaMasivo(index)}
                              className="text-red-500 text-sm hover:text-red-700"
                            >
                              ✕ Eliminar
                            </button>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Nombre *</label>
                            <input
                              type="text"
                              value={fila.nombre}
                              onChange={(e) => actualizarFilaMasivo(index, 'nombre', e.target.value)}
                              className="input-field"
                              placeholder="Ej: Coche para bebé"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Precio (CLP) *</label>
                            <input
                              type="number"
                              value={fila.precioCLP}
                              onChange={(e) => actualizarFilaMasivo(index, 'precioCLP', Number(e.target.value))}
                              className="input-field"
                              placeholder="120000"
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="block text-xs text-gray-600 mb-1">Descripción *</label>
                          <input
                            type="text"
                            value={fila.descripcion}
                            onChange={(e) => actualizarFilaMasivo(index, 'descripcion', e.target.value)}
                            className="input-field"
                            placeholder="Coche ligero y plegable"
                          />
                        </div>

                        <div className="mt-3">
                          <label className="block text-xs text-gray-600 mb-1">Imagen</label>
                          <div className="flex items-center gap-3">
                            {fila.imagenBase64 || fila.imagenUrl ? (
                              <img
                                src={fila.imagenBase64 || fila.imagenUrl}
                                alt="preview"
                                className="w-16 h-16 object-cover rounded-lg border"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-400 text-2xl">
                                📸
                              </div>
                            )}
                            <div className="flex-1 space-y-2">
                              <label className="inline-block px-3 py-1.5 bg-gray-100 rounded-lg text-sm cursor-pointer hover:bg-gray-200">
                                📁 Subir imagen
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => e.target.files?.[0] && subirImagenFila(index, e.target.files[0])}
                                />
                              </label>
                              <input
                                type="url"
                                value={fila.imagenUrl}
                                onChange={(e) => actualizarFilaMasivo(index, 'imagenUrl', e.target.value)}
                                className="input-field"
                                placeholder="... o pega URL de imagen"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`colaborativo-masivo-${index}`}
                            checked={fila.permiteColaborativo}
                            onChange={(e) => actualizarFilaMasivo(index, 'permiteColaborativo', e.target.checked)}
                            className="w-4 h-4"
                          />
                          <label htmlFor={`colaborativo-masivo-${index}`} className="text-sm text-gray-700">
                            Permitir aportes colaborativos
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={agregarFilaMasivo}
                      className="btn-secondary flex-1"
                    >
                      ➕ Agregar otro regalo
                    </button>
                    <button
                      onClick={procesarFormularioMasivo}
                      disabled={cargandoMasivo}
                      className="btn-primary flex-1"
                    >
                      {cargandoMasivo ? '⏳ Procesando...' : '📦 Cargar todos'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
