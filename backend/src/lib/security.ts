/**
 * Utilidades de seguridad del backend
 * - Tokens de sesión firmados con HMAC-SHA256 (sin dependencias externas)
 * - Rate limiting en memoria (sin dependencias externas)
 * - Headers de seguridad básicos
 */

import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Tokens de sesión firmados (stateless)
// ---------------------------------------------------------------------------

// Secreto para firmar tokens. En producción DEBE venir del entorno.
const SECRET =
  process.env.SESSION_SECRET ||
  process.env.ADMIN_TOKEN_SECRET ||
  crypto.randomBytes(32).toString('hex');

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET && !process.env.ADMIN_TOKEN_SECRET) {
  console.warn('⚠️ SESSION_SECRET no configurado: los tokens se firman con un secreto efímero.');
  console.warn('   Todos los admin deberán volver a iniciar sesión tras cada reinicio.');
}

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 horas

interface TokenPayload {
  sub: number; // id del usuario admin
  username: string;
  exp: number; // expiración (ms)
}

function toBase64Url(text: string): string {
  return Buffer.from(text, 'utf8').toString('base64url');
}

function fromBase64Url(text: string): string {
  return Buffer.from(text, 'base64url').toString('utf8');
}

function firma(payloadB64: string): string {
  return crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
}

/** Crea un token de sesión firmado para un usuario admin. */
export function firmarToken(user: { id: number; username: string }): string {
  const payload: TokenPayload = {
    sub: user.id,
    username: user.username,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  return `${payloadB64}.${firma(payloadB64)}`;
}

/** Verifica un token y devuelve el payload o null si es inválido/expirado. */
export function verificarToken(token: string): TokenPayload | null {
  try {
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return null;

    const sigEsperada = firma(payloadB64);
    const sigBuffer = Buffer.from(sig);
    const esperadaBuffer = Buffer.from(sigEsperada);
    if (sigBuffer.length !== esperadaBuffer.length || !crypto.timingSafeEqual(sigBuffer, esperadaBuffer)) {
      return null;
    }

    const payload = JSON.parse(fromBase64Url(payloadB64)) as TokenPayload;
    if (!payload.sub || !payload.exp || payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

/** Middleware: exige header Authorization: Bearer <token> válido. */
export function verificarAuthAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }
  const payload = verificarToken(match[1]);
  if (!payload) {
    return res.status(401).json({ success: false, error: 'Sesión inválida o expirada' });
  }
  // Adjuntar el usuario autenticado para uso posterior si hace falta
  (req as any).admin = payload;
  next();
}

// ---------------------------------------------------------------------------
// Rate limiting en memoria (por IP)
// ---------------------------------------------------------------------------

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Limpieza periódica para no acumular memoria
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 60 * 1000).unref();

function ipDe(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/** Crea un middleware de rate limit por IP. */
export function rateLimit(opciones: { windowMs: number; max: number; mensaje: string }) {
  const { windowMs, max, mensaje } = opciones;
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${ipDe(req)}`;
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count++;
    if (bucket.count > max) {
      return res.status(429).json({ success: false, error: mensaje });
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// Headers de seguridad
// ---------------------------------------------------------------------------

export function securityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-XSS-Protection', '0'); // CSP es la protección real; esto evita comportamiento legacy inseguro
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  };
}

export default { firmarToken, verificarToken, verificarAuthAdmin, rateLimit, securityHeaders };