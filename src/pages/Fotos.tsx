/**
 * Página pública del álbum de fotos del evento.
 *
 * - Los invitados pueden subir fotos (quedan pendientes de aprobación de los papás).
 * - La galería solo muestra las fotos aprobadas.
 *
 * Si llega desde un enlace de invitación (?familia=&token=) se precargan el
 * nombre del autor y el token, para poder vincular la foto a la invitación.
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Evento, Foto } from '../types';
import { api } from '../services/api';
import { comprimirImagen } from '../utils/imagen';

// Máximo de archivos que se pueden seleccionar de una vez (se suben uno a uno)
const MAX_ARCHIVOS = 10;

export default function Fotos() {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);

  const [autor, setAutor] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [invitacionToken, setInvitacionToken] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState<{ actual: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [fotoAmpliada, setFotoAmpliada] = useState<Foto | null>(null);
  const inputArchivosRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Precargar datos desde el enlace de invitación (?familia=&token=)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const familiaParam = params.get('familia');
    if (familiaParam) setAutor(familiaParam);
    const tokenParam = params.get('token');
    if (tokenParam) setInvitacionToken(tokenParam);
  }, []);

  const cargarDatos = async () => {
    try {
      // Se cargan por separado para que un fallo en el evento no deje sin galería
      const [eventoRes, fotosRes] = await Promise.allSettled([api.getEvento(), api.getFotos()]);

      if (eventoRes.status === 'fulfilled') {
        setEvento(eventoRes.value.data);
      } else {
        console.warn('No se pudo cargar el evento:', eventoRes.reason);
      }

      if (fotosRes.status === 'fulfilled') {
        setFotos(fotosRes.value.data || []);
      } else {
        console.error('Error al cargar el álbum de fotos:', fotosRes.reason);
        setError('No pudimos cargar el álbum de fotos. Intenta nuevamente en unos minutos.');
      }
    } catch (errorCarga) {
      console.error('Error al cargar el álbum de fotos:', errorCarga);
      setError('No pudimos cargar el álbum de fotos. Intenta nuevamente en unos minutos.');
    } finally {
      setLoading(false);
    }
  };

  const recargarFotos = async () => {
    try {
      const fotosRes = await api.getFotos();
      setFotos(fotosRes.data || []);
    } catch (errorCarga) {
      console.error('Error al recargar fotos:', errorCarga);
    }
  };

  const subirFotos = async (archivos: FileList | null) => {
    if (!archivos || archivos.length === 0) return;

    const lista = Array.from(archivos);
    if (lista.length > MAX_ARCHIVOS) {
      setError(`Puedes subir hasta ${MAX_ARCHIVOS} fotos a la vez.`);
      return;
    }

    // Validar que todos los archivos sean imágenes
    const noImagen = lista.find((archivo) => !archivo.type.startsWith('image/'));
    if (noImagen) {
      setError(`El archivo "${noImagen.name}" no es una imagen.`);
      return;
    }

    setError('');
    setAviso('');
    setSubiendo(true);

    let subidas = 0;
    const errores: string[] = [];

    for (let i = 0; i < lista.length; i += 1) {
      setProgreso({ actual: i + 1, total: lista.length });
      try {
        // Comprimir en el navegador para no enviar archivos gigantes
        const base64 = await comprimirImagen(lista[i], 1600, 0.8);
        await api.subirFoto({
          base64,
          autor: autor.trim() || undefined,
          mensaje: mensaje.trim() || undefined,
          invitacionToken: invitacionToken || undefined,
        });
        subidas += 1;
      } catch (errorSubida: any) {
        console.error('Error al subir foto:', errorSubida);
        errores.push(`${lista[i].name}: ${errorSubida?.message || 'error desconocido'}`);
      }
    }

    setProgreso(null);
    setSubiendo(false);
    if (inputArchivosRef.current) inputArchivosRef.current.value = '';

    if (subidas > 0) {
      setAviso(
        subidas === 1
          ? '¡Gracias por compartir tu foto! Se publicará cuando los papás la revisen 💕'
          : `¡Gracias! Recibimos ${subidas} fotos. Se publicarán cuando los papás las revisen 💕`
      );
      setMensaje('');
      await recargarFotos();
    }
    if (errores.length > 0) {
      setError(`No pudimos subir ${errores.length} foto(s): ${errores.join(' · ')}`);
    }
  };

  const formatearFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pastel-pink mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando el álbum de fotos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray py-12">
      <div className="container mx-auto px-4">
        {/* Volver al inicio */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-pastel-pink font-medium transition-colors"
          >
            <span className="text-lg leading-none" aria-hidden>
              ←
            </span>
            Volver al inicio
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-800 mb-4 section-decoration">
            Álbum de Fotos
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {evento
              ? `Comparte las fotos que tomes del bautizo de ${evento.nombreMelliza1} y ${evento.nombreMelliza2}.`
              : 'Comparte las fotos que tomes del bautizo.'}{' '}
            Todas las fotos pasan por una revisión de los papás antes de publicarse 📸
          </p>
        </div>

        {/* Formulario de subida */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-card p-6 md:p-8 mb-12">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-1">
            📤 Subir mis fotos
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Puedes seleccionar hasta {MAX_ARCHIVOS} fotos a la vez. Se optimizan automáticamente
            antes de enviarlas.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="autor" className="block text-sm font-medium text-gray-700 mb-1.5">
                Tu nombre (opcional)
              </label>
              <input
                id="autor"
                type="text"
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                maxLength={80}
                placeholder="Ej: Familia Pérez"
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
                placeholder="Ej: ¡Qué ceremonia tan linda! 💕"
                className="input-field"
              />
            </div>
          </div>

          <label
            htmlFor="archivos"
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl px-6 py-8 text-center transition-colors ${
              subiendo
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-pastel-pink/60 bg-pastel-pink/5 hover:bg-pastel-pink/10 cursor-pointer'
            }`}
          >
            <span className="text-3xl" aria-hidden>
              🖼️
            </span>
            <span className="text-sm font-semibold text-pastel-pink">
              {subiendo ? 'Subiendo fotos...' : 'Toca aquí para elegir tus fotos (JPG, PNG, WEBP)'}
            </span>
            <span className="text-xs text-gray-500">Máximo 8 MB por foto</span>
            <input
              id="archivos"
              ref={inputArchivosRef}
              type="file"
              accept="image/*"
              multiple
              disabled={subiendo}
              onChange={(e) => subirFotos(e.target.files)}
              className="hidden"
            />
          </label>

          {progreso && (
            <div className="mt-4 text-sm text-gray-600 text-center">
              Subiendo foto {progreso.actual} de {progreso.total}...
            </div>
          )}

          {aviso && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{aviso}</div>
          )}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}

          <p className="text-xs text-gray-400 mt-4 text-center">
            💡 Por seguridad, se aceptan hasta 40 fotos cada 10 minutos.
          </p>
        </div>

        {/* Galería de fotos aprobadas */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-800 text-center section-decoration">
            Galería
          </h2>
          <p className="text-center text-gray-600 mt-3">
            {fotos.length === 0
              ? 'Todavía no hay fotos publicadas. ¡Sé el primero en compartir la tuya!'
              : `${fotos.length} foto${fotos.length !== 1 ? 's' : ''} en el álbum`}
          </p>
        </div>

        {fotos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-16">
            {fotos.map((foto) => (
              <button
                key={foto.id}
                type="button"
                onClick={() => setFotoAmpliada(foto)}
                className="group bg-white rounded-2xl shadow-soft overflow-hidden text-left hover:shadow-card hover:-translate-y-1 transition-all duration-300"
              >
                <img
                  src={foto.url}
                  alt={foto.mensaje || `Foto de ${foto.autor || 'invitado'}`}
                  loading="lazy"
                  className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-gray-700 truncate">
                    {foto.autor || 'Invitado anónimo'}
                  </p>
                  <p className="text-xs text-gray-400">{formatearFecha(foto.createdAt)}</p>
                </div>
              </button>
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
                <p className="font-semibold text-gray-800">
                  {fotoAmpliada.autor || 'Invitado anónimo'}
                </p>
                {fotoAmpliada.mensaje && (
                  <p className="text-gray-600 text-sm mt-1">{fotoAmpliada.mensaje}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">
                    {formatearFecha(fotoAmpliada.createdAt)}
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

