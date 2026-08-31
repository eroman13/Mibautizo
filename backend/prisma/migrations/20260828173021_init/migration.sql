-- CreateTable
CREATE TABLE "Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombreGemela1" TEXT NOT NULL,
    "nombreGemela2" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "lugar" TEXT NOT NULL,
    "mensajeBienvenida" TEXT NOT NULL,
    "portadaUrl" TEXT,
    "modoComision" TEXT NOT NULL DEFAULT 'A',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Gift" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precioCLP" INTEGER NOT NULL,
    "imagenUrl" TEXT NOT NULL,
    "permiteColaborativo" BOOLEAN NOT NULL DEFAULT false,
    "montoRecaudadoCLP" INTEGER NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'disponible',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "giftId" INTEGER,
    "montoBrutoCLP" INTEGER NOT NULL,
    "comisionCLP" INTEGER NOT NULL,
    "montoNetoCLP" INTEGER NOT NULL,
    "nombreInvitado" TEXT NOT NULL,
    "emailInvitado" TEXT,
    "dedicatoria" TEXT,
    "estadoPago" TEXT NOT NULL,
    "mpPaymentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contribution_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "Gift" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_mpPaymentId_key" ON "Contribution"("mpPaymentId");
