/**
 * Página pública del álbum de fotos del evento.
 *
 * - El invitado elige sus fotos, las ve en una vista previa y las envía con el
 *   botón "Enviar": no se sube nada al elegir archivos, así puede corregir la
 *   selección antes de confirmar.
 * - Todo lo enviado queda pendiente: los papás lo revisan y solo entonces aparece
 *   en la galería (por eso la galería muestra únicamente las fotos aprobadas).
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

/** Foto elegida por el invitado que todavía no se ha enviado */
interface FotoElegida {
  id: string;
  archivo: File;
  previewUrl: string;
}

export default function Fotos() {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [recargando, setRecargando] = useState(false);

  const [autor, setAutor] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [invitacionToken, setInvitacionToken] = useState('');
  const [elegidas, setElegidas] = useState<FotoElegida[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState<{ enviadas: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [errorGaleria, setErrorGaleria] = useState('');
  const [aviso, setAviso] = useState('');
  const [indiceAmpliado, setIndiceAmpliado] = useState<number | null>(null);

  const inputArchivosRef = useRef<HTMLInputElement>(null);
  const seccionSubidaRef = useRef<HTMLDivElement>(null);
  const elegidasRef = useRef<FotoElegida[]>([]);

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

  // Las vistas previas viven en memoria del navegador: hay que liberarlas
  useEffect(() => {
    elegidasRef.current = elegidas;
  }, [elegidas]);

  useEffect(() => {
    return () => {
      elegidasRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
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
        setErrorGaleria('No pudimos cargar el álbum de fotos. Intenta nuevamente en unos minutos.');
      }
    } catch (errorCarga) {
      console.error('Error al cargar el álbum de fotos:', errorCarga);
      setErrorGaleria('No pudimos cargar el álbum de fotos. Intenta nuevamente en unos minutos.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Vuelve a pedir las fotos aprobadas (sirve para ver si ya publicaron las tuyas).
   *
   * @param conIndicador Muestra el estado "Actualizando..." del botón de la galería
   */
  const recargarFotos = async (conIndicador = false) => {
    if (conIndicador) setRecargando(true);
    try {
      const fotosRes = await api.getFotos();
      setFotos(fotosRes.data || []);
      setErrorGaleria('');
    } catch (errorCarga) {
      console.error('Error al recargar fotos:', errorCarga);
      if (conIndicador) {
        setErrorGaleria('No pudimos actualizar la galería. Intenta de nuevo en un momento.');
      }
    } finally {
      if (conIndicador) setRecargando(false);
    }
  };

  /** Agrega archivos elegidos a la lista de espera (con su vista previa) */
  const agregarArchivos = (archivos: FileList | null) => {
    if (!archivos || archivos.length === 0) return;

    setError('');
    setAviso('');

    const seleccionados = Array.from(archivos);
    const imagenes = seleccionados.filter((archivo) => archivo.type.startsWith('image/'));
    const noImagenes = seleccionados.length - imagenes.length;
    const espacioLibre = Math.max(MAX_ARCHIVOS - elegidas.length, 0);
    const aceptadas = imagenes.slice(0, espacioLibre);

    if (aceptadas.length > 0) {
      const nuevas: FotoElegida[] = aceptadas.map((archivo, indice) => ({
        id: `${Date.now()}-${indice}-${archivo.name}`,
        archivo,
        previewUrl: URL.createObjectURL(archivo),
      }));
      setElegidas((previas) => [...previas, ...nuevas]);
    }

    const problemas: string[] = [];
    if (noImagenes > 0) {
      problemas.push(`ignoramos ${noImagenes} archivo(s) que no eran imágenes`);
    }
    if (imagenes.length > espacioLibre) {
      problemas.push(`solo puedes enviar ${MAX_ARCHIVOS} fotos a la vez`);
    }
    if (problemas.length > 0) {
      setError(`Atención: ${problemas.join(' y ')}.`);
    }
  };

  /** Saca una foto de la lista de espera y libera su vista previa */
  const quitarFoto = (id: string) => {
    const objetivo = elegidas.find((item) => item.id === id);
    setElegidas((previas) => previas.filter((item) => item.id !== id));
    if (objetivo) URL.revokeObjectURL(objetivo.previewUrl);
  };

  /** Vacía la lista de espera por completo */
  const quitarTodas = () => {
    setElegidas([]);
    elegidas.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  };

  /** Sube al servidor todas las fotos elegidas (la galería las mostrará al aprobarse) */
  const enviarFotos = async () => {
    if (elegidas.length === 0 || subiendo) return;

    setError('');
    setAviso('');
    setSubiendo(true);

    const total = elegidas.length;
    const enviadasIds: string[] = [];
    const errores: string[] = [];
    setProgreso({ enviadas: 0, total });

    for (let i = 0; i < elegidas.length; i += 1) {
      const elegida = elegidas[i];
      setProgreso({ enviadas: i, total });

      try {
        // Comprimir en el navegador para no enviar archivos gigantes
        const base64 = await comprimirImagen(elegida.archivo, 1600, 0.8);
        await api.subirFoto({
          base64,
          autor: autor.trim() || undefined,
          mensaje: mensaje.trim() || undefined,
          invitacionToken: invitacionToken || undefined,
        });
        enviadasIds.push(elegida.id);
      } catch (errorSubida: any) {
        console.error('Error al subir foto:', errorSubida);
        errores.push(`${elegida.archivo.name}: ${errorSubida?.message || 'error desconocido'}`);
      }
    }

    setProgreso({ enviadas: total, total });
    setSubiendo(false);
    if (inputArchivosRef.current) inputArchivosRef.current.value = '';

    // Las que se enviaron salen de la lista; las que fallaron quedan para reintentar
    if (enviadasIds.length > 0) {
      setElegidas((previas) => previas.filter((item) => !enviadasIds.includes(item.id)));
      elegidas
        .filter((item) => enviadasIds.includes(item.id))
        .forEach((item) => URL.revokeObjectURL(item.previewUrl));
    }

    if (enviadasIds.length > 0) {
      const cuantas = enviadasIds.length;
      setAviso(
        cuantas === 1
          ? '¡Gracias por compartir tu foto! Ya quedó en revisión: aparecerá en la galería en cuanto los papás la aprueben 💕'
          : `¡Gracias! Recibimos tus ${cuantas} fotos. Quedaron en revisión y aparecerán en la galería a medida que los papás las aprueben 💕`
      );
      setMensaje('');
      // Puede que mientras subías, los papás hayan aprobado otras fotos
      await recargarFotos();
    }

    if (errores.length > 0) {
      setError(
        `No pudimos subir ${errores.length} foto(s); las dejamos en la lista para que lo intentes otra vez · ${errores.join(' · ')}`
      );
    }

    setProgreso(null);
  };

  /** Navegación del carrusel de fotos ampliadas (circular) */
  const mostrarAnterior = () =>
    setIndiceAmpliado((actual) =>
      actual === null ? null : (actual - 1 + fotos.length) % fotos.length
    );

  const mostrarSiguiente = () =>
    setIndiceAmpliado((actual) => (actual === null ? null : (actual + 1) % fotos.length));

  // Teclado (← → Esc) mientras hay una foto ampliada
  useEffect(() => {
    if (indiceAmpliado === null) return;

    const alPulsarTecla = (eventoTecla: KeyboardEvent) => {
      if (eventoTecla.key === 'Escape') setIndiceAmpliado(null);
      if (eventoTecla.key === 'ArrowLeft') mostrarAnterior();
      if (eventoTecla.key === 'ArrowRight') mostrarSiguiente();
    };

    window.addEventListener('keydown', alPulsarTecla);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', alPulsarTecla);
      document.body.style.overflow = '';
    };
  }, [indiceAmpliado, fotos.length]);

  const formatearFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const porcentaje = progreso ? Math.round((progreso.enviadas / progreso.total) * 100) : 0;
  const fotoAmpliada = indiceAmpliado !== null ? fotos[indiceAmpliado] : null;
  const quedanPorElegir = MAX_ARCHIVOS - elegidas.length;
  const nombreEvento = evento
    ? `bautizo de ${evento.nombreMelliza1} y ${evento.nombreMelliza2}`
    : 'bautizo';

  const bajarASubida = () =>
    seccionSubidaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
            Comparte las fotos que tomes del {nombreEvento}. Todas pasan por una revisión
            de los papás antes de publicarse, así el álbum queda lleno de lindos recuerdos 📸
          </p>
        </div>

        {/* 1. Subir fotos */}
        <div
          ref={seccionSubidaRef}
          className="max-w-3xl mx-auto bg-white rounded-3xl shadow-card p-6 md:p-8 scroll-mt-8"
        >
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-1">
            📤 Sube tus fotos
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Elige hasta {MAX_ARCHIVOS} fotos, revísalas y pulsa{' '}
            <strong className="font-semibold text-gray-600">Enviar</strong>. Se optimizan
            automáticamente en tu teléfono antes de salir.
          </p>

          {/* Aviso de revisión: lo primero que debe entender el invitado */}
          <div className="rounded-2xl bg-pastel-peach/20 border border-pastel-peach/60 p-4 mb-6">
            <p className="text-sm font-semibold text-gray-800 flex items-start gap-2">
              <span aria-hidden>⏳</span>
              Tus fotos pasan por revisión antes de publicarse
            </p>
            <p className="text-sm text-gray-600 mt-1.5">
              Las recibimos al instante, pero no se publican solas: los papás las revisan y
              aparecerán en la galería{' '}
              <strong className="font-semibold">cuando las aprueben</strong>. Suele ser rápido,
              ¡gracias por la paciencia! 💕
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3 text-xs text-gray-500">
              <span className="font-semibold text-gray-600">1. Tú las envías</span>
              <span aria-hidden>→</span>
              <span className="font-semibold text-gray-600">2. Los papás las aprueban</span>
              <span aria-hidden>→</span>
              <span className="font-semibold text-gray-600">3. Aparecen en la galería</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
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

          {/* Selector de archivos: solo agrega a la lista, se envía con el botón */}
          <label
            htmlFor="archivos"
            className={`mt-4 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-2xl px-6 py-7 text-center transition-colors ${
              subiendo || quedanPorElegir <= 0
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-pastel-pink/60 bg-pastel-pink/5 hover:bg-pastel-pink/10 cursor-pointer'
            }`}
          >
            <span className="text-3xl" aria-hidden>
              🖼️
            </span>
            <span className="text-sm font-semibold text-pastel-pink">
              {quedanPorElegir <= 0
                ? `Ya tienes ${MAX_ARCHIVOS} fotos listas para enviar`
                : elegidas.length === 0
                  ? 'Toca aquí para elegir tus fotos'
                  : `Añadir más fotos (puedes elegir ${quedanPorElegir} más)`}
            </span>
            <span className="text-xs text-gray-500">JPG, PNG, WEBP o GIF · se optimizan solas</span>
            <span className="text-xs text-gray-400">
              ¿Fotos de iPhone? Si salen en formato HEIC, actívalas en Ajustes → Cámara → Formatos →
              «Más compatible»
            </span>
            <input
              id="archivos"
              ref={inputArchivosRef}
              type="file"
              accept="image/*"
              multiple
              disabled={subiendo || quedanPorElegir <= 0}
              onChange={(e) => {
                const archivos = e.target.files;
                agregarArchivos(archivos);
                // Permite volver a elegir el mismo archivo si lo quitas de la lista
                e.target.value = '';
              }}
              className="hidden"
            />
          </label>

          {/* Vista previa de lo elegido (todavía sin enviar) */}
          {elegidas.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-sm font-semibold text-gray-700">
                  Listas para enviar ({elegidas.length}/{MAX_ARCHIVOS})
                </p>
                <button
                  type="button"
                  onClick={quitarTodas}
                  disabled={subiendo}
                  className="text-xs font-semibold text-gray-500 hover:text-pastel-pink disabled:opacity-50"
                >
                  Quitar todas
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {elegidas.map((item) => (
                  <div key={item.id} className="relative rounded-xl overflow-hidden bg-soft-gray">
                    <img
                      src={item.previewUrl}
                      alt={item.archivo.name}
                      className="w-full aspect-square object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => quitarFoto(item.id)}
                      disabled={subiendo}
                      aria-label={`Quitar ${item.archivo.name}`}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white text-xs font-bold flex items-center justify-center hover:bg-black/80 disabled:opacity-50"
                    >
                      ✕
                    </button>
                    <span className="absolute inset-x-0 bottom-0 bg-black/45 text-white text-[10px] px-1.5 py-1 truncate">
                      {(item.archivo.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón de envío: nada se sube hasta pulsarlo */}
          <button
            type="button"
            onClick={enviarFotos}
            disabled={elegidas.length === 0 || subiendo}
            className="btn-primary w-full mt-5 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
          >
            {subiendo
              ? 'Enviando fotos...'
              : elegidas.length === 0
                ? '✨ Elige tus fotos para enviarlas'
                : `📨 Enviar ${elegidas.length} foto${elegidas.length === 1 ? '' : 's'}`}
          </button>

          {/* Progreso del envío */}
          {progreso && (
            <div className="mt-5" aria-live="polite">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1.5">
                <span>
                  {progreso.enviadas < progreso.total
                    ? `Enviando foto ${progreso.enviadas + 1} de ${progreso.total}...`
                    : 'Terminando el envío...'}
                </span>
                <span className="font-semibold text-gray-500">{porcentaje}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pastel-pink to-pastel-lavender transition-all duration-300"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </div>
          )}

          {aviso && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm" aria-live="polite">
              {aviso}
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" aria-live="polite">
              {error}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4 text-center">
            💡 Por seguridad, se aceptan hasta 40 fotos cada 10 minutos.
          </p>
        </div>

        {/* Separador: subir fotos y galería son dos momentos distintos */}
        <div className="flex items-center gap-4 my-12" aria-hidden>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-pastel-lavender/70 to-transparent" />
          <span className="text-xl">💕</span>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-pastel-lavender/70 to-transparent" />
        </div>

        {/* 2. Galería: solo las fotos ya aprobadas */}
        <section className="bg-white/75 rounded-3xl shadow-soft p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-800">
                🖼️ Galería de recuerdos
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {fotos.length === 0
                  ? 'Aquí aparecerán las fotos en cuanto los papás las aprueben.'
                  : `${fotos.length} foto${fotos.length === 1 ? '' : 's'} aprobada${fotos.length === 1 ? '' : 's'} por los papás · toca una para verla en grande`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => recargarFotos(true)}
              disabled={recargando}
              className="self-start sm:self-auto shrink-0 text-sm font-semibold text-pastel-pink hover:text-pastel-lavender disabled:opacity-50 flex items-center gap-2"
            >
              <span aria-hidden className={recargando ? 'inline-block animate-spin' : 'inline-block'}>
                🔄
              </span>
              {recargando ? 'Actualizando...' : 'Ver si hay nuevas'}
            </button>
          </div>

          {errorGaleria && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 text-red-700 text-sm" aria-live="polite">
              {errorGaleria}
            </div>
          )}

          {fotos.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-pastel-lavender/50 bg-soft-white px-6 py-12 text-center">
              <span className="text-5xl" aria-hidden>
                📷
              </span>
              <p className="mt-4 font-display text-xl text-gray-700">
                Todavía no hay fotos publicadas
              </p>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                Sé el primero en compartir. Sube las tuyas aquí arriba y, cuando los papás las
                aprueben, verás tu recuerdo en esta galería.
              </p>
              <button type="button" onClick={bajarASubida} className="btn-secondary mt-6">
                Subir mis fotos ↑
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {fotos.map((foto, indice) => (
                <button
                  key={foto.id}
                  type="button"
                  onClick={() => setIndiceAmpliado(indice)}
                  aria-label={`Ver foto de ${foto.autor || 'invitado anónimo'}`}
                  className="group relative overflow-hidden rounded-2xl shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300"
                >
                  <img
                    src={foto.url}
                    alt={foto.mensaje || `Foto de ${foto.autor || 'invitado'}`}
                    loading="lazy"
                    className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/85 backdrop-blur flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    aria-hidden
                  >
                    🔍
                  </span>
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-3 pt-6 pb-2.5 text-left sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                    <span className="block text-white text-xs font-semibold truncate">
                      {foto.autor || 'Invitado anónimo'}
                    </span>
                    {foto.mensaje && (
                      <span className="block text-white/85 text-xs line-clamp-2">{foto.mensaje}</span>
                    )}
                    <span className="block text-white/70 text-[11px] mt-0.5">
                      {formatearFecha(foto.createdAt)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Lightbox: ver la foto en grande con sus datos */}
        {fotoAmpliada && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setIndiceAmpliado(null)}
          >
            <div
              className="relative w-full max-w-4xl flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={fotoAmpliada.url}
                alt={fotoAmpliada.mensaje || 'Foto del álbum'}
                className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-card"
              />

              {fotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={mostrarAnterior}
                    aria-label="Foto anterior"
                    className="absolute left-1 sm:-left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-gray-700 text-lg shadow-soft hover:bg-white flex items-center justify-center"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={mostrarSiguiente}
                    aria-label="Foto siguiente"
                    className="absolute right-1 sm:-right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-gray-700 text-lg shadow-soft hover:bg-white flex items-center justify-center"
                  >
                    →
                  </button>
                </>
              )}

              <div className="mt-4 w-full bg-white rounded-2xl p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {fotoAmpliada.autor || 'Invitado anónimo'}
                  </p>
                  {fotoAmpliada.mensaje && (
                    <p className="text-gray-600 text-sm mt-1">{fotoAmpliada.mensaje}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {formatearFecha(fotoAmpliada.createdAt)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {indiceAmpliado !== null && fotos.length > 1 && (
                    <p className="text-xs text-gray-400 mb-2">
                      {indiceAmpliado + 1} / {fotos.length}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setIndiceAmpliado(null)}
                    className="text-sm font-semibold text-pastel-pink hover:text-pastel-lavender"
                  >
                    Cerrar ✕
                  </button>
                  <p className="hidden sm:block text-[11px] text-gray-400 mt-2">
                    Usa ← → para navegar
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

