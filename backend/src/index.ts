/**
 * Servidor principal - Mesa de Regalos Bautizo Gemelas
 * VERSIÓN RESILIENTE: Funciona aunque fallen dependencias
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';

// Get port from env or use default
const PORT = Number(process.env.PORT) || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';

// Create app
const app: Application = express();

console.log('\n📋 STARTUP CONFIGURATION');
console.log(`   PORT: ${PORT}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ configured' : '❌ not configured'}`);
console.log(`   FRONTEND: ${FRONTEND_URL}`);

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://mibautizo-frontend-six.vercel.app',
      'http://localhost:5176',
      'http://localhost:5174',
      FRONTEND_URL,
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Health endpoint - CRITICAL: Must always work
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Load and mount API routes - with error handling
try {
  const apiRoutes = require('./routes/index').default;
  if (apiRoutes) {
    app.use('/api', apiRoutes);
    console.log('✅ API routes loaded');
  }
} catch (error) {
  console.warn('⚠️  Could not load API routes:', error instanceof Error ? error.message : error);
  
  // Fallback: provide basic endpoints
  app.get('/api', (req: Request, res: Response) => {
    res.json({ message: 'API routes not loaded', status: 'partial' });
  });
}

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ ERROR:', err.message || err);
  res.status(500).json({
    error: 'Server error',
    message: err.message || 'Unknown error'
  });
});

// Start server
try {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n✅ SERVER STARTED SUCCESSFULLY');
    console.log(`   🚀 Running on http://0.0.0.0:${PORT}`);
    console.log(`   🌐 Health check: /api/health\n`);
  });

  // Handle server errors
  server.on('error', (err: any) => {
    console.error('❌ SERVER ERROR:', err.message);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('⚠️  SIGTERM received - shutting down');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

} catch (error) {
  console.error('❌ STARTUP ERROR:', error instanceof Error ? error.message : error);
  process.exit(1);
}

export default app;
