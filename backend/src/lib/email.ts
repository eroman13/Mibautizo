/**
 * Servicio de envío de correos electrónicos
 * Usa Nodemailer con SMTP de Gmail
 */

import nodemailer from 'nodemailer';
import dns from 'node:dns';

// Railway no tiene salida IPv6: si nodemailer resuelve smtp.gmail.com a una
// dirección IPv6, la conexión falla con ENETUNREACH/ETIMEDOUT. Nodemailer v9
// elige una dirección AL AZAR entre las IPv4/IPv6 resueltas, por lo que
// `dns.setDefaultResultOrder('ipv4first')` NO basta. Resolvemos una IP IPv4
// explícita y la usamos como host (con `servername` para el certificado TLS).
dns.setDefaultResultOrder('ipv4first');

const SMTP_HOSTNAME = 'smtp.gmail.com';

// Obtener configuración del entorno
// Aceptar ambos nombres de variables (GMAIL_* y MAIL_*) por compatibilidad
// con la documentación del proyecto y la configuración existente en Railway.
const gmailUser = (process.env.GMAIL_USER || process.env.MAIL_USER || '').trim();
const gmailPass = (process.env.GMAIL_PASS || process.env.MAIL_PASS || '')
  .trim()
  .replace(/\s+/g, ''); // Remover espacios
const isTestMode = process.env.GMAIL_TEST === 'true';

// Validar configuración
if (!gmailUser || !gmailPass) {
  console.warn('⚠️ Configuración de email incompleta. GMAIL_USER o GMAIL_PASS no configurados.');
  console.warn('   Los correos NO se enviarán hasta que se configure correctamente.');
}

// Resolver la IPv4 de Gmail de forma perezosa y cacheada. Si la resolución
// falla, se usa el hostname (comportamiento anterior).
let smtpIpv4: string | null = null;
let smtpIpv4Promise: Promise<string> | null = null;

function getSmtpHost(): Promise<string> {
  if (smtpIpv4) return Promise.resolve(smtpIpv4);
  if (!smtpIpv4Promise) {
    smtpIpv4Promise = dns.promises
      .resolve4(SMTP_HOSTNAME)
      .then((addrs) => {
        smtpIpv4 = addrs && addrs.length ? addrs[0] : SMTP_HOSTNAME;
        return smtpIpv4;
      })
      .catch((error) => {
        console.warn('⚠️ No se pudo resolver IPv4 de smtp.gmail.com:', error.message);
        smtpIpv4 = SMTP_HOSTNAME;
        return SMTP_HOSTNAME;
      });
  }
  return smtpIpv4Promise;
}

// Crear transporte de email.
// Se usa smtp.gmail.com:587 con STARTTLS (secure:false) porque el puerto 465
// (SSL) dio "Connection timeout" (ETIMEDOUT) desde Railway. Los timeouts se
// amplían y el envío se reintenta para tolerar fallos transitorios de red.
// `host` se pasa como IP IPv4 (cuando se resuelve) para evitar que nodemailer
// elija una IPv6 sin salida en Railway. `servername` conserva el nombre de
// dominio para el SNI y la validación del certificado TLS.
function crearTransporter(host: string) {
  return nodemailer.createTransport({
    host,
    port: 587,
    secure: false, // STARTTLS
    requireTLS: true,
    servername: SMTP_HOSTNAME,
    auth: {
      user: gmailUser || 'placeholder@gmail.com',
      pass: gmailPass || 'placeholder',
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  });
}

/**
 * Envía un correo con reintentos automáticos (hasta 3 intentos).
 * Gmail desde Railway puede fallar con "Connection timeout" de forma transitoria.
 */
async function enviarConReintentos(mailOptions: any) {
  // Resolver IPv4 antes de crear el transporte para evitar IPv6 en Railway
  const host = await getSmtpHost();
  const transporter = crearTransporter(host);

  let lastError: any;
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const resultado = await transporter.sendMail(mailOptions);
      return { success: true, messageId: resultado.messageId };
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Intento ${intento}/3 de envío falló:`, (error as any).message);
      if (intento < 3) {
        // Esperar 3s, luego 6s entre reintentos
        await new Promise((r) => setTimeout(r, 3000 * intento));
      }
    }
  }
  return { success: false, error: lastError };
}

// Test de conexión al iniciar (solo en desarrollo, sin bloquear)
if (gmailUser && gmailPass && process.env.NODE_ENV !== 'production') {
  getSmtpHost().then((host) => {
    crearTransporter(host).verify((error) => {
      if (error) {
        console.error('❌ Error verificando configuración de Gmail:', error.message);
      } else {
        console.log('✅ Configuración de Gmail verificada correctamente');
      }
    });
  });
}

/**
 * Enviar correo de confirmación de regalo
 */
export async function enviarConfirmacionRegalo({
  para,
  nombreInvitado,
  regalos,
  totalCLP,
  dedicatoria,
}: {
  para: string;
  nombreInvitado: string;
  regalos: Array<{ nombre: string; cantidad: number; precio: number }>;
  totalCLP: number;
  dedicatoria?: string;
}) {
  if (!gmailUser || !gmailPass) {
    console.warn(
      `⚠️ Confirmación NO enviada a ${para}: credenciales de email no configuradas (GMAIL_USER/GMAIL_PASS o MAIL_USER/MAIL_PASS).`
    );
    return { success: false, error: new Error('Credenciales de email no configuradas') };
  }

  try {
    const nombreGemelas = process.env.GEMELA1_NAME || 'Antonia';
    const nombreGemela2 = process.env.GEMELA2_NAME || 'Emilia';
    const fechaBautizo = process.env.EVENT_DATE || '15 de septiembre';

    // Generar HTML del correo
    const regalosHTML = regalos
      .map(
        (r) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${r.nombre}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${r.cantidad}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${r.precio.toLocaleString(
          'es-CL'
        )}</td>
      </tr>
    `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FFB6C1 0%, #DDA0DD 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 5px 0 0 0; opacity: 0.9; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .regalo-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .regalo-table th { background: #f0f0f0; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold; }
          .total { font-size: 20px; font-weight: bold; color: #FFB6C1; text-align: right; padding: 15px; }
          .dedicatoria { background: #fff3e0; padding: 15px; border-left: 4px solid #FFB6C1; margin: 15px 0; border-radius: 4px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
          .btn { display: inline-block; padding: 12px 30px; background: #FFB6C1; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 ¡Gracias por tu regalo! 💝</h1>
            <p>Confirmación de contribución al bautizo de ${nombreGemelas} y ${nombreGemela2}</p>
          </div>

          <div class="content">
            <h2>Hola ${nombreInvitado},</h2>
            
            <p>Recibimos tu contribución con éxito. Estos son los detalles de tu aporte:</p>

            <table class="regalo-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style="text-align: center;">Cantidad</th>
                  <th style="text-align: right;">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${regalosHTML}
              </tbody>
            </table>

            <div class="total">
              Total: $${totalCLP.toLocaleString('es-CL')} CLP
            </div>

            ${
              dedicatoria
                ? `
            <div class="dedicatoria">
              <strong>Tu dedicatoria:</strong><br>
              <em>"${dedicatoria}"</em>
            </div>
            `
                : ''
            }

            <p>✨ Tu regalo es parte de nuestro especial día. ¡Gracias por ser parte de esta celebración!</p>

            <p>
              <strong>Detalles del evento:</strong><br>
              📅 ${fechaBautizo}<br>
              👶 Bautizo de ${nombreGemelas} y ${nombreGemela2}
            </p>
          </div>

          <div class="footer">
            <p>Este es un correo automático. Por favor no responder a este mensaje.</p>
            <p>Bautizo de las Gemelas 💝 - Mesa de Regalos</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar correo
    const resultado = await enviarConReintentos({
      from: gmailUser || 'tu-email@gmail.com',
      to: para,
      subject: `✅ Confirmación de regalo para ${nombreGemelas} y ${nombreGemela2}`,
      html,
    });

    if (!resultado.success) {
      console.error('❌ Error al enviar correo después de 3 intentos:', (resultado.error as Error)?.message);
      return { success: false, error: resultado.error };
    }

    console.log('✅ Correo enviado:', resultado.messageId);
    return { success: true, messageId: resultado.messageId };
  } catch (error: any) {
    console.error('❌ Error al enviar correo:', error.message);
    console.error('   Código:', error.code);
    console.error('   Response:', error.response);
    return { success: false, error };
  }
}

/**
 * Enviar correo al administrador notificando nuevo pago
 */
export async function enviarNotificacionAlAdmin({
  para,
  nombreInvitado,
  emailInvitado,
  regalos,
  totalCLP,
}: {
  para: string;
  nombreInvitado: string;
  emailInvitado: string;
  regalos: Array<{ nombre: string; cantidad: number }>;
  totalCLP: number;
}) {
  if (!gmailUser || !gmailPass) {
    console.warn(
      '⚠️ Notificación al admin NO enviada: credenciales de email no configuradas (GMAIL_USER/GMAIL_PASS o MAIL_USER/MAIL_PASS).'
    );
    return { success: false, error: new Error('Credenciales de email no configuradas') };
  }

  try {
    const nombreGemelas = process.env.GEMELA1_NAME || 'Antonia';
    const nombreGemela2 = process.env.GEMELA2_NAME || 'Emilia';

    const regalosHTML = regalos
      .map((r) => `<li>${r.nombre} (x${r.cantidad})</li>`)
      .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="alert">
            <h2>🎉 Nuevo regalo recibido para ${nombreGemelas} y ${nombreGemela2}</h2>
            
            <p><strong>De:</strong> ${nombreInvitado} (${emailInvitado})</p>
            <p><strong>Monto:</strong> $${totalCLP.toLocaleString('es-CL')} CLP</p>
            
            <p><strong>Regalos:</strong></p>
            <ul>
              ${regalosHTML}
            </ul>
            
            <p><em>Este es un correo automático de notificación.</em></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const resultado = await enviarConReintentos({
      from: gmailUser || 'tu-email@gmail.com',
      to: para,
      subject: `✅ Nuevo regalo: $${totalCLP.toLocaleString('es-CL')} CLP de ${nombreInvitado}`,
      html,
    });

    if (!resultado.success) {
      console.error('❌ Error al enviar notificación al admin después de 3 intentos:', (resultado.error as Error)?.message);
      return { success: false, error: resultado.error };
    }

    console.log('✅ Notificación enviada al admin:', resultado.messageId);
    return { success: true, messageId: resultado.messageId };
  } catch (error: any) {
    console.error('❌ Error al enviar notificación al admin:', error.message);
    console.error('   Código:', error.code);
    return { success: false, error };
  }
}
