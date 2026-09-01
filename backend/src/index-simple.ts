/**
 * Servidor principal - VERSIÓN ULTRA MINIMAL
 * Solo Express + CORS, sin dependencias complejas
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Ultra minimal setup
const app: Application = express();
const PORT = Number(process.env.PORT) || 3000;

console.log('\n🚀 STARTING MINIMAL SERVER');
console.log(`   PORT: ${PORT}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'not set'}`);

// CORS - permissive but explicit
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200,
}));

app.use(express.json({ limit: '50mb' }));

// Health - MUST work
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Try to load the full application
let apiRoutes: express.Router | null = null;
try {
  const routes = require('./routes/index');
  apiRoutes = routes.default || routes;
  console.log('✅ Routes loaded successfully');
} catch (error) {
  console.warn('⚠️  Could not load routes:', error instanceof Error ? error.message : error);
  // Continue anyway
}

// Mount routes if available
if (apiRoutes) {
  app.use('/api', apiRoutes);
  console.log('✅ Routes mounted');
} else {
  console.log('⚠️  Routes NOT mounted - using minimal server only');
}

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('ERROR:', err.message || err);
  res.status(500).json({ error: 'Server error', message: err.message || 'Unknown error' });
});

// Start server
try {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n✅ SERVER RUNNING');
    console.log(`   URL: http://0.0.0.0:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  });

  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}

export default app;
