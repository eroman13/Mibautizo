/**
 * Store de carrito usando React Context
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { ItemCarrito, Regalo } from '../types';

interface CarritoContextType {
  items: ItemCarrito[];
  agregarAlCarrito: (regalo: Regalo, paraMelliza: 'melliza1' | 'melliza2', montoLibre?: number) => void;
  eliminarDelCarrito: (index: number) => void;
  limpiarCarrito: () => void;
  totalItems: number;
  regalosMelliza1: number;
  regalosMelliza2: number;
}

const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);

  const agregarAlCarrito = (regalo: Regalo, paraMelliza: 'melliza1' | 'melliza2', montoLibre?: number) => {
    // Permitir múltiples aportes del mismo regalo para la misma o diferente melliza
    setItems([...items, { regalo, montoLibre, paraMelliza }]);
  };

  const eliminarDelCarrito = (index: number) => {
    // Eliminar el item en el índice especificado
    setItems(items.filter((_, i) => i !== index));
  };

  const limpiarCarrito = () => {
    setItems([]);
  };

  const regalosMelliza1 = items.filter(item => item.paraMelliza === 'melliza1').length;
  const regalosMelliza2 = items.filter(item => item.paraMelliza === 'melliza2').length;

  return (
    <CarritoContext.Provider
      value={{
        items,
        agregarAlCarrito,
        eliminarDelCarrito,
        limpiarCarrito,
        totalItems: items.length,
        regalosMelliza1,
        regalosMelliza2,
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
