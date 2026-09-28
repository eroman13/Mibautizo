-- Recordatorios enviados por WhatsApp a las invitaciones que aún no confirman
ALTER TABLE "Invitacion" ADD COLUMN "recordatoriosEnviados" INTEGER NOT NULL DEFAULT 0;

-- Fecha del último recordatorio enviado (para no repetir el mismo día sin darse cuenta)
ALTER TABLE "Invitacion" ADD COLUMN "fechaUltimoRecordatorio" TIMESTAMP(3);
