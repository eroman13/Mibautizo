# 🚀 GUÍA RÁPIDA: Deploy en 5 Pasos

## Antes de Empezar
- ✅ Código completado y probado localmente
- ✅ GitHub repo con todos los cambios
- ✅ Credenciales de Mercado Pago
- ✅ Gmail configurado

---

## PASO 1️⃣: Deploy Frontend en Vercel (5 min)

1. Ir a: https://vercel.com/sign-up
2. Click "Continue with GitHub"
3. Buscar repo "Mibautizo"
4. Click "Import"
5. En Settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Click "Deploy"
7. **COPIAR URL**: Se verá como `https://mibautizo-xyz.vercel.app`

✅ Frontend estará en línea en ~2 minutos

---

## PASO 2️⃣: Crear Base de Datos en Render (3 min)

1. Ir a: https://render.com (sign up con GitHub)
2. Dashboard → **New** → **PostgreSQL**
3. Configurar:
   - **Name**: `mibautizo-db`
   - **Region**: Santiago
   - **Plan**: Free
4. Click "Create Database"
5. **COPIAR**: La URL de conexión completa (DATABASE_URL)
   - Guardará en: https://render.com/docs/databases

✅ Base de datos lista en ~1 minuto

---

## PASO 3️⃣: Deploy Backend en Render (5 min)

1. En Render Dashboard → **New** → **Web Service**
2. Conectar GitHub repo "Mibautizo"
3. Configurar:
   - **Name**: `mibautizo-backend`
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start:prod`
4. Scroll down → **Environment**
5. Agregar estas variables:

```
DATABASE_URL=(copiar de paso anterior)
MP_ACCESS_TOKEN=APP_USR-6032208155105752-010810-61dba3eba0dd04d9fe6834080b8e4141-3120378089
MP_PUBLIC_KEY=APP_USR-d437a4b4-5235-4190-a083-326bf35e3c9d
FRONTEND_URL=https://mibautizo-xyz.vercel.app (de PASO 1)
NODE_ENV=production
GMAIL_USER=regalapp.spa@gmail.com
GMAIL_PASS=einzwdfqiwcojgew
ADMIN_EMAIL=regalapp.spa@gmail.com
GEMELA1_NAME=Antonia
GEMELA2_NAME=Emilia
EVENT_DATE=15 de septiembre de 2026
```

6. Click **"Create Web Service"**
7. **COPIAR URL**: Se verá como `https://mibautizo-backend-xyz.onrender.com`

✅ Backend estará en línea en ~3-5 minutos

---

## PASO 4️⃣: Actualizar Vercel con URL del Backend (2 min)

1. Ir a Vercel Dashboard
2. Seleccionar proyecto "Mibautizo"
3. Settings → **Environment Variables**
4. Agregar/Actualizar:
   ```
   VITE_API_URL=https://mibautizo-backend-xyz.onrender.com
   ```
5. Click Save
6. Click **Redeploy** (el proyecto redeploya automáticamente)

✅ Frontend ahora conecta con backend en línea

---

## PASO 5️⃣: Configurar Webhook de Mercado Pago (2 min)

1. Ir a: https://www.mercadopago.com.ar/developers/panel/webhooks
2. En **Notification URL** (o URL de webhook):
   ```
   https://mibautizo-backend-xyz.onrender.com/api/webhook
   ```
3. Seleccionar tipos de eventos: ✅ `payment`
4. Click Save/Actualizar

✅ Mercado Pago ahora enviará notificaciones de pagos

---

## 🎯 ¡LISTO! Tu App Está en Vivo

### URLs Finales
- **Frontend**: https://mibautizo-xyz.vercel.app
- **Backend**: https://mibautizo-backend-xyz.onrender.com
- **Admin**: https://mibautizo-xyz.vercel.app/admin/login

### Test Rápido
1. Abre `https://mibautizo-xyz.vercel.app` en el navegador
2. Selecciona un regalo
3. Checkout
4. Paga con tarjeta de prueba: **4111 1111 1111 1111**
5. ✅ Deberías recibir email de confirmación

---

## 📞 Troubleshooting Rápido

| Problema | Solución |
|---------|----------|
| Frontend no carga | Esperar 2-3 min, refrescar |
| Backend error 500 | Revisar logs en Render, verificar DATABASE_URL |
| Emails no llegan | Verificar GMAIL_PASS en .env |
| Mercado Pago no responde | Verificar credenciales MP_ACCESS_TOKEN |
| Base de datos error | Ejecutar migraciones: contactar soporte |

---

## 🎉 ¿Todo Funciona?

Ahora puedes:
✅ Compartir enlace a invitados
✅ Ellos pueden ver regalos
✅ Pueden contribuir con Mercado Pago
✅ Reciben confirmación por email
✅ Tú ves todo en admin panel

**Tiempo total**: ~20 minutos
**Costo**: $0 USD/mes (plan free)
**Duración**: 1 mes (después contratarse si es necesario)
