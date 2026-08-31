/**
 * Script de diagnóstico - Verificar configuración de Gmail
 */

import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env manualmente
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

console.log('📋 Leyendo archivo .env...\n');
console.log('='.repeat(60));

// Buscar líneas de email en .env
const emailLines = envContent
  .split('\n')
  .filter(line => line.includes('GMAIL') || line.includes('ADMIN_EMAIL'));

emailLines.forEach(line => {
  if (!line.startsWith('#')) {
    console.log(line);
  }
});

console.log('='.repeat(60) + '\n');

// Cargar variables de entorno
dotenv.config({ path: envPath });

console.log('✅ Variables de entorno cargadas:\n');

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASS;
const adminEmail = process.env.ADMIN_EMAIL;

console.log(`GMAIL_USER: "${gmailUser}"`);
console.log(`GMAIL_PASS: "${gmailPass}"`);
console.log(`ADMIN_EMAIL: "${adminEmail}"\n`);

// Validaciones
console.log('🔍 Validaciones:\n');

if (!gmailUser) {
  console.log('❌ GMAIL_USER está vacío');
} else if (!gmailUser.includes('@')) {
  console.log('❌ GMAIL_USER no parece ser un email válido');
} else {
  console.log(`✅ GMAIL_USER válido: ${gmailUser}`);
}

if (!gmailPass) {
  console.log('❌ GMAIL_PASS está vacío');
} else {
  console.log(`✅ GMAIL_PASS tiene ${gmailPass.length} caracteres`);
  console.log(`   Sin espacios: "${gmailPass.replace(/\s+/g, '')}"`);
  console.log(`   Longitud sin espacios: ${gmailPass.replace(/\s+/g, '').length}`);
}

if (!adminEmail) {
  console.log('❌ ADMIN_EMAIL está vacío');
} else {
  console.log(`✅ ADMIN_EMAIL válido: ${adminEmail}`);
}

console.log('\n' + '='.repeat(60));
console.log('🧪 Intentando conectar a Gmail SMTP...\n');

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailPass?.replace(/\s+/g, ''), // Remover espacios
  },
  debug: true,
  logger: true,
});

console.log('📤 Configuración de transporte:');
console.log(`   Service: gmail`);
console.log(`   User: ${gmailUser}`);
console.log(`   Pass: [${gmailPass?.replace(/\s+/g, '').length} chars]`);

transporter.verify((error, success) => {
  if (error) {
    console.log('\n❌ Error de conexión:');
    console.log(`   ${error.message}`);
    if (error.code) console.log(`   Code: ${error.code}`);
    if (error.command) console.log(`   Command: ${error.command}`);
    if (error.responseCode) console.log(`   Response Code: ${error.responseCode}`);
  } else {
    console.log('\n✅ ¡Conexión exitosa! Gmail está configurado correctamente.');
  }
  process.exit(error ? 1 : 0);
});
