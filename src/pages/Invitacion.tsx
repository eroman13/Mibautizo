/**
 * Página pública de invitación por familia (enlace único compartido por WhatsApp)
 * - Muestra una tarjeta de invitación con fecha/lugar
 * - 2 botones: Confirmar asistencia (precargando la familia) y Ver regalos
 */

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Evento } from '../types';
import { api } from '../services/api';
import { formatDate } from '../utils/format';

export default function Invitacion() {
  const [searchParams] = useSearchParams();
  const familia = (searchParams.get('familia') || '').trim();
  const token = (searchParams.get('token') || '').trim();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

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

  const queryRsvp = new URLSearchParams();
  if (familia) queryRsvp.set('familia', familia);
  if (token) queryRsvp.set('token', token);
  const queryString = queryRsvp.toString();

  const urlActual = window.location.href;

  const copiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(urlActual);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (error) {
      alert('No se pudo copiar el enlace. Cópialo manualmente.');
    }
  };

  const compartirWhatsApp = () => {
    const texto = `Hola${familia ? ` ${familia}` : ''} 💌 Te esperamos en el bautizo de las mellizas 🎀\nConfirma tu asistencia y revisa la lista de regalos aquí:\n${urlActual}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
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
    <div className="min-h-screen bg-soft-gray flex items-center justify-center py-12">
      <div className="container mx-auto px-4 max-w-xl">
        {/* Tarjeta de invitación */}
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          {/* Borde superior decorativo */}
          <div className="h-2 bg-gradient-to-r from-pastel-pink via-pastel-peach to-pastel-lavender"></div>

          <div className="p-8 md:p-10 text-center">
            <div className="text-5xl mb-4">🎀</div>
            <p className="text-pastel-pink font-medium uppercase tracking-widest text-xs mb-2">
              Bautizo de
            </p>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-800 mb-2">
              {evento.nombreMelliza1} & {evento.nombreMelliza2}
            </h1>

            {familia ? (
              <p className="text-gray-600 text-lg mb-6">
                ¡{familia}, los esperamos con mucho cariño! 💝
              </p>
            ) : (
              <p className="text-gray-600 text-lg mb-6">
                ¡Te esperamos con mucho cariño! 💝
              </p>
            )}

            <div className="bg-soft-gray rounded-2xl p-4 mb-6 space-y-1 text-sm text-gray-700">
              <p>📅 {formatDate(evento.fecha)}</p>
              <p>🕐 {evento.hora}</p>
              <p>📍 {evento.lugar}</p>
              {evento.lugarRecepcion && (
                <p>🥂 Recepción: {evento.lugarRecepcion}</p>
              )}
            </div>

            {/* Dos acciones desde un único enlace */}
            <div className="space-y-3">
              <Link
                to={queryString ? `/confirmar-asistencia?${queryString}` : '/confirmar-asistencia'}
                className="btn-primary w-full inline-block text-center"
              >
                💌 Confirmar asistencia
              </Link>
              <Link
                to="/regalos"
                className="btn-secondary w-full inline-block text-center"
              >
                🎁 Ver lista de regalos
              </Link>
            </div>

            {/* Reenviar invitación */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-center gap-2 text-sm">
              <button
                type="button"
                onClick={compartirWhatsApp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium"
              >
                📲 Enviar por WhatsApp
              </button>
              <button
                type="button"
                onClick={copiarEnlace}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-medium"
              >
                {copiado ? '✅ Enlace copiado' : '🔗 Copiar enlace'}
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-gray-500 hover:text-pastel-pink text-sm">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
