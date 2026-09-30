# 🚀 QUICK START: Deploy en Railway (50 Días)

## ¿Por qué Railway para 50 días?
- ✅ Backend NUNCA se pausa
- ✅ Webhooks Mercado Pago siempre funcionan
- ✅ Emails se envían al instante
- ✅ Costo: solo $5 USD
- ✅ Base de datos incluida

---

## PASO 1️⃣: Deploy Frontend en Vercel (5 min)

1. https://vercel.com/sign-up (o login si tienes cuenta)
2. Click "Continue with GitHub"
3. Seleccionar repo "Mibautizo"
4. Click "Import"
5. **Root Directory**: `frontend`
6. Click "Deploy"
7. **COPIAR URL** de tu frontend (ej: `https://mibautizo.vercel.app`)

✅ Frontend estará en vivo en ~2 minutos

---

## PASO 2️⃣: Crear Cuenta en Railway (2 min)

1. https://railway.app
2. Click "Sign up with GitHub"
3. Autorizar conexión
4. Done ✅

---

## PASO 3️⃣: Crear PostgreSQL en Railway (3 min)

1. Railway Dashboard → **New Project**
2. Buscar **"PostgreSQL"**
3. Click "PostgreSQL"
4. Click "Add"
5. Esperar build (~1 min)
6. Click en "postgres-*" (la base de datos)
7. Tab **"Variables"**
8. **COPIAR TODA** la variable `DATABASE_URL`
   - Formato: `postgresql://user:pass@host:5432/railway`

⚠️ **GUARDAR ESTA URL EN UN DOCUMENTO TEMPORAL**

---

## PASO 4️⃣: Deploy Backend en Railway (5 min)

1. En el mismo proyecto Railway → **New**
2. Seleccionar **"GitHub Repo"**
3. Conectar y seleccionar repo "Mibautizo"
4. **Root Directory**: `backend`
5. Click "Deploy"
6. Esperar build (~3-5 min)
7. Cuando termine, verás mensajes como:
   ```
   ✅ build succeeded
   ✅ deployment succeeded
   ```

---

## PASO 5️⃣: Configurar Variables de Entorno (5 min)

### En Railway Dashboard:

1. Click en el servicio "backend" (no en postgres)
2. Tab **"Variables"**
3. Click **"Add Variable"**
4. Agregar TODAS estas (copy-paste es válido):

**Variable 1: DATABASE_URL**
- Name: `DATABASE_URL`
- Value: **(copiar del PASO 3)**

**Variable 2: MP_ACCESS_TOKEN**
- Name: `MP_ACCESS_TOKEN`
- Value: `APP_USR-6032208155105752-010810-61dba3eba0dd04d9fe6834080b8e4141-3120378089`

**Variable 3: MP_PUBLIC_KEY**
- Name: `MP_PUBLIC_KEY`
- Value: `APP_USR-d437a4b4-5235-4190-a083-326bf35e3c9d`

**Variable 4: FRONTEND_URL**
- Name: `FRONTEND_URL`
- Value: **(copiar URL de Vercel del PASO 1)**

**Variable 5: NODE_ENV**
- Name: `NODE_ENV`
- Value: `production`

**Variable 6: GMAIL_USER**
- Name: `GMAIL_USER`
- Value: `regalapp.spa@gmail.com`

**Variable 7: GMAIL_PASS**
- Name: `GMAIL_PASS`
- Value: `einzwdfqiwcojgew`

**Variable 8: ADMIN_EMAIL**
- Name: `ADMIN_EMAIL`
- Value: `regalapp.spa@gmail.com`

**Variable 9: MELLIZA1_NAME**
- Name: `MELLIZA1_NAME`
- Value: `Antonia`

**Variable 10: MELLIZA2_NAME**
- Name: `MELLIZA2_NAME`
- Value: `Emilia`

**Variable 11: EVENT_DATE**
- Name: `EVENT_DATE`
- Value: `15 de septiembre de 2026`

**Variables 12-17: Cloudflare R2 (almacenamiento de imágenes) — ✅ ya configurado en local**

Estado al 30-09-2026: el bucket `mibautizo-recuerdos` está creado, su URL pública funciona
(`https://pub-2f5965b2a1c644b98f0fb181a2bfae49.r2.dev`) y el token de R2 (el mismo que usan
los buckets de UnPresente) **ya incluye este bucket**. Lo único que falta es pegar los mismos
valores en Railway (Dashboard → servicio backend → *Variables* → *Raw Editor*):

- Name: `R2_ACCOUNT_ID` → Value: `f12d8cf865cafe76a1c40fd48c7d677a`
- Name: `R2_ACCESS_KEY_ID` → Value: los mismos 32 caracteres que están en `backend/.env`
- Name: `R2_SECRET_ACCESS_KEY` → Value: los mismos 64 caracteres que están en `backend/.env`
- Name: `R2_BUCKET` → Value: `mibautizo-recuerdos`
- Name: `R2_PUBLIC_URL` → Value: `https://pub-2f5965b2a1c644b98f0fb181a2bfae49.r2.dev` (sin barra final)
- Name: `R2_PREFIX` → Value: `imagenes` (opcional; las fotos van a `imagenes/fotos/<fecha>/`)

`R2_ENDPOINT` no hace falta: se deriva de `R2_ACCOUNT_ID`.

Si algún día hay que repetir la configuración desde cero en Cloudflare:
1. R2 → *Create bucket* → `mibautizo-recuerdos`
2. Ese bucket → *Settings* → **Public Development URL** → *Enable* → escribir `allow` → copiar
   el **Public Bucket URL** (`https://pub-xxxx.r2.dev`)
3. R2 → *Manage API Tokens* → *Create API token* → permiso **Object Read & Write** →
   *Apply to specific buckets only* → `mibautizo-recuerdos`, o bien añadir el bucket a un token
   existente → copiar **Access Key ID** y **Secret Access Key**

> ⚠️ Los tokens de R2 son **por bucket**: un token que no incluya `mibautizo-recuerdos` responde
> `403 AccessDenied` aunque esté creado para la misma cuenta.
> Verificar antes de desplegar: `cd backend && npm run diagnose:r2` (guía completa en
> `backend/R2_CONFIG.md`).

> Si NO configuras estas variables, las imágenes se siguen guardando como base64 en la base de
> datos (funciona igual, pero la BD crece más). Para verificar el modo activo:
> `https://<tu-backend>.railway.app/api/health` debe responder `"storage":"r2"`
> (ojo: informa `r2` con las variables completas, pero no valida permisos).

5. Click "Save" después de cada variable
6. Railway redeploya automáticamente

⏳ Esperar 2-3 minutos para que Railway actualice

---

## PASO 6️⃣: Obtener URL del Backend (2 min)

1. Click en servicio "backend"
2. Tab **"Settings"**
3. Buscar **"Railway Domain"** o **"URL"**
4. Deberías ver algo como:
   ```
   https://mibautizo-production-abc123.railway.app
   ```
5. **COPIAR ESTA URL** (la usaremos en el siguiente paso)

---

## PASO 7️⃣: Actualizar Vercel con URL de Backend (2 min)

1. https://vercel.com → Seleccionar proyecto "mibautizo"
2. Settings → **Environment Variables**
3. Buscar o crear `VITE_API_URL`
4. Value: **(copiar URL de Railway del PASO 6)**
5. Click "Save"
6. Railway redeploya automáticamente (verás en Vercel)

---

## PASO 8️⃣: Configurar Webhook de Mercado Pago (2 min)

1. https://www.mercadopago.com.ar/developers/panel/webhooks
2. En **Notification URL** pon:
   ```
   https://mibautizo-production-abc123.railway.app/api/webhook
   ```
   (reemplaza con tu URL de Railway del PASO 6)

3. En **"Allowed events"** o **"Notification types"** selecciona: ✅ `payment`
4. Click "Save"

---

## PASO 9️⃣: Verificar que Todo Funciona (5 min)

### Test 1: ¿Frontend carga?
1. Abre tu URL de Vercel en navegador
2. Deberías ver la galería de regalos
3. ✅ Si funciona, continúa

### Test 2: ¿Backend responde?
1. Abre en navegador:
   ```
   https://mibautizo-production-abc123.railway.app/api/health
   ```
   (reemplaza con tu URL)
2. Deberías ver:
   ```json
   {"status":"ok","message":"Backend funcionando"}
   ```
3. ✅ Si funciona, continúa

### Test 3: ¿Pago funciona?
1. En frontend, selecciona un regalo
2. Carrito → Checkout
3. Llena formulario:
   - Nombre: "Test Prueba"
   - Email: tu@email.com
   - Dedicatoria: opcional
4. Click "Crear Preferencia"
5. Deberías abrir Mercado Pago
6. Paga con tarjeta: **4111 1111 1111 1111**
   - Vencimiento: 11/25
   - CVV: 123
7. Confirmar pago
8. ✅ Deberías llegar a página "Pago Exitoso"

### Test 4: ¿Email llegó?
1. Revisar tu inbox (tu@email.com)
2. Esperar máximo 1-2 minutos
3. Deberías recibir email:
   ```
   Asunto: ✅ Confirmación de regalo para Antonia y Emilia
   ```
4. ✅ Si llegó, ¡ÉXITO!

---

## 🎉 ¡LISTO! TU APP ESTÁ EN VIVO POR 50 DÍAS

### URLs Finales
- **Frontend**: `https://mibautizo.vercel.app`
- **Backend**: `https://mibautizo-production-abc123.railway.app`
- **Admin**: `https://mibautizo.vercel.app/admin/login`

### Credenciales Admin
- Usuario: `admin`
- Password: `mellizas2026`

---

## 💳 Costo Final

- Vercel: $0 ✅
- Railway: ~$5 USD (~$9.000 CLP) para 50 días ✅
- **TOTAL: $5 USD**

⚠️ **Railway te pide agregar tarjeta de crédito**
- No te cobra automáticamente
- Solo carga lo que uses (probablemente menos de $5)
- Puedes establecer límites de gasto

---

## 🆘 Si Algo Falla

### "Backend no responde"
1. Ir a Railway Dashboard
2. Click servicio "backend"
3. Ver logs (tab "Logs")
4. Buscar mensajes de error
5. Si ves "DATABASE_URL" error → revisar paso 5

### "Mercado Pago no abre"
1. Ir a Vercel
2. Revisar que `VITE_API_URL` esté correcto
3. Redeploy: Click "Deployments" → "Redeploy"

### "Email no llega"
1. Esperar 1-2 minutos
2. Revisar carpeta SPAM
3. Revisar Railway logs en servicio "backend"

### "No puedo pagar"
1. Usar tarjeta de prueba exacta: `4111 1111 1111 1111`
2. Cualquier vencimiento futuro (ej: 11/25)
3. Cualquier CVV de 3 dígitos (ej: 123)

---

## ✨ PRÓXIMOS PASOS

1. ✅ Sigue estos 9 pasos (~30 minutos)
2. ✅ Prueba flujo completo
3. ✅ Comparte enlace con invitados
4. ✅ Monitora admin panel

**¿Listo para comenzar?** 🚀
