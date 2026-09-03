/**
 * Servidor principal - Mesa de Regalos Bautizo
 * Carga dotenv al inicio, configura CORS correctamente y
 * NUNCA crashea al arrancar (responde /api/health siempre).
 */

import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';
import { securityHeaders } from './lib/security';

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

// Sincronizar el schema de la base de datos (aplica cambios pendientes).
// Se ejecuta aquí (dentro del código) porque Railway ignora el startCommand
// del railway.json, por lo que el `prisma db push` del Dockerfile no se ejecuta.
try {
  console.log('🔄 Sincronizando schema de base de datos...');
  execSync('npx prisma db push --accept-data-loss --skip-generate', {
    stdio: 'inherit',
    timeout: 120000,
  });
  console.log('✅ Schema de base de datos sincronizado');
} catch (error) {
  console.error('⚠️ Error al sincronizar schema:', error instanceof Error ? error.message : error);
}

// CORS - lista blanca de orígenes permitidos (NO reflejar cualquier origen).
// Reflejar cualquier origen con credentials es un riesgo de seguridad.
const allowedOrigins: string[] = [
  'https://bautizo-anto-emi.vercel.app',
  'https://mibautizo.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5176',
];

// FRONTEND_URL (si está definido) y orígenes extra separados por coma
if (process.env.FRONTEND_URL) {
  const f = process.env.FRONTEND_URL.trim().replace(/\/+$/, '');
  if (f && !allowedOrigins.includes(f)) allowedOrigins.push(f);
}
if (process.env.ALLOWED_ORIGINS) {
  for (const o of process.env.ALLOWED_ORIGINS.split(',')) {
    const t = o.trim().replace(/\/+$/, '');
    if (t && !allowedOrigins.includes(t)) allowedOrigins.push(t);
  }
}

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permitir peticiones sin Origin (curl, Postman, webhooks, apps móviles)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // En desarrollo, permitir cualquier origen localhost
    if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost')) {
      return callback(null, true);
    }
    console.warn(`🚫 CORS bloqueado para origen: ${origin}`);
    return callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(securityHeaders());

app.use(express.json({ limit: '25mb' }));

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

// Error handler (no exponer detalles internos al cliente)
app.use((err: any, req: any, res: any, next: any) => {
  if (res.headersSent) return next(err);
  console.error('ERROR:', err.message);
  console.error('   Stack:', err.stack);
  // Errores de parsing JSON (body malformado) -> 400; resto -> 500 genérico
  const status = err instanceof SyntaxError ? 400 : 500;
  res.status(status).json({ error: status === 400 ? 'JSON inválido' : 'Error interno del servidor' });
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
