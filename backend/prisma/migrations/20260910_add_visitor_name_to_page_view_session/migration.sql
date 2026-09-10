-- Agregar identificación amigable del visitante asociada a invitaciones
ALTER TABLE "PageViewSession" ADD COLUMN "invitationToken" TEXT;
ALTER TABLE "PageViewSession" ADD COLUMN "visitorName" TEXT;

-- Mejora consultas por token de invitación
CREATE INDEX "PageViewSession_invitationToken_idx" ON "PageViewSession"("invitationToken");
