/**
 * Auto-seed idempotente: al arrancar el servidor, verifica si la base
 * de datos está vacía y, si es así, la puebla con los datos iniciales
 * (evento, regalos y usuario admin). NO duplica datos si ya existen.
 */

import prisma from './prisma';
import bcrypt from 'bcryptjs';

export async function autoSeedIfEmpty() {
  try {
    console.log('🌱 Verificando si la base de datos necesita seed...');

    // Si ya existe un evento, la BD ya fue sembrada. No hacer nada.
    const existingEvent = await prisma.event.findFirst();
    if (existingEvent) {
      console.log('✅ La base de datos ya contiene datos. Seed omitido.');

      // Backfill: si el campo lugarRecepcion es nuevo (null), establecer el
      // lugar de recepción por defecto una sola vez. Si luego se vacía en el
      // panel admin (''), este backfill ya no se vuelve a aplicar.
      if (existingEvent.lugarRecepcion === null) {
        await prisma.event.update({
          where: { id: existingEvent.id },
          data: {
            lugarRecepcion: 'Centro de Evento Miriam Roman',
            wazeUrlRecepcion: 'https://waze.com/ul?ll=-34.3530487,-71.0180287&navigate=yes',
          },
        });
        console.log('✅ Lugar y Waze de la recepción por defecto aplicados');
      }
      return;
    }

    console.log('🌱 Base de datos vacía. Ejecutando seed automático...');

    // 1. Crear configuración del evento
    await prisma.event.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nombreGemela1: 'Antonia',
        nombreGemela2: 'Emilia',
        fecha: '2026-09-15',
        hora: '16:00',
        lugar: 'Parroquia San Francisco, Santiago',
        lugarRecepcion: 'Centro de Evento Miriam Roman',
        wazeUrlRecepcion: 'https://waze.com/ul?ll=-34.3530487,-71.0180287&navigate=yes',
        mensajeBienvenida: '¡Bienvenidos a la celebración del bautizo de nuestras hermosas gemelas! 🎀✨\n\nNos llena de alegría poder compartir este día tan especial con ustedes. Su presencia es el mejor regalo, pero si desean hacernos un presente, hemos preparado esta lista de deseos para las pequeñas.\n\nCada aporte nos ayudará a darles lo mejor a Antonia y Emilia en sus primeros meses de vida.\n\n¡Gracias por ser parte de este momento único! 💝',
        portadaUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1200',
        modoComision: 'A',
      },
    });
    console.log('✅ Evento creado');

    // 2. Crear catálogo de regalos (solo si no hay regalos)
    const giftCount = await prisma.gift.count();
    if (giftCount === 0) {
      const regalos = [
        { nombre: 'Pack de 4 bodies de algodón', descripcion: '2 bodies para cada gemela, 100% algodón suave, tallas 3-6 meses', precioCLP: 18000, imagenUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600', permiteColaborativo: false },
        { nombre: 'Coche doble para gemelas', descripcion: 'Coche gemelar liviano, con capota ajustable y frenos de seguridad', precioCLP: 180000, imagenUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600', permiteColaborativo: true },
        { nombre: '2 mantitas de apego', descripcion: 'Mantitas suaves para cada bebé, ideales para acompañar sus siestas', precioCLP: 25000, imagenUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600', permiteColaborativo: false },
        { nombre: 'Set de mudador + pañales', descripcion: 'Mudador portátil y pack de pañales para el primer mes', precioCLP: 30000, imagenUrl: 'https://images.unsplash.com/photo-1584461503167-f3b2a6fcfe3f?w=600', permiteColaborativo: false },
        { nombre: '2 mamaderas anticólicos', descripcion: 'Kit de 4 mamaderas (2 para cada gemela) con sistema anticólicos', precioCLP: 22000, imagenUrl: 'https://images.unsplash.com/photo-1587735243474-306e9e1c3c6c?w=600', permiteColaborativo: false },
        { nombre: 'Cuna colecho', descripcion: 'Cuna que se acopla a la cama de los papás, ideal para lactancia', precioCLP: 120000, imagenUrl: 'https://images.unsplash.com/photo-1580853039489-31d94815e235?w=600', permiteColaborativo: true },
        { nombre: 'Pack de 4 pijamas de invierno', descripcion: '2 pijamas para cada gemela, abrigaditos para el invierno', precioCLP: 28000, imagenUrl: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600', permiteColaborativo: false },
        { nombre: 'Bañera para bebé', descripcion: 'Bañera ergonómica con soporte antideslizante', precioCLP: 35000, imagenUrl: 'https://images.unsplash.com/photo-1625992789921-b36e14e66bbe?w=600', permiteColaborativo: false },
        { nombre: '2 peluches de regalo', descripcion: 'Ositos de peluche suaves, uno para cada gemela', precioCLP: 20000, imagenUrl: 'https://images.unsplash.com/photo-1530325553241-4f6e7690cf36?w=600', permiteColaborativo: false },
        { nombre: 'Monitor de bebé con cámara', descripcion: 'Monitor con video, visión nocturna y detección de movimiento', precioCLP: 85000, imagenUrl: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=600', permiteColaborativo: true },
        { nombre: 'Aporte libre para las gemelas', descripcion: 'El monto que tú elijas para ayudarnos con lo que las pequeñas necesiten 💝', precioCLP: 0, imagenUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600', permiteColaborativo: true },
      ];

      for (const regalo of regalos) {
        await prisma.gift.create({ data: regalo });
      }
      console.log(`✅ ${regalos.length} regalos creados`);
    } else {
      console.log('✅ Regalos ya existentes. Omitido.');
    }

    // 3. Crear usuario admin inicial (si no existe)
    const existingAdmin = await prisma.adminUser.findUnique({ where: { username: 'admin' } });
    if (!existingAdmin) {
      const adminPassword = await bcrypt.hash('gemelas2026', 10);
      await prisma.adminUser.create({
        data: {
          username: 'admin',
          password: adminPassword,
          nombre: 'Administrador',
          email: 'admin@bautizo.local',
          activo: true,
        },
      });
      console.log('✅ Usuario admin creado (username: admin)');
    } else {
      console.log('✅ Usuario admin ya existente. Omitido.');
    }

    console.log('🎉 Auto-seed completado exitosamente');
  } catch (error) {
    // NO crashear el servidor si el seed falla (ej: BD no disponible aún)
    console.error('⚠️ Error en auto-seed (el servidor seguirá arrancando):');
    console.error('   ', error instanceof Error ? error.message : error);
  }
}
