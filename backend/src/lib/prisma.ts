/**
 * Configuración del cliente de Prisma
 * Singleton para reutilizar la conexión a la base de datos
 */

import { PrismaClient } from '@prisma/client';

// Prevenir múltiples instancias de PrismaClient en desarrollo
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient | null = null;

try {
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient();
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
  
  console.log('✅ Prisma Client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Prisma Client:', error instanceof Error ? error.message : error);
  console.log('⚠️  Application will continue but database operations may fail');
  prismaInstance = null;
}

// NEVER throw at module load time. If Prisma couldn't initialize,
// create a lazy client so the server can still start and respond
// to /api/health (avoiding Railway 502 / crash loop).
export const prisma: PrismaClient = prismaInstance ?? new PrismaClient();

export default prisma;
