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
  nombreMelliza1: string;
  nombreMelliza2: string;
  fecha: string;
  hora: string;
  lugar: string;
  lugarRecepcion?: string | null;
  wazeUrlRecepcion?: string | null;
  mensajeBienvenida: string;
  portadaUrl: string | null;
  portadaUrlMobile?: string | null;
  wazeUrl?: string | null;
  modoComision: 'A' | 'B';
  emailNotificaciones?: string | null; // Emails que reciben avisos de regalos y asistencia
}

export interface ItemCarrito {
  regalo: Regalo;
  montoLibre?: number; // Para aportes libres
  paraMelliza: 'melliza1' | 'melliza2'; // Para quién es el regalo
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

export interface AsistenteConfirmacion {
  id?: number;
  nombre: string;
  tipo: 'adulto' | 'nino';
  edad?: number | null;
  /** false = la persona finalmente no asistirá (queda registrada para el conteo) */
  asiste?: boolean;
}

export interface Invitacion {
  id: number;
  familia: string;
  contacto?: string | null;
  telefono?: string | null;
  token: string;
  estado: 'pendiente' | 'enviada' | 'confirmada' | 'declinada';
  modalidad: 'familiar' | 'pareja' | 'individual' | 'adulto-hijos';
  asistentes?: string | null;
  fechaEnviada?: string | null;
  fechaConfirmada?: string | null;
  fechaDeclinada?: string | null;
  recordatoriosEnviados?: number;
  fechaUltimoRecordatorio?: string | null;
  asistenciaId?: number | null;
  createdAt?: string;
}

export interface ConfirmacionAsistencia {
  id: number;
  nombreFamilia: string;
  email?: string | null;
  telefono?: string | null;
  mensaje?: string | null;
  estado?: 'confirmada' | 'declinada';
  createdAt: string;
  asistentes: AsistenteConfirmacion[];
}

/** Foto del álbum compartido del evento */
export interface Foto {
  id: number;
  url: string;
  storage?: 'r2' | 'base64';
  autor?: string | null;
  mensaje?: string | null;
  invitacionToken?: string | null;
  estado?: 'pendiente' | 'aprobada' | 'rechazada';
  createdAt: string;
}

/** Resumen de la galería para el panel admin */
export interface ResumenFotos {
  total: number;
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
}

/** Resumen de confirmaciones de asistencia */
export interface ResumenAsistencias {
  familias: number;
  declinadas: number;
  adultos: number;
  ninosMenores: number;
  ninosMayores: number;
  ninos: number;
  totalAsistentes: number;
  personasNoAsisten: number;
  totalNoAsisten: number;
  totalRespuestas: number;
  invitaciones?: {
    total: number;
    respondidas: number;
    confirmadas: number;
    declinadas: number;
    sinResponder: number;
  };
}
