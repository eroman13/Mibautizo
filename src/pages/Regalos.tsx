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
  const [orden, setOrden] = useState('nombre');

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

  // Ordenar regalos según el criterio seleccionado
  const regalosOrdenados = [...regalos].sort((a, b) => {
    switch (orden) {
      case 'precio-asc':
        return a.precioCLP - b.precioCLP;
      case 'precio-desc':
        return b.precioCLP - a.precioCLP;
      case 'nombre':
        return a.nombre.localeCompare(b.nombre, 'es');
      case 'recientes':
      default:
        return b.id - a.id;
    }
  });

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

        {/* Barra de ordenamiento */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <p className="text-gray-600">
            {regalos.length} regalo{regalos.length !== 1 ? 's' : ''} disponibles
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="orden" className="text-gray-600 whitespace-nowrap">Ordenar por:</label>
            <select
              id="orden"
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="input-field max-w-xs"
            >
              <option value="nombre">Nombre (A-Z)</option>
              <option value="recientes">Recién agregados</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
            </select>
          </div>
        </div>

        {/* Grid de regalos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {regalosOrdenados.map(regalo => (
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
