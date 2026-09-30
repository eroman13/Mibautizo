-- Personas que finalmente no asistirán: quedan registradas dentro de la confirmación
ALTER TABLE "Asistente" ADD COLUMN "asiste" BOOLEAN NOT NULL DEFAULT true;

-- Álbum de fotos del evento (subidas por los invitados y moderadas por el admin)
CREATE TABLE "Foto" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "storage" TEXT NOT NULL DEFAULT 'r2',
    "autor" TEXT,
    "mensaje" TEXT,
    "invitacionToken" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Foto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Foto_estado_idx" ON "Foto"("estado");
CREATE INDEX "Foto_createdAt_idx" ON "Foto"("createdAt");
