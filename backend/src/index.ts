/**
 * Servidor principal - Mesa de Regalos Bautizo
 * Carga dotenv al inicio, configura CORS correctamente y
 * NUNCA crashea al arrancar (responde /api/health siempre).
 */

import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno ANTES de cualquier otra cosa
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

console.log('\n🚀 SERVER STARTING');
const app: Application = express();

// Railway: el dominio público apunta al puerto 8080 (target port "custom").
// En producción forzamos 8080 para evitar mismatch si existe una variable
// PORT=3000 inyectada por Railway. En desarrollo usamos PORT o 3000.
const PORT = process.env.NODE_ENV === 'production'
  ? 8080
  : (Number(process.env.PORT) || 3000);

console.log(`   PORT: ${PORT}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   DATABASE_URL configured: ${process.env.DATABASE_URL ? 'yes' : 'no'}`);

// Log de diagnóstico de credenciales de Mercado Pago (sin exponer token completo)
const mpToken = process.env.MP_ACCESS_TOKEN || '';
if (mpToken) {
  const parts = mpToken.split('-');
  const userId = parts[parts.length - 1] || 'N/A';
  console.log(`   MP_ACCESS_TOKEN: ${mpToken.substring(0, 20)}...`);
  console.log(`   MP_ACCESS_TOKEN user_id: ${userId}`);
} else {
  console.log('   MP_ACCESS_TOKEN: NO CONFIGURADO');
}
const mpPublicKey = process.env.MP_PUBLIC_KEY || '';
if (mpPublicKey) {
  console.log(`   MP_PUBLIC_KEY: ${mpPublicKey.substring(0, 20)}...`);
} else {
  console.log('   MP_PUBLIC_KEY: NO CONFIGURADO');
}

// CORS - reflejar el origen de la petición (compatible con credentials)
const allowedOrigins = [
  'https://mibautizo-frontend-six.vercel.app',
  'https://mibautizo.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5176',
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin Origin (curl, Postman, webhooks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // En desarrollo, permitir cualquier origen local
    if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost')) {
      return callback(null, true);
    }
    // Reflejar el origen para evitar bloquear el frontend
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
}));

app.use(express.json({ limit: '100mb' }));

// Health - debe responder siempre
app.get('/api/health', (req, res) => {
  console.log('✅ GET /api/health called');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// Intentar cargar la aplicación completa (rutas, controladores, BD)
console.log('📦 Attempting to load full application...');
try {
  const routes = require('./routes/index');
  const apiRoutes = routes.default || routes;
  app.use('/api', apiRoutes);
  console.log('✅ Full routes loaded');
} catch (error) {
  console.warn('⚠️ Could not load full routes, using minimal server only');
  console.error('   Error:', error instanceof Error ? error.message : error);
  console.error('   Stack:', error instanceof Error ? error.stack : 'no stack');
}

// Auto-seed: poblar la base de datos si está vacía (no bloquea el arranque)
try {
  const { autoSeedIfEmpty } = require('./lib/autoSeed');
  autoSeedIfEmpty();
} catch (error) {
  console.warn('⚠️ Could not load autoSeed module');
  console.error('   Error:', error instanceof Error ? error.message : error);
}

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('ERROR:', err.message);
  res.status(500).json({ error: err.message });
});

// Start
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ SERVER RUNNING ON PORT ${PORT}`);
  console.log('   Health: http://0.0.0.0:' + PORT + '/api/health\n');
});

server.on('error', (err: any) => {
  console.error('❌ SERVER ERROR:', err.message);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM - shutting down');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;
