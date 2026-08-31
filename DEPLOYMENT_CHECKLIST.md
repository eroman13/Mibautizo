# ✅ CHECKLIST PRE-DEPLOYMENT

## 📋 Antes de hacer deploy

### Código
- [ ] Eliminar archivos `.env` del repositorio (está en `.gitignore`?)
- [ ] Verificar que no hay `console.log()` de debug
- [ ] Compilar localmente sin errores: `npm run build`
- [ ] Base de datos local está actualizada
- [ ] Migraciones están generadas

### Pruebas Locales
- [ ] Frontend: `npm run dev` funciona sin errores
- [ ] Backend: `npm run dev` funciona sin errores
- [ ] Carrito: Agregar/eliminar regalos funciona
- [ ] Checkout: Formulario valida correctamente
- [ ] Pago: Mercado Pago abre correctamente (test)
- [ ] Email: Test email se envía exitosamente
- [ ] Admin: Login funciona
- [ ] Admin: Puede crear/editar regalos
- [ ] Admin: Puede gestionar usuarios
- [ ] Imágenes: Se suben y cargan correctamente

### Base de Datos
- [ ] Migrations están commit en GitHub
- [ ] Schema.prisma está actualizado
- [ ] Seed.ts crea datos de prueba válidos
- [ ] Contraseñas admin tienen suficiente complejidad

### Seguridad
- [ ] `.env` no está en Git (usar `.env.example`)
- [ ] Database PASSWORD es fuerte (mínimo 16 caracteres)
- [ ] Admin PASSWORD es único (no "gemelas2026")
- [ ] CORS está configurado para dominio específico
- [ ] JWT/tokens tienen expiración (si aplica)
- [ ] SQL Injection: Usar Prisma (✅ ya se hace)
- [ ] XSS Protection: Sanitizar inputs (verificar React)

### Email
- [ ] GMAIL_USER es correcto
- [ ] GMAIL_PASS es contraseña de app (16 chars)
- [ ] Email templates se ven bien
- [ ] Email de prueba se envía correctamente
- [ ] Admin recibe notificaciones

### Performance
- [ ] Frontend minificado: `npm run build` produce `dist/`
- [ ] Backend compilado: `npm run build` produce `dist/`
- [ ] No hay console errors/warnings importantes
- [ ] Imágenes están optimizadas
- [ ] API response < 1s en localhost

### Mercado Pago
- [ ] Credenciales MP configuradas en `.env`
- [ ] Public key es correcta
- [ ] Webhook URL apunta a producción
- [ ] Test de pago exitoso en sandbox
- [ ] Montos calculan correctamente
- [ ] Comisiones aplican correctamente

---

## 🚀 DEPLOYMENT CHECKLIST

### Vercel (Frontend)

- [ ] Crear cuenta en Vercel
- [ ] Conectar GitHub repo
- [ ] Configurar Build Settings:
  - Root Directory: `frontend/`
  - Build Command: `npm run build`
  - Output Directory: `dist/`
- [ ] Agregar Environment Variables:
  - `VITE_API_URL=https://mibautizo-backend.onrender.com`
- [ ] Trigger deploy
- [ ] Verificar que `/` carga correctamente
- [ ] Verificar que rutas react-router funcionan
- [ ] Copiar URL: `https://mibautizo.vercel.app`

### Render (Backend)

#### PostgreSQL Database
- [ ] Crear PostgreSQL en Render
- [ ] Copiar DATABASE_URL
- [ ] Guardar credenciales seguras

#### Web Service
- [ ] Crear Web Service en Render
- [ ] Conectar GitHub repo
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm run start:prod`
- [ ] Configurar Environment Variables:
  - DATABASE_URL
  - MP_ACCESS_TOKEN
  - MP_PUBLIC_KEY
  - FRONTEND_URL (de Vercel)
  - BACKEND_URL (autogenerada)
  - GMAIL_USER
  - GMAIL_PASS
  - ADMIN_EMAIL
  - GEMELA1_NAME
  - GEMELA2_NAME
  - EVENT_DATE
  - NODE_ENV=production
- [ ] Trigger deploy
- [ ] Verificar que `/api/health` responde
- [ ] Copiar URL: `https://mibautizo-backend.onrender.com`

### Actualizar URLs en Producción
- [ ] Actualizar `FRONTEND_URL` en backend (.env de Render)
- [ ] Actualizar `VITE_API_URL` en frontend (.env de Vercel)
- [ ] Redeploy ambos servicios

### Mercado Pago Webhook
- [ ] Ir a https://www.mercadopago.com.ar/developers/panel/webhooks
- [ ] Actualizar Webhook URL a: `https://mibautizo-backend.onrender.com/api/webhook`
- [ ] Configurar tipos de notificaciones: `payment`
- [ ] Probar webhook con "Send test"

---

## 🧪 PRUEBAS EN PRODUCCIÓN

### Test Completo End-to-End
1. [ ] Ir a `https://mibautizo.vercel.app`
2. [ ] Home carga correctamente
3. [ ] Puedo ver todos los regalos
4. [ ] Agrego un regalo al carrito
5. [ ] Carrito muestra cantidad correcta
6. [ ] Hago checkout
7. [ ] Formulario valida campos
8. [ ] Creo preferencia en Mercado Pago
9. [ ] Mercado Pago abre correctamente
10. [ ] Pago con tarjeta de prueba (4111 1111 1111 1111)
11. [ ] Recibo confirmación de pago
12. [ ] Email de confirmación llega en mi inbox
13. [ ] Admin puede ver la contribución

### Test de Admin
1. [ ] Login con credenciales admin
2. [ ] Dashboard muestra estadísticas
3. [ ] Puedo ver todas las contribuciones
4. [ ] Puedo crear nuevo regalo
5. [ ] Puedo editar regalo
6. [ ] Puedo subir imagen a regalo
7. [ ] Puedo ver usuarios admin
8. [ ] Puedo crear nuevo usuario admin
9. [ ] Puedo editar usuario admin
10. [ ] Puedo eliminar usuario admin

### Test Mobile
1. [ ] Abrir en iPhone/Android
2. [ ] Responsive design funciona
3. [ ] Carrito flotante visible
4. [ ] Botones tienen buen tamaño
5. [ ] Checkout forma se ve bien
6. [ ] Imágenes se cargan correctamente

### Test de Seguridad Básico
1. [ ] No puedo acceder a `/admin` sin login
2. [ ] Token no es visible en URL
3. [ ] Database URL no está en HTML
4. [ ] API keys no están en frontend code

---

## 📞 Si Algo Falla

### Error: "Build failed on Vercel"
- Revisar logs en Vercel Dashboard
- Asegurar que `frontend/package.json` tiene `"build": "vite build"`
- Verificar que `.env.example` tiene todas las variables necesarias

### Error: "Backend won't start"
- Revisar logs en Render Dashboard
- Ejecutar localmente: `npm run start:prod`
- Verificar DATABASE_URL está correcta
- Ejecutar: `npm run migrate:deploy`

### Error: "API calls return 404"
- Verificar `VITE_API_URL` está correcto en Vercel
- Verificar CORS en backend está configurado
- Revisar Network tab en Chrome DevTools

### Error: "Database queries fail"
- Verificar DATABASE_URL en Render
- Conectarse manualmente: `psql $DATABASE_URL`
- Ejecutar migraciones: `npm run migrate:deploy`

### Error: "Emails no se envían"
- Verificar GMAIL_USER y GMAIL_PASS en Render
- Chequear que contraseña de app es de 16 caracteres
- Ver logs en Render: "tail -f /render.log"

---

## ✅ LANZAMIENTO EXITOSO

Cuando todo funcione:
- [ ] Frontend accessible en dominio
- [ ] Backend API respondiendo
- [ ] Pagos procesándose en Mercado Pago
- [ ] Emails llegando a invitados
- [ ] Admin panel funcionando
- [ ] Mobile responsive
- [ ] Imágenes cargando correctamente

🎉 **¡Listo para invitar a los regalos!**
