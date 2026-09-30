/**
 * Página admin: álbum de fotos del evento
 * Permite revisar, aprobar, rechazar, subir y eliminar fotos.
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { comprimirImagen } from '../../utils/imagen';
import { Foto, ResumenFotos } from '../../types';

type EstadoFoto = 'pendiente' | 'aprobada' | 'rechazada';
type Filtro = 'todas' | EstadoFoto;

const RESUMEN_VACIO: ResumenFotos = { total: 0, pendientes: 0, aprobadas: 0, rechazadas: 0 };

export default function AdminFotos() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [resumen, setResumen] = useState<ResumenFotos>(RESUMEN_VACIO);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [fotoAmpliada, setFotoAmpliada] = useState<Foto | null>(null);

  // Subida desde el panel (se aprueba automáticamente)
  const [autor, setAutor] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    cargarFotos();
  }, []);

  const cargarFotos = async () => {
    try {
      const response = await adminApi.getFotos();
      setFotos(response.data || []);
      setResumen({ ...RESUMEN_VACIO, ...(response.resumen || {}) });
    } catch (errorCarga) {
      console.error('Error al cargar fotos:', errorCarga);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (id: number, estado: EstadoFoto) => {
    setProcesandoId(id);
    try {
      const response = await adminApi.actualizarEstadoFoto(id, estado);
      if (response.success) {
        await cargarFotos();
      } else {
        alert(response.error || 'Error al actualizar la foto');
      }
    } catch (errorEstado) {
      console.error('Error al actualizar foto:', errorEstado);
      alert('Error al actualizar la foto');
    } finally {
      setProcesandoId(null);
    }
  };

  const eliminar = async (foto: Foto) => {
    const confirmacion = confirm(
      `⚠️ ¿Eliminar la foto de "${foto.autor || 'Invitado anónimo'}"?\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmacion) return;

    setProcesandoId(foto.id);
    try {
      const response = await adminApi.eliminarFoto(foto.id);
      if (response.success) {
        await cargarFotos();
      } else {
        alert(response.error || 'Error al eliminar la foto');
      }
    } catch (errorEliminar) {
      console.error('Error al eliminar foto:', errorEliminar);
      alert('Error al eliminar la foto');
    } finally {
      setProcesandoId(null);
    }
  };

  const subirFoto = async (archivo: File | null) => {
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      setError('El archivo seleccionado no es una imagen.');
      return;
    }

    setError('');
    setAviso('');
    setSubiendo(true);
    try {
      // Misma compresión que usa el sitio público para el álbum
      const base64 = await comprimirImagen(archivo, 1600, 0.8);
      const response = await adminApi.subirFotoAdmin({
        base64,
        autor: autor.trim() || undefined,
        mensaje: mensaje.trim() || undefined,
      });
      if (response.success) {
        setAviso('Foto subida y publicada en el álbum ✅');
        setMensaje('');
        await cargarFotos();
      } else {
        setError(response.error || 'Error al subir la foto');
      }
    } catch (errorSubida: any) {
      console.error('Error al subir foto:', errorSubida);
      setError(errorSubida?.message || 'Error al subir la foto');
    } finally {
      setSubiendo(false);
      if (inputArchivoRef.current) inputArchivoRef.current.value = '';
    }
  };

  const formatearFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const colorEstado = (estado?: string) =>
    estado === 'aprobada'
      ? 'badge-success'
      : estado === 'rechazada'
        ? 'badge bg-red-100 text-red-700'
        : 'badge-warning';

  const fotosFiltradas = fotos.filter((foto) =>
    filtro === 'todas' ? true : (foto.estado || 'pendiente') === filtro
  );

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
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-800">
                📸 Álbum de Fotos
              </h1>
              <p className="text-gray-600 text-sm">
                Revisa, aprueba y publica las fotos que comparten los invitados
              </p>
            </div>
            <Link to="/admin/dashboard" className="text-pastel-pink hover:text-pastel-lavender">
              ← Volver al dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Resumen (filtra la lista al hacer clic) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            type="button"
            onClick={() => setFiltro('todas')}
            className={`text-left bg-gradient-to-br from-gray-500 to-gray-700 text-white rounded-2xl shadow-card p-6 transition-transform hover:-translate-y-1 ${
              filtro === 'todas' ? 'ring-4 ring-pastel-pink/60' : ''
            }`}
          >
            <h3 className="text-sm font-medium opacity-90">Total</h3>
            <p className="text-3xl font-bold mt-1">{resumen.total}</p>
            <p className="text-xs opacity-90 mt-1">Todas las fotos</p>
          </button>

          <button
            type="button"
            onClick={() => setFiltro('pendiente')}
            className={`text-left bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-2xl shadow-card p-6 transition-transform hover:-translate-y-1 ${
              filtro === 'pendiente' ? 'ring-4 ring-pastel-pink/60' : ''
            }`}
          >
            <h3 className="text-sm font-medium opacity-90">Pendientes</h3>
            <p className="text-3xl font-bold mt-1">{resumen.pendientes}</p>
            <p className="text-xs opacity-90 mt-1">Por revisar</p>
          </button>

          <button
            type="button"
            onClick={() => setFiltro('aprobada')}
            className={`text-left bg-gradient-to-br from-green-400 to-green-600 text-white rounded-2xl shadow-card p-6 transition-transform hover:-translate-y-1 ${
              filtro === 'aprobada' ? 'ring-4 ring-pastel-pink/60' : ''
            }`}
          >
            <h3 className="text-sm font-medium opacity-90">Aprobadas</h3>
            <p className="text-3xl font-bold mt-1">{resumen.aprobadas}</p>
            <p className="text-xs opacity-90 mt-1">Visibles en la galería</p>
          </button>

          <button
            type="button"
            onClick={() => setFiltro('rechazada')}
            className={`text-left bg-gradient-to-br from-red-400 to-red-600 text-white rounded-2xl shadow-card p-6 transition-transform hover:-translate-y-1 ${
              filtro === 'rechazada' ? 'ring-4 ring-pastel-pink/60' : ''
            }`}
          >
            <h3 className="text-sm font-medium opacity-90">Rechazadas</h3>
            <p className="text-3xl font-bold mt-1">{resumen.rechazadas}</p>
            <p className="text-xs opacity-90 mt-1">Ocultas del álbum</p>
          </button>
        </div>


        {/* Subir foto desde el panel */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            📤 Subir una foto (se publica al instante)
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Ideal para las fotos oficiales del evento: se aprueban automáticamente.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="autor" className="block text-sm font-medium text-gray-700 mb-1.5">
                Autor
              </label>
              <input
                id="autor"
                type="text"
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                maxLength={80}
                placeholder="Ej: Administración"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700 mb-1.5">
                Mensaje (opcional)
              </label>
              <input
                id="mensaje"
                type="text"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                maxLength={280}
                placeholder="Ej: Foto oficial de la ceremonia"
                className="input-field"
              />
            </div>
          </div>
          <label
            htmlFor="archivo-admin"
            className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-2xl px-6 py-6 text-center transition-colors ${
              subiendo
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-pastel-pink/60 bg-pastel-pink/5 hover:bg-pastel-pink/10 cursor-pointer'
            }`}
          >
            <span className="text-sm font-semibold text-pastel-pink">
              {subiendo ? 'Subiendo foto...' : '🖼️ Elegir imagen del computador'}
            </span>
            <input
              id="archivo-admin"
              ref={inputArchivoRef}
              type="file"
              accept="image/*"
              disabled={subiendo}
              onChange={(e) => subirFoto(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
          {aviso && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{aviso}</div>
          )}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
        </div>


        {/* Lista de fotos */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {filtro === 'todas'
              ? `Todas las fotos (${fotos.length})`
              : `Fotos (${
                  fotosFiltradas.length
                } de ${fotos.length} · ${
                  filtro === 'aprobada'
                    ? 'aprobadas'
                    : filtro === 'rechazada'
                      ? 'rechazadas'
                      : 'pendientes'
                })`}
          </h2>
          {filtro !== 'todas' && (
            <button
              type="button"
              onClick={() => setFiltro('todas')}
              className="text-sm font-semibold text-pastel-pink hover:text-pastel-lavender"
            >
              Ver todas las fotos
            </button>
          )}
        </div>

        {fotosFiltradas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft p-10 text-center text-gray-500">
            {fotos.length === 0
              ? 'Todavía no hay fotos en el álbum. Los invitados pueden subirlas desde /fotos.'
              : 'No hay fotos con este estado.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {fotosFiltradas.map((foto) => (
              <div key={foto.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFotoAmpliada(foto)}
                  className="block w-full"
                  title="Ver en grande"
                >
                  <img
                    src={foto.url}
                    alt={foto.mensaje || `Foto de ${foto.autor || 'invitado'}`}
                    loading="lazy"
                    className="w-full aspect-square object-cover"
                  />
                </button>

                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-semibold text-gray-800 truncate">
                      {foto.autor || 'Invitado anónimo'}
                    </span>
                    <span className={colorEstado(foto.estado)}>
                      {foto.estado || 'pendiente'}
                    </span>
                  </div>
                  {foto.mensaje && (
                    <p className="text-sm text-gray-600 mb-2 break-words">{foto.mensaje}</p>
                  )}
                  <p className="text-xs text-gray-400 mb-3">
                    {formatearFecha(foto.createdAt)}
                    <span
                      className="ml-2 text-[10px] font-medium uppercase tracking-wide text-gray-400"
                      title={
                        foto.storage === 'r2'
                          ? 'Guardada en Cloudflare R2 (bucket)'
                          : 'Guardada en la base de datos como base64 (R2 no configurado al subirla)'
                      }
                    >
                      {foto.storage === 'r2' ? '· R2' : '· BD'}
                    </span>
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {foto.estado !== 'aprobada' && (
                      <button
                        type="button"
                        onClick={() => cambiarEstado(foto.id, 'aprobada')}
                        disabled={procesandoId === foto.id}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        ✓ Aprobar
                      </button>
                    )}
                    {foto.estado !== 'rechazada' && (
                      <button
                        type="button"
                        onClick={() => cambiarEstado(foto.id, 'rechazada')}
                        disabled={procesandoId === foto.id}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                      >
                        ✕ Rechazar
                      </button>
                    )}
                    {foto.estado !== 'pendiente' && (
                      <button
                        type="button"
                        onClick={() => cambiarEstado(foto.id, 'pendiente')}
                        disabled={procesandoId === foto.id}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-50"
                      >
                        ↺ Dejar pendiente
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => eliminar(foto)}
                      disabled={procesandoId === foto.id}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}


        {/* Lightbox */}
        {fotoAmpliada && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setFotoAmpliada(null)}
          >
            <div
              className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={fotoAmpliada.url}
                alt={fotoAmpliada.mensaje || 'Foto del álbum'}
                className="w-full max-h-[70vh] object-contain bg-gray-900"
              />
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-800">
                    {fotoAmpliada.autor || 'Invitado anónimo'}
                  </p>
                  <span className={colorEstado(fotoAmpliada.estado)}>
                    {fotoAmpliada.estado || 'pendiente'}
                  </span>
                </div>
                {fotoAmpliada.mensaje && (
                  <p className="text-gray-600 text-sm mt-1">{fotoAmpliada.mensaje}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">
                    {formatearFecha(fotoAmpliada.createdAt)}
                    <span
                      className="ml-2 text-[10px] font-medium uppercase tracking-wide"
                      title={
                        fotoAmpliada.storage === 'r2'
                          ? 'Guardada en Cloudflare R2 (bucket)'
                          : 'Guardada en la base de datos como base64 (R2 no configurado al subirla)'
                      }
                    >
                      {fotoAmpliada.storage === 'r2' ? '· R2' : '· BD'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFotoAmpliada(null)}
                    className="text-sm font-semibold text-pastel-pink hover:text-pastel-lavender"
                  >
                    Cerrar ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

