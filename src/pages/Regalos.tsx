/**
 * Página del catálogo de regalos
 */

import { useEffect, useState } from 'react';
import { Regalo, Evento } from '../types';
import { api } from '../services/api';
import TarjetaRegalo from '../components/regalos/TarjetaRegalo';
import CarritoFlotante from '../components/carrito/CarritoFlotante';

export default function Regalos() {
  const [regalos, setRegalos] = useState<Regalo[]>([]);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [eventRes, regalosRes] = await Promise.all([
        api.getEvento(),
        api.getRegalos(),
      ]);
      setEvento(eventRes.data);
      setRegalos(regalosRes.data.regalos);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pastel-pink mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando regalos...</p>
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
    <div className="min-h-screen bg-soft-gray py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-800 mb-4 section-decoration">
            Lista de Regalos
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Elige el regalo que quieras hacerle a {evento.nombreGemela1} o {evento.nombreGemela2}. 
            Puedes seleccionar varios regalos, uno para cada gemela o ambas 💝
          </p>
        </div>

        {/* Grid de regalos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {regalos.map(regalo => (
            <TarjetaRegalo 
              key={regalo.id} 
              regalo={regalo}
              gemela1={evento.nombreGemela1}
              gemela2={evento.nombreGemela2}
            />
          ))}
        </div>

        {/* Carrito flotante */}
        <CarritoFlotante gemela1={evento.nombreGemela1} gemela2={evento.nombreGemela2} />
      </div>
    </div>
  );
}
