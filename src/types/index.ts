/**
 * Tipos y interfaces compartidas en el frontend
 */

export interface Regalo {
  id: number;
  nombre: string;
  descripcion: string;
  precioCLP: number;
  imagenUrl: string;
  permiteColaborativo: boolean;
  montoRecaudadoCLP: number;
  estado: 'disponible' | 'reservado' | 'pagado';
}

export interface Evento {
  id: number;
  nombreGemela1: string;
  nombreGemela2: string;
  fecha: string;
  hora: string;
  lugar: string;
  lugarRecepcion?: string | null;
  mensajeBienvenida: string;
  portadaUrl: string | null;
  portadaUrlMobile?: string | null;
  wazeUrl?: string | null;
  modoComision: 'A' | 'B';
}

export interface ItemCarrito {
  regalo: Regalo;
  montoLibre?: number; // Para aportes libres
  paraGemela: 'gemela1' | 'gemela2'; // Para quién es el regalo
}

export interface Invitado {
  nombre: string;
  email?: string;
  dedicatoria?: string;
}

export interface Desglose {
  montoBase: number;
  comision: number;
  total: number;
  neto: number;
  modoComision: 'A' | 'B';
}
