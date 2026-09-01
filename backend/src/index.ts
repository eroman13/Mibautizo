/**
 * Servidor principal del backend - Mesa de Regalos Bautizo Gemelas
 * Maneja la API, creación de preferencias de Mercado Pago y webhooks
 */

import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { prisma } from './lib/prisma';
import apiRoutes from './routes';

// Cargar variables de entorno solo si existen en desarrollo
if (fs.existsSync('../.env')) {
  dotenv.config({ path: '../.env' });
} else {
  console.log('⚠️ .env file not found (production mode - using environment variables)');
}

const app: Application = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';

// Middlewares - CORS Configuration
const allowedOrigins = [
  'https://mibautizo-frontend-six.vercel.app',
  'http://localhost:5176',
  'http://localhost:5174',
  FRONTEND_URL,
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

// Apply CORS to all routes and handle preflight
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Log configuración de inicio
console.log('📋 Configuración al startup:');
console.log(`   DATABASE_URL configured: ${process.env.DATABASE_URL ? '✅' : '❌'}`);
console.log(`   FRONTEND_URL: ${FRONTEND_URL}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   PORT: ${PORT}`);

// Health endpoint - NO depende de BD
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '🍼 Backend Mesa de Regalos - ONLINE',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database_configured: !!process.env.DATABASE_URL
  });
});

// Database status endpoint - para diagnóstico
app.get('/api/db-status', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'connected',
      message: '✅ Database connection successful'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'disconnected',
      message: '❌ Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Montar rutas de la API
app.use('/api', apiRoutes);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    path: req.path 
  });
});

// Manejo de errores general
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

// Iniciar servidor
const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`✅ SERVER STARTED - Port ${PORT}`);
  console.log(`🚀 Servidor backend corriendo en http://0.0.0.0:${PORT}`);
  console.log(`🌐 Frontend configurado en: ${FRONTEND_URL}`);
  console.log(`📦 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Base de datos: PostgreSQL (${process.env.DATABASE_URL ? 'configurada' : 'no configurada'})`);
});

// Manejo de errores del servidor
server.on('error', (err) => {
  console.error('❌ Error del servidor:', err);
  process.exit(1);
});

// Manejo de señales para shutdown graceful
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});

export default app;
