/**
 * Configuración del cliente de Prisma
 * Singleton para reutilizar la conexión a la base de datos
 */

import { PrismaClient } from '@prisma/client';

// Prevenir múltiples instancias de PrismaClient en desarrollo
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
