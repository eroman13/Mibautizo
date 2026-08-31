/**
 * Store de carrito usando React Context
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { ItemCarrito, Regalo } from '../types';

interface CarritoContextType {
  items: ItemCarrito[];
  agregarAlCarrito: (regalo: Regalo, paraGemela: 'gemela1' | 'gemela2', montoLibre?: number) => void;
  eliminarDelCarrito: (index: number) => void;
  limpiarCarrito: () => void;
  totalItems: number;
  regalosGemela1: number;
  regalosGemela2: number;
}

const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);

  const agregarAlCarrito = (regalo: Regalo, paraGemela: 'gemela1' | 'gemela2', montoLibre?: number) => {
    // Permitir múltiples aportes del mismo regalo para la misma o diferente gemela
    setItems([...items, { regalo, montoLibre, paraGemela }]);
  };

  const eliminarDelCarrito = (index: number) => {
    // Eliminar el item en el índice especificado
    setItems(items.filter((_, i) => i !== index));
  };

  const limpiarCarrito = () => {
    setItems([]);
  };

  const regalosGemela1 = items.filter(item => item.paraGemela === 'gemela1').length;
  const regalosGemela2 = items.filter(item => item.paraGemela === 'gemela2').length;

  return (
    <CarritoContext.Provider
      value={{
        items,
        agregarAlCarrito,
        eliminarDelCarrito,
        limpiarCarrito,
        totalItems: items.length,
        regalosGemela1,
        regalosGemela2,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error('useCarrito debe usarse dentro de CarritoProvider');
  }
  return context;
}
