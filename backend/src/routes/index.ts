/**
 * Rutas de la API REST
 */

import { Router } from 'express';
import { getRegalos, getRegaloById, getEvento, getPortada } from '../controllers/regalos.controller';
import { crearPreferencia } from '../controllers/preferencia.controller';
import { webhook } from '../controllers/webhook.controller';
import { uploadImage } from '../controllers/upload.controller';
import { verificarAuthAdmin, rateLimit } from '../lib/security';
import {
  confirmarAsistencia,
  declinarAsistencia,
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
  getEventoAdmin,
  exportarCSV,
  limpiarPagos,
  testEmail,
} from '../controllers/admin.controller';
import {
  getInvitaciones,
  crearInvitacion,
  crearInvitacionesMasivo,
  actualizarInvitacion,
  marcarEnviadaInvitacion,
  registrarRecordatorio,
  eliminarInvitacion,
  getInvitacionPublica,
} from '../controllers/invitaciones.controller';
import {
  getAllAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from '../controllers/admin-users.controller';
import { trackPageView, getAnalytics } from '../controllers/analytics.controller';
import {
  getFotosPublicas,
  subirFotoPublica,
  getFotosAdmin,
  subirFotoAdmin,
  actualizarEstadoFoto,
  eliminarFoto,
} from '../controllers/fotos.controller';

const router = Router();

// CRITICAL: Preflight lo maneja el middleware global de CORS. No reflejar
// orígenes aquí (evita bypass de la lista blanca).

// Middleware de autenticación: token firmado (ver lib/security.ts)
const verificarAuth = verificarAuthAdmin;

// Rutas públicas (sin autenticación)
router.get('/regalos', getRegalos);
router.get('/regalos/:id', getRegaloById);
router.get('/evento', getEvento);
router.get('/portada', getPortada);
router.get('/invitacion', getInvitacionPublica);

// Ruta para subir imágenes (solo admin). Antes era pública: con el storage en
// Cloudflare R2 cualquier persona podía escribir archivos en el bucket.
router.post(
  '/upload-image',
  verificarAuth,
  rateLimit({ windowMs: 60 * 1000, max: 30, mensaje: 'Demasiadas subidas, espera un momento' }),
  uploadImage
);

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
router.post('/declinar-asistencia', declinarAsistencia);

// Álbum de fotos del evento (público)
// Los invitados suben fotos; quedan "pendiente" hasta que el admin las aprueba.
router.get('/fotos', getFotosPublicas);
router.post(
  '/fotos',
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 40,
    mensaje: 'Subiste muchas fotos seguidas, espera un momento e intenta de nuevo.',
  }),
  subirFotoPublica
);

// Analytics - Rastreo de visitantes (pública)
router.post('/track-page-view', trackPageView);

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
router.get('/admin/evento', verificarAuth, getEventoAdmin);
router.get('/admin/export-csv', verificarAuth, exportarCSV);
router.post('/admin/limpiar-pagos', verificarAuth, limpiarPagos);
router.post('/admin/test-email', verificarAuth, testEmail);
router.get('/admin/asistencias', verificarAuth, getAsistencias);
router.delete('/admin/asistencias/:id', verificarAuth, eliminarAsistencia);
router.get('/admin/analytics', verificarAuth, getAnalytics);

// Álbum de fotos (panel admin: moderación)
router.get('/admin/fotos', verificarAuth, getFotosAdmin);
router.post('/admin/fotos', verificarAuth, subirFotoAdmin);
router.put('/admin/fotos/:id', verificarAuth, actualizarEstadoFoto);
router.delete('/admin/fotos/:id', verificarAuth, eliminarFoto);

// Rutas de invitaciones (enviadas por WhatsApp con enlace único)
router.get('/admin/invitaciones', verificarAuth, getInvitaciones);
router.post('/admin/invitaciones', verificarAuth, crearInvitacion);
router.post('/admin/invitaciones/bulk', verificarAuth, crearInvitacionesMasivo);
router.put('/admin/invitaciones/:id', verificarAuth, actualizarInvitacion);
router.delete('/admin/invitaciones/:id', verificarAuth, eliminarInvitacion);
router.post('/admin/invitaciones/:id/marcar-enviada', verificarAuth, marcarEnviadaInvitacion);
// Recordatorio por WhatsApp para quienes aún no confirman (pendiente/enviada)
router.post('/admin/invitaciones/:id/recordatorio', verificarAuth, registrarRecordatorio);

// Rutas de gestión de usuarios admin
router.get('/admin-users', verificarAuth, getAllAdminUsers);
router.post('/admin-users', verificarAuth, createAdminUser);
router.put('/admin-users/:id', verificarAuth, updateAdminUser);
router.delete('/admin-users/:id', verificarAuth, deleteAdminUser);

// TODO: integrar Khipu como método de pago alternativo
// router.post('/crear-pago-khipu', crearPagoKhipu);
// router.post('/webhook-khipu', webhookKhipu);

export default router;
