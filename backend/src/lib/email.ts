/**
 * Servicio de envío de correos electrónicos
 * Usa Nodemailer con SMTP de Gmail
 */

import nodemailer from 'nodemailer';

// Obtener configuración del entorno
const gmailUser = process.env.GMAIL_USER?.trim();
const gmailPass = process.env.GMAIL_PASS?.trim().replace(/\s+/g, ''); // Remover espacios
const isTestMode = process.env.GMAIL_TEST === 'true';

// Validar configuración
if (!gmailUser || !gmailPass) {
  console.warn('⚠️ Configuración de email incompleta. GMAIL_USER o GMAIL_PASS no configurados.');
  console.warn('   Los correos NO se enviarán hasta que se configure correctamente.');
}

// Configurar transporte de email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser || 'placeholder@gmail.com',
    pass: gmailPass || 'placeholder',
  },
});

// Test de conexión al iniciar (solo en desarrollo, sin bloquear)
if (gmailUser && gmailPass && process.env.NODE_ENV !== 'production') {
  transporter.verify((error) => {
    if (error) {
      console.error('❌ Error verificando configuración de Gmail:', error.message);
    } else {
      console.log('✅ Configuración de Gmail verificada correctamente');
    }
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
    const resultado = await transporter.sendMail({
      from: gmailUser || 'tu-email@gmail.com',
      to: para,
      subject: `✅ Confirmación de regalo para ${nombreGemelas} y ${nombreGemela2}`,
      html,
    });

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

    const resultado = await transporter.sendMail({
      from: gmailUser || 'tu-email@gmail.com',
      to: para,
      subject: `✅ Nuevo regalo: $${totalCLP.toLocaleString('es-CL')} CLP de ${nombreInvitado}`,
      html,
    });

    console.log('✅ Notificación enviada al admin:', resultado.messageId);
    return { success: true, messageId: resultado.messageId };
  } catch (error: any) {
    console.error('❌ Error al enviar notificación al admin:', error.message);
    console.error('   Código:', error.code);
    return { success: false, error };
  }
}
