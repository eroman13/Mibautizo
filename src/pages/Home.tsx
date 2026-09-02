/**
 * Página principal - Landing del evento
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Evento } from '../types';
import { api } from '../services/api';
import { formatDate } from '../utils/format';
import { generarSrcSet } from '../utils/imagen';

export default function Home() {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEvento();
  }, []);

  const cargarEvento = async () => {
    try {
      const response = await api.getEvento();
      setEvento(response.data);
    } catch (error) {
      console.error('Error al cargar evento:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pastel-pink mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Error al cargar el evento</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero / Portada (full-screen) */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Imagen de fondo optimizada por dispositivo (object-fit evita cortes) */}
        {/* Imagen mobile (solo pantallas pequeñas) */}
        {evento.portadaUrlMobile && (
          <img
            src={evento.portadaUrlMobile}
            srcSet={generarSrcSet(evento.portadaUrlMobile)}
            sizes="100vw"
            alt={`Bautizo de ${evento.nombreGemela1} y ${evento.nombreGemela2}`}
            className="absolute inset-0 w-full h-full object-cover object-center md:hidden"
            style={{ filter: 'brightness(0.65)' }}
          />
        )}

        {/* Imagen desktop (pantallas medianas y grandes) */}
        {evento.portadaUrl && (
          <img
            src={evento.portadaUrl}
            srcSet={generarSrcSet(evento.portadaUrl)}
            sizes="100vw"
            alt={`Bautizo de ${evento.nombreGemela1} y ${evento.nombreGemela2}`}
            className="absolute inset-0 w-full h-full object-cover object-center hidden md:block"
            style={{ filter: 'brightness(0.65)' }}
          />
        )}

        {/* Overlay degradado para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-pastel-blue/40 via-pastel-pink/30 to-pastel-blue/40"></div>

        {/* Contenido */}
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-display text-white mb-4 drop-shadow-lg">
            🍼 Bautizo de
          </h1>
          <h2 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 drop-shadow-lg">
            {evento.nombreGemela1} & {evento.nombreGemela2}
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-white text-lg md:text-xl drop-shadow">
            <span className="flex items-center gap-2">
              📅 {formatDate(evento.fecha)}
            </span>
            <span className="hidden md:inline">•</span>
            <span className="flex items-center gap-2">
              🕐 {evento.hora}
            </span>
            <span className="hidden md:inline">•</span>
            <a
              href={evento.wazeUrl || `https://waze.com/ul?q=${encodeURIComponent(evento.lugar)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:underline underline-offset-4 transition-all"
              title="Abrir en Waze"
            >
              📍 {evento.lugar}
            </a>
          </div>
        </div>
      </section>

      {/* Mensaje de bienvenida */}
      <section className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-card p-8 md:p-12">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-display font-bold text-gray-800 mb-2 section-decoration">
              ¡Bienvenidos!
            </h3>
          </div>
          <div className="prose prose-lg mx-auto text-gray-700 whitespace-pre-line">
            {evento.mensajeBienvenida}
          </div>
        </div>
      </section>

      {/* CTA: botón de regalos */}
      <section className="container mx-auto px-4 pb-12 text-center">
        <Link
          to="/regalos"
          className="btn-primary inline-block text-xl md:text-2xl px-12 py-4 shadow-card"
        >
          Ver la lista de regalos 🎁
        </Link>
      </section>

      {/* Recepción (se muestra si está configurada) */}
      {evento.lugarRecepcion && (
        <section className="container mx-auto px-4 pb-12 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-card p-8 md:p-10 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-3xl font-display font-bold text-gray-800 mb-4 section-decoration">
              Recepción
            </h3>
            <p className="text-lg text-gray-600 mb-3">
              Después de la ceremonia, la recepción será en:
            </p>
            <p className="text-2xl md:text-3xl font-display font-bold text-pastel-pink mb-4">
              📍 {evento.lugarRecepcion}
            </p>
            <a
              href={evento.wazeUrlRecepcion || `https://waze.com/ul?q=${encodeURIComponent(evento.lugarRecepcion)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-pastel-pink hover:underline underline-offset-4 transition-colors font-medium"
              title="Abrir en Waze"
            >
              🧭 Cómo llegar en Waze
            </a>
          </div>
        </section>
      )}

      {/* Acceso administración (discreto) */}
      <div className="container mx-auto px-4 pb-8 text-center">
        <Link
          to="/admin/login"
          className="text-gray-400 hover:text-pastel-pink text-sm transition-colors inline-flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Administración
        </Link>
      </div>

      {/* Decoración */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-pastel-blue/10 to-transparent pointer-events-none"></div>
    </div>
  );
}
