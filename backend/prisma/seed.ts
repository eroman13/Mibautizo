/**
 * Seed para poblar la base de datos con datos iniciales
 * Incluye: configuración del evento y regalos de ejemplo para gemelas
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // 1. Crear configuración del evento
  console.log('📝 Creando configuración del evento...');
  const event = await prisma.event.upsert({
    where: { id: 1 },
    update: {
      nombreGemela1: 'Antonia',
      nombreGemela2: 'Emilia',
      mensajeBienvenida: '¡Bienvenidos a la celebración del bautizo de nuestras hermosas gemelas! 🎀✨\n\nNos llena de alegría poder compartir este día tan especial con ustedes. Su presencia es el mejor regalo, pero si desean hacernos un presente, hemos preparado esta lista de deseos para las pequeñas.\n\nCada aporte nos ayudará a darles lo mejor a Antonia y Emilia en sus primeros meses de vida.\n\n¡Gracias por ser parte de este momento único! 💝',
    },
    create: {
      nombreGemela1: 'Antonia',
      nombreGemela2: 'Emilia',
      fecha: '2026-10-10',
      hora: '16:00',
      lugar: 'Parroquia San Francisco, Santiago',
      mensajeBienvenida: '¡Bienvenidos a la celebración del bautizo de nuestras hermosas gemelas! 🎀✨\n\nNos llena de alegría poder compartir este día tan especial con ustedes. Su presencia es el mejor regalo, pero si desean hacernos un presente, hemos preparado esta lista de deseos para las pequeñas.\n\nCada aporte nos ayudará a darles lo mejor a Antonia y Emilia en sus primeros meses de vida.\n\n¡Gracias por ser parte de este momento único! 💝',
      portadaUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1200',
      modoComision: 'A', // Por defecto, el invitado cubre la comisión
    },
  });

  console.log(`✅ Evento creado: Bautizo de ${event.nombreGemela1} y ${event.nombreGemela2}`);

  // 2. Crear regalos de ejemplo para gemelas
  console.log('🎁 Creando catálogo de regalos...');

  const regalos = [
    {
      nombre: 'Pack de 4 bodies de algodón',
      descripcion: '2 bodies para cada gemela, 100% algodón suave, tallas 3-6 meses',
      precioCLP: 18000,
      imagenUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600',
      permiteColaborativo: false,
    },
    {
      nombre: 'Coche doble para gemelas',
      descripcion: 'Coche gemelar liviano, con capota ajustable y frenos de seguridad',
      precioCLP: 180000,
      imagenUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600',
      permiteColaborativo: true,
    },
    {
      nombre: '2 mantitas de apego',
      descripcion: 'Mantitas suaves para cada bebé, ideales para acompañar sus siestas',
      precioCLP: 25000,
      imagenUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600',
      permiteColaborativo: false,
    },
    {
      nombre: 'Set de mudador + pañales',
      descripcion: 'Mudador portátil y pack de pañales para el primer mes',
      precioCLP: 30000,
      imagenUrl: 'https://images.unsplash.com/photo-1584461503167-f3b2a6fcfe3f?w=600',
      permiteColaborativo: false,
    },
    {
      nombre: '2 mamaderas anticólicos',
      descripcion: 'Kit de 4 mamaderas (2 para cada gemela) con sistema anticólicos',
      precioCLP: 22000,
      imagenUrl: 'https://images.unsplash.com/photo-1587735243474-306e9e1c3c6c?w=600',
      permiteColaborativo: false,
    },
    {
      nombre: 'Cuna colecho',
      descripcion: 'Cuna que se acopla a la cama de los papás, ideal para lactancia',
      precioCLP: 120000,
      imagenUrl: 'https://images.unsplash.com/photo-1580853039489-31d94815e235?w=600',
      permiteColaborativo: true,
    },
    {
      nombre: 'Pack de 4 pijamas de invierno',
      descripcion: '2 pijamas para cada gemela, abrigaditos para el invierno',
      precioCLP: 28000,
      imagenUrl: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600',
      permiteColaborativo: false,
    },
    {
      nombre: 'Bañera para bebé',
      descripcion: 'Bañera ergonómica con soporte antideslizante',
      precioCLP: 35000,
      imagenUrl: 'https://images.unsplash.com/photo-1625992789921-b36e14e66bbe?w=600',
      permiteColaborativo: false,
    },
    {
      nombre: '2 peluches de regalo',
      descripcion: 'Ositos de peluche suaves, uno para cada gemela',
      precioCLP: 20000,
      imagenUrl: 'https://images.unsplash.com/photo-1530325553241-4f6e7690cf36?w=600',
      permiteColaborativo: false,
    },
    {
      nombre: 'Monitor de bebé con cámara',
      descripcion: 'Monitor con video, visión nocturna y detección de movimiento',
      precioCLP: 85000,
      imagenUrl: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=600',
      permiteColaborativo: true,
    },
    {
      nombre: 'Aporte libre para las gemelas',
      descripcion: 'El monto que tú elijas para ayudarnos con lo que las pequeñas necesiten 💝',
      precioCLP: 0, // Se usará como "monto libre"
      imagenUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600',
      permiteColaborativo: true,
    },
  ];

  for (const regalo of regalos) {
    await prisma.gift.create({
      data: regalo,
    });
  }

  console.log(`✅ ${regalos.length} regalos creados en el catálogo`);

  // 3. Crear usuarios admin iniciales
  console.log('👤 Creando usuarios administradores...');
  // Contraseña inicial: ADMIN_PASSWORD del entorno o una aleatoria. Nunca una fija conocida.
  const passwordPlano =
    process.env.ADMIN_PASSWORD?.trim() ||
    `Cambiar-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const adminPassword = await bcrypt.hash(passwordPlano, 10);

  const adminUser = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      nombre: 'Administrador',
      email: 'admin@bautizo.local',
      activo: true,
    },
  });

  console.log(`✅ Usuario admin creado: ${adminUser.username}`);
  console.log(`   Contraseña inicial: ${passwordPlano}`);
  console.log('   ⚠️ CÁMBIALA de inmediato desde el panel (👥 Usuarios) tras el primer ingreso.');

  console.log('\n🎉 ¡Seed completado exitosamente!');
  console.log('\n📊 Resumen:');
  console.log(`   - 1 evento configurado`);
  console.log(`   - ${regalos.length} regalos en el catálogo`);
  console.log(`   - ${regalos.filter(r => r.permiteColaborativo).length} regalos colaborativos`);
  console.log(`   - 1 usuario admin (username: admin)`);
  console.log('\n💡 Tip: Puedes ver los datos en Prisma Studio con: npm run prisma:studio\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error en el seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
