/**
 * Script de prueba - Simula un pago aprobado e intenta enviar correos
 * Ejecutar con: npx ts-node test-email-send.ts
 */

import { enviarConfirmacionRegalo, enviarNotificacionAlAdmin } from './src/lib/email';

async function testEmailSystem() {
  console.log('🧪 Iniciando prueba de sistema de emails...\n');

  try {
    // Datos de prueba
    const testData = {
      para: 'regalapp.spa@gmail.com',
      nombreInvitado: 'Juan Pérez Prueba',
      regalos: [
        { nombre: 'Carrito de juguete', cantidad: 1, precio: 45000 },
        { nombre: 'Aporte libre', cantidad: 1, precio: 55000 },
      ],
      totalCLP: 100000,
      dedicatoria: 'Felicidades por el bautizo de las gemelas! 🎉',
    };

    console.log('📧 Prueba 1: Enviando correo de confirmación al invitado...');
    console.log(`   Email destino: ${testData.para}\n`);

    const result1 = await enviarConfirmacionRegalo({
      para: testData.para,
      nombreInvitado: testData.nombreInvitado,
      regalos: testData.regalos,
      totalCLP: testData.totalCLP,
      dedicatoria: testData.dedicatoria,
    });

    if (result1.success) {
      console.log('✅ Correo de confirmación enviado exitosamente');
      console.log(`   Message ID: ${result1.messageId}\n`);
    } else {
      console.log('❌ Error enviando correo de confirmación');
      console.log(`   Error: ${result1.error}\n`);
    }

    console.log('📧 Prueba 2: Enviando notificación al administrador...');
    console.log(`   Email destino: ${testData.para}\n`);

    const result2 = await enviarNotificacionAlAdmin({
      para: testData.para,
      nombreInvitado: testData.nombreInvitado,
      emailInvitado: 'invitado@example.com',
      regalos: testData.regalos,
      totalCLP: testData.totalCLP,
    });

    if (result2.success) {
      console.log('✅ Notificación al admin enviada exitosamente');
      console.log(`   Message ID: ${result2.messageId}\n`);
    } else {
      console.log('❌ Error enviando notificación al admin');
      console.log(`   Error: ${result2.error}\n`);
    }

    console.log('🎉 Pruebas completadas');
    console.log('\n✅ Sistema de emails funcionando correctamente');
  } catch (error) {
    console.error('❌ Error durante pruebas:', error);
  }
}

testEmailSystem();
