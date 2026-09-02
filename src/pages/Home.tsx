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
        {evento.portadaUrl && (
          <img
            src={evento.portadaUrl}
            srcSet={generarSrcSet(evento.portadaUrl)}
            sizes="100vw"
            alt={`Bautizo de ${evento.nombreGemela1} y ${evento.nombreGemela2}`}
            className="absolute inset-0 w-full h-full object-cover object-top md:object-center"
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
              href={`https://waze.com/ul?q=${encodeURIComponent(evento.lugar)}`}
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

      {/* CTA */}
      <section className="container mx-auto px-4 pb-16 text-center">
        <Link to="/regalos" className="btn-primary inline-block text-lg px-8 py-4">
          Ver la lista de regalos 🎁
        </Link>
      </section>

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
