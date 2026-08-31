/**
 * Configuración del cliente de Mercado Pago
 * Inicializa el SDK con el Access Token del backend
 */

import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

// Validar que el Access Token esté configurado
const accessToken = process.env.MP_ACCESS_TOKEN;
if (!accessToken) {
  throw new Error('❌ MP_ACCESS_TOKEN no está configurado en el archivo .env');
}

// Inicializar cliente de Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: accessToken,
  options: {
    timeout: 5000,
  }
});

// Exportar servicios de Mercado Pago
export const preferenceClient = new Preference(client);
export const paymentClient = new Payment(client);

// Configuración de comisión (desde .env)
export const COMMISSION_RATE = parseFloat(process.env.MP_COMMISSION_RATE || '0.038');

console.log('✅ Mercado Pago configurado correctamente');
console.log(`📊 Tasa de comisión: ${(COMMISSION_RATE * 100).toFixed(2)}%`);
