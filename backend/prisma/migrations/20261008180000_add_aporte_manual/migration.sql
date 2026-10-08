-- Aportes registrados a mano por el admin (transferencias bancarias, efectivo, etc.)
-- Antes mpPaymentId era obligatorio; ahora un aporte puede no tener pago de Mercado Pago.
ALTER TABLE "Contribution" ALTER COLUMN "mpPaymentId" DROP NOT NULL;

-- Forma en que se recibió el aporte: "mercadopago" | "transferencia" | "efectivo" | "otro"
ALTER TABLE "Contribution" ADD COLUMN "metodoPago" TEXT NOT NULL DEFAULT 'mercadopago';

-- N° de operación / comprobante de la transferencia (opcional)
ALTER TABLE "Contribution" ADD COLUMN "referencia" TEXT;

-- Para qué melliza es el regalo (opcional)
ALTER TABLE "Contribution" ADD COLUMN "paraMelliza" TEXT;

-- Usuario admin que registró el aporte manual (opcional)
ALTER TABLE "Contribution" ADD COLUMN "registradoPor" TEXT;

CREATE INDEX "Contribution_metodoPago_idx" ON "Contribution"("metodoPago");
