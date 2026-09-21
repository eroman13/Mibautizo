-- Agregar estado de respuesta al RSVP (confirmada | declinada)
ALTER TABLE "Asistencia" ADD COLUMN "estado" TEXT NOT NULL DEFAULT 'confirmada';

-- Registrar cuándo un invitado declinó la invitación (no asistirá)
ALTER TABLE "Invitacion" ADD COLUMN "fechaDeclinada" DATETIME;
