/**
 * Página de configuración del evento
 */

import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { buildApiUrl } from '../../services/config';
import { comprimirImagen } from '../../utils/imagen';
import { Link } from 'react-router-dom';
import { Evento } from '../../types';

export default function AdminConfiguracion() {
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState<Partial<Evento>>({
    nombreGemela1: '',
    nombreGemela2: '',
    fecha: '',
    hora: '',
    lugar: '',
    lugarRecepcion: '',
    wazeUrlRecepcion: '',
    mensajeBienvenida: '',
    portadaUrl: '',
    portadaUrlMobile: '',
    wazeUrl: '',
    modoComision: 'A',
  });

  useEffect(() => {
    cargarEvento();
  }, []);

  const cargarEvento = async () => {
    try {
      const response = await api.getEvento();
      setFormData(response.data);
    } catch (error) {
      console.error('Error al cargar evento:', error);
    } finally {
      setLoading(false);
    }
  };

  const guardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje('');

    try {
      await adminApi.actualizarEvento(formData);
      setMensaje('¡Cambios guardados exitosamente!');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error al guardar:', error);
      setMensaje('Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  const subirImagen = async (file: File) => {
    try {
      setSubiendo(true);

      // Comprimir la portada con resolución Full HD y buena calidad.
      // 1920px es el estándar para pantallas 1080p. El base64 resultante
      // (~500KB-1MB) es manejable para PostgreSQL y la carga web.
      const base64 = await comprimirImagen(file, 1920, 0.85);

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
        setFormData({ ...formData, portadaUrl: data.imageUrl });
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

  const subirImagenMobile = async (file: File) => {
    try {
      setSubiendo(true);

      // Comprimir la imagen móvil (vertical) a buena resolución
      const base64 = await comprimirImagen(file, 1080, 0.85);

      const response = await fetch(buildApiUrl('/upload-image'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64 }),
      });

      const data = await response.json();
      if (data.success) {
        setFormData({ ...formData, portadaUrlMobile: data.imageUrl });
        console.log('✅ Imagen móvil subida');
      } else {
        alert('Error al subir imagen móvil: ' + data.error);
      }
    } catch (error: any) {
      console.error('Error al subir imagen móvil:', error);
      alert('Error al subir imagen móvil');
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
              ⚙️ Configuración del Evento
            </h1>
            <Link to="/admin/dashboard" className="text-pastel-pink hover:text-pastel-lavender">
              ← Volver al dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-card p-8">
          <form onSubmit={guardarCambios} className="space-y-6">
            {/* Nombres de las gemelas */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Nombre Gemela 1
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombreGemela1}
                  onChange={(e) => setFormData({ ...formData, nombreGemela1: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Nombre Gemela 2
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombreGemela2}
                  onChange={(e) => setFormData({ ...formData, nombreGemela2: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            {/* Fecha y hora */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Fecha del bautizo
                </label>
                <input
                  type="date"
                  required
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Hora
                </label>
                <input
                  type="time"
                  required
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            {/* Lugar */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Lugar
              </label>
              <input
                type="text"
                required
                value={formData.lugar}
                onChange={(e) => setFormData({ ...formData, lugar: e.target.value })}
                className="input-field"
                placeholder="Ej: Parroquia San Francisco, Santiago"
              />
            </div>

            {/* Lugar de la recepción (opcional) */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Lugar de la recepción (opcional)
              </label>
              <input
                type="text"
                value={formData.lugarRecepcion || ''}
                onChange={(e) => setFormData({ ...formData, lugarRecepcion: e.target.value })}
                className="input-field"
                placeholder="Ej: Centro de Evento Miriam Roman"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lugar donde se celebrará la recepción después de la ceremonia. Si lo dejas vacío, no se mostrará el aviso.
              </p>
            </div>

            {/* URL de Waze de la recepción (opcional) */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Enlace de Waze de la recepción (opcional)
              </label>
              <input
                type="url"
                value={formData.wazeUrlRecepcion || ''}
                onChange={(e) => setFormData({ ...formData, wazeUrlRecepcion: e.target.value })}
                className="input-field"
                placeholder="https://waze.com/ul?ll=-34.35,-71.01&navigate=yes"
              />
              <p className="text-xs text-gray-500 mt-1">
                Pega aquí el enlace de Waze al lugar de la recepción. Si lo dejas vacío, se buscará el nombre del campo anterior en Waze.
              </p>
            </div>

            {/* URL de Waze */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Enlace de Waze (opcional)
              </label>
              <input
                type="url"
                value={formData.wazeUrl || ''}
                onChange={(e) => setFormData({ ...formData, wazeUrl: e.target.value })}
                className="input-field"
                placeholder="https://waze.com/ul?ll=-33.45,-70.66&navigate=yes"
              />
              <p className="text-xs text-gray-500 mt-1">
                Pega aquí el enlace exacto de Waze a la ubicación del evento.
                Si lo dejas vacío, se usará el texto del campo "Lugar".
              </p>
            </div>

            {/* URL de portada */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Imagen de portada
              </label>

              {/* Vista previa de imagen */}
              {formData.portadaUrl && (
                <div className="mb-4 rounded-lg overflow-hidden border-2 border-pastel-pink">
                  <img 
                    src={formData.portadaUrl} 
                    alt="Preview portada" 
                    className="w-full h-48 object-cover"
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
                    id="portadaInput"
                  />
                  <label
                    htmlFor="portadaInput"
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
                  value={formData.portadaUrl || ''}
                  onChange={(e) => setFormData({ ...formData, portadaUrl: e.target.value })}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Imagen de portada para móvil */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Imagen de portada para móvil (opcional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Imagen vertical optimizada para pantallas de celular.
                Si no la configuras, se usará la imagen de portada principal.
              </p>

              {formData.portadaUrlMobile && (
                <div className="mb-4 rounded-lg overflow-hidden border-2 border-pastel-lavender">
                  <img
                    src={formData.portadaUrlMobile}
                    alt="Preview portada móvil"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && subirImagenMobile(e.target.files[0])}
                disabled={subiendo}
                className="hidden"
                id="portadaMobileInput"
              />
              <label
                htmlFor="portadaMobileInput"
                className="inline-block px-4 py-2 bg-pastel-lavender text-white rounded-lg hover:bg-pastel-pink disabled:opacity-50 cursor-pointer"
              >
                {subiendo ? '⏳ Subiendo...' : '📁 Subir imagen móvil'}
              </label>
            </div>

            {/* Mensaje de bienvenida */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Mensaje de bienvenida
              </label>
              <textarea
                required
                value={formData.mensajeBienvenida}
                onChange={(e) => setFormData({ ...formData, mensajeBienvenida: e.target.value })}
                className="input-field"
                rows={8}
                placeholder="Escribe un mensaje cálido para los invitados..."
              />
            </div>

            {/* Modo de comisión */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <label className="block text-gray-800 font-semibold mb-3">
                Modo de Comisión de Mercado Pago
              </label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value="A"
                    checked={formData.modoComision === 'A'}
                    onChange={(e) => setFormData({ ...formData, modoComision: e.target.value as 'A' | 'B' })}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-800">
                      Modo A: El invitado cubre la comisión
                    </div>
                    <div className="text-sm text-gray-600">
                      Recibes el 100% del valor del regalo. El invitado paga un poco más para cubrir la comisión de MP.
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value="B"
                    checked={formData.modoComision === 'B'}
                    onChange={(e) => setFormData({ ...formData, modoComision: e.target.value as 'A' | 'B' })}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-800">
                      Modo B: Tú asumes la comisión
                    </div>
                    <div className="text-sm text-gray-600">
                      El invitado paga el valor exacto del regalo, pero tú recibes el monto neto (descontada la comisión).
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Mensaje de éxito/error */}
            {mensaje && (
              <div className={`p-4 rounded-lg ${mensaje.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {mensaje}
              </div>
            )}

            {/* Botones */}
            <button
              type="submit"
              disabled={guardando}
              className="btn-primary w-full"
            >
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
