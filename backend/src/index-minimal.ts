/**
 * Servidor mínimo para diagnosticar el problema en Railway
 * Solo responde a health checks - sin BD, sin rutas complejas
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🟢 Starting minimal server...');
console.log(`📍 PORT: ${PORT}`);
console.log(`📍 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`📍 DATABASE_URL configured: ${process.env.DATABASE_URL ? 'yes' : 'no'}`);

// Enable CORS
app.use(cors({
  origin: [
    'https://mibautizo-frontend-six.vercel.app',
    'http://localhost:5176',
    'http://localhost:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200
}));

app.use(express.json());

// Health check - MUST work
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Backend is running'
  });
});

// Start server
const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`✅ Server listening on port ${PORT}`);
  console.log(`🌐 CORS enabled for Vercel frontend`);
});

// Handle errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

export default app;
