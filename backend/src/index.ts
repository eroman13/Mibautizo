/**
 * Servidor principal del backend - Mesa de Regalos Bautizo Gemelas
 * Maneja la API, creación de preferencias de Mercado Pago y webhooks
 */

import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: '../.env' });

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

// Importar rutas
import apiRoutes from './routes';

// Rutas de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '🍼 Backend Mesa de Regalos funcionando correctamente',
    timestamp: new Date().toISOString()
  });
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
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Servidor backend corriendo en http://0.0.0.0:${PORT}`);
  console.log(`🌐 Frontend configurado en: ${FRONTEND_URL}`);
  console.log(`📦 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Base de datos: PostgreSQL (${process.env.DATABASE_URL ? 'configurada' : 'no configurada'})`);
});

export default app;
