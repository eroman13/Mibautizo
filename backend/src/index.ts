/**
 * NUCLEAR OPTION: Ultra-simple server to diagnose Railway issues
 * Only Express + CORS, nothing else
 */

import express, { Application } from 'express';
import cors from 'cors';

console.log('\n🚀 ULTRA-MINIMAL SERVER STARTING');
console.log(`PORT: ${process.env.PORT || 3000}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

const app: Application = express();
const PORT = Number(process.env.PORT) || 3000;

// CORS - permissive
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200,
}));

app.use(express.json());

// Health - must work
app.get('/api/health', (req, res) => {
  console.log('✅ GET /api/health called');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Try to load full app
console.log('📦 Attempting to load full application...');
try {
  const routes = require('./routes/index');
  const apiRoutes = routes.default || routes;
  app.use('/api', apiRoutes);
  console.log('✅ Full routes loaded');
} catch (error) {
  console.warn('⚠️ Could not load full routes, using minimal server only');
  console.error('Error:', error instanceof Error ? error.message : error);
}

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
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
