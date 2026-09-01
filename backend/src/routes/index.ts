/**
 * Rutas de la API REST
 */

import { Router } from 'express';
import { getRegalos, getRegaloById, getEvento } from '../controllers/regalos.controller';
import { crearPreferencia } from '../controllers/preferencia.controller';
import { webhook } from '../controllers/webhook.controller';
import { uploadImage } from '../controllers/upload.controller';
import {
  adminLogin,
  getStats,
  getContribuciones,
  crearRegalo,
  crearRegalosMasivo,
  actualizarRegalo,
  eliminarRegalo,
  actualizarEvento,
  exportarCSV,
} from '../controllers/admin.controller';
import {
  getAllAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from '../controllers/admin-users.controller';

const router = Router();

// CRITICAL: Handle preflight requests (fallback en caso de que el
// middleware global de CORS no lo intercepte antes)
router.options('*', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  });
  res.sendStatus(200);
});

// Middleware simple de autenticación
const verificarAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader === 'Bearer admin-authenticated') {
    next();
  } else {
    res.status(401).json({ success: false, error: 'No autorizado' });
  }
};

// Rutas públicas (sin autenticación)
router.get('/regalos', getRegalos);
router.get('/regalos/:id', getRegaloById);
router.get('/evento', getEvento);

// Ruta para subir imágenes
router.post('/upload-image', uploadImage);

// Ruta para crear preferencia de pago
router.post('/crear-preferencia', crearPreferencia);

// Webhook de Mercado Pago
router.post('/webhook', webhook);

// Rutas del panel admin
router.post('/admin/login', adminLogin);
router.get('/admin/stats', verificarAuth, getStats);
router.get('/admin/contribuciones', verificarAuth, getContribuciones);
router.post('/admin/regalos', verificarAuth, crearRegalo);
router.post('/admin/regalos/bulk', verificarAuth, crearRegalosMasivo);
router.put('/admin/regalos/:id', verificarAuth, actualizarRegalo);
router.delete('/admin/regalos/:id', verificarAuth, eliminarRegalo);
router.put('/admin/evento', verificarAuth, actualizarEvento);
router.get('/admin/export-csv', verificarAuth, exportarCSV);

// Rutas de gestión de usuarios admin
router.get('/admin-users', verificarAuth, getAllAdminUsers);
router.post('/admin-users', verificarAuth, createAdminUser);
router.put('/admin-users/:id', verificarAuth, updateAdminUser);
router.delete('/admin-users/:id', verificarAuth, deleteAdminUser);

// TODO: integrar Khipu como método de pago alternativo
// router.post('/crear-pago-khipu', crearPagoKhipu);
// router.post('/webhook-khipu', webhookKhipu);

export default router;
