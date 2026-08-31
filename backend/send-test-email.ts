import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function sendTestEmail() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS?.replace(/\s+/g, ''),
    },
  });

  console.log('📧 Enviando email de prueba...');
  console.log(`📤 De: ${process.env.GMAIL_USER}`);
  console.log(`📬 Para: ${process.env.GMAIL_USER}\n`);

  const result = await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER,
    subject: '🎉 Prueba - Sistema de Emails Mesa de Regalos',
    html: `
      <h2>Prueba de Sistema de Emails</h2>
      <p>Si recibes este email, ¡los correos están funcionando! 🎉</p>
      <p><strong>Datos de prueba:</strong></p>
      <ul>
        <li>Usuario: ${process.env.GMAIL_USER}</li>
        <li>Fecha: ${new Date().toLocaleString('es-CL')}</li>
      </ul>
      <p>Este es un email de prueba del sistema de confirmación de regalos.</p>
    `,
  });

  console.log('✅ ¡Email enviado exitosamente!');
  console.log(`   Message ID: ${result.messageId}`);
  console.log('📨 Revisa tu bandeja de entrada para confirmarlo');
}

sendTestEmail().catch(error => {
  console.error('❌ Error:', error.message);
  if (error.code) console.error(`   Code: ${error.code}`);
  process.exit(1);
});
