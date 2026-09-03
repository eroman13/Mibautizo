/**
 * Rutas de la API REST
 */

import { Router } from 'express';
import { getRegalos, getRegaloById, getEvento } from '../controllers/regalos.controller';
import { crearPreferencia } from '../controllers/preferencia.controller';
import { webhook } from '../controllers/webhook.controller';
import { uploadImage } from '../controllers/upload.controller';
import { verificarAuthAdmin, rateLimit } from '../lib/security';
import {
  confirmarAsistencia,
  getAsistencias,
  eliminarAsistencia,
} from '../controllers/asistencia.controller';
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
  limpiarPagos,
  testEmail,
} from '../controllers/admin.controller';
import {
  getAllAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from '../controllers/admin-users.controller';

const router = Router();

// CRITICAL: Preflight lo maneja el middleware global de CORS. No reflejar
// orígenes aquí (evita bypass de la lista blanca).

// Middleware de autenticación: token firmado (ver lib/security.ts)
const verificarAuth = verificarAuthAdmin;

// Rutas públicas (sin autenticación)
router.get('/regalos', getRegalos);
router.get('/regalos/:id', getRegaloById);
router.get('/evento', getEvento);

// Ruta para subir imágenes
router.post('/upload-image', uploadImage);

// Ruta para crear preferencia de pago
router.post('/crear-preferencia', crearPreferencia);

// Webhook de Mercado Pago (con rate limit suave por si hay ráfagas)
router.post(
  '/webhook',
  rateLimit({ windowMs: 60 * 1000, max: 300, mensaje: 'Demasiadas notificaciones, intenta más tarde' }),
  webhook
);

// Confirmación de asistencia (RSVP)
router.post('/confirmar-asistencia', confirmarAsistencia);

// Rutas del panel admin
router.post(
  '/admin/login',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    mensaje: 'Demasiados intentos de inicio de sesión. Espera 15 minutos e intenta de nuevo.',
  }),
  adminLogin
);
router.get('/admin/stats', verificarAuth, getStats);
router.get('/admin/contribuciones', verificarAuth, getContribuciones);
router.post('/admin/regalos', verificarAuth, crearRegalo);
router.post('/admin/regalos/bulk', verificarAuth, crearRegalosMasivo);
router.put('/admin/regalos/:id', verificarAuth, actualizarRegalo);
router.delete('/admin/regalos/:id', verificarAuth, eliminarRegalo);
router.put('/admin/evento', verificarAuth, actualizarEvento);
router.get('/admin/export-csv', verificarAuth, exportarCSV);
router.post('/admin/limpiar-pagos', verificarAuth, limpiarPagos);
router.post('/admin/test-email', verificarAuth, testEmail);
router.get('/admin/asistencias', verificarAuth, getAsistencias);
router.delete('/admin/asistencias/:id', verificarAuth, eliminarAsistencia);

// Rutas de gestión de usuarios admin
router.get('/admin-users', verificarAuth, getAllAdminUsers);
router.post('/admin-users', verificarAuth, createAdminUser);
router.put('/admin-users/:id', verificarAuth, updateAdminUser);
router.delete('/admin-users/:id', verificarAuth, deleteAdminUser);

// TODO: integrar Khipu como método de pago alternativo
// router.post('/crear-pago-khipu', crearPagoKhipu);
// router.post('/webhook-khipu', webhookKhipu);

export default router;
