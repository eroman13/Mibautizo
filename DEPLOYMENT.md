# 🚀 Guía de Despliegue a Producción

Esta guía te acompañará paso a paso para llevar tu Mesa de Regalos Digital desde desarrollo local hasta producción.

---

## 📋 Checklist Pre-Despliegue

Antes de desplegar, asegúrate de completar:

- [ ] Proyecto funcionando correctamente en local
- [ ] Todos los tests pasando (si los tienes)
- [ ] Credenciales de Mercado Pago de **PRODUCCIÓN** obtenidas
- [ ] Contraseña admin cambiada por una segura
- [ ] Base de datos de producción configurada (PostgreSQL recomendado)
- [ ] Dominio personalizado registrado (opcional pero recomendado)
- [ ] Certificado SSL/HTTPS configurado
- [ ] Webhooks de MP configurados con URL pública

---

## 🎯 Arquitectura de Despliegue Recomendada

```
┌─────────────────────────────────────────────────┐
│         USUARIOS (Invitados del Bautizo)        │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│   FRONTEND (Vercel / Netlify / Cloudflare)     │
│   - React SPA servida como archivos estáticos  │
│   - CDN global para velocidad                   │
│   - HTTPS automático                            │
└────────────────┬────────────────────────────────┘
                 │ API Calls
                 ↓
┌─────────────────────────────────────────────────┐
│    BACKEND (Railway / Render / Fly.io)         │
│    - Node.js + Express                          │
│    - Lógica de negocio + Validaciones           │
│    - Integración con Mercado Pago               │
└─────────┬───────────────────────┬───────────────┘
          │                       │
          ↓                       ↓
┌──────────────────┐    ┌────────────────────────┐
│   PostgreSQL     │    │   Mercado Pago API     │
│   (Railway DB)   │    │   - Pagos              │
│   - Regalos      │    │   - Webhooks           │
│   - Contribuciones│   └────────────────────────┘
└──────────────────┘
```

---

## 🔧 Opción 1: Vercel + Railway (Recomendada)

### ⭐ Ventajas
- ✅ Deploy automático con Git
- ✅ Escalado automático
- ✅ SSL/HTTPS incluido
- ✅ PostgreSQL gestionado
- ✅ Tier gratuito generoso
- ✅ Logs y monitoreo integrados

### 📦 Costos Estimados
- **Desarrollo/Pruebas**: $0/mes (gratis)
- **Producción (tráfico bajo)**: $5-10/mes
- **Producción (tráfico alto)**: $20-50/mes

---

### 🔵 Paso 1: Desplegar Backend en Railway

#### 1.1 Crear cuenta
- Ve a https://railway.app
- Regístrate con GitHub
- Verifica tu email

#### 1.2 Crear proyecto nuevo
```bash
# En Railway Dashboard:
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Autoriza Railway a acceder a tu repo
4. Selecciona tu repositorio
```

#### 1.3 Configurar el servicio
```bash
# Settings del proyecto:
Root Directory: backend
Build Command: npm install && npx prisma generate
Start Command: npm start

# O deja vacío para que Railway use package.json
```

#### 1.4 Agregar PostgreSQL
```bash
# En el proyecto de Railway:
1. Click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway creará la BD automáticamente
4. Copia la variable DATABASE_URL (la usarás después)
```

#### 1.5 Configurar Variables de Entorno

En Railway → Tu servicio → Variables:

```env
# Base de datos (auto-generada por Railway)
DATABASE_URL=postgresql://postgres:password@hostname:5432/railway

# Mercado Pago PRODUCCIÓN (⚠️ NO uses credenciales de prueba)
MP_ACCESS_TOKEN=APP_USR-tu-access-token-de-produccion-aqui
MP_PUBLIC_KEY=APP_USR-tu-public-key-de-produccion-aqui
MP_COMMISSION_RATE=0.038

# URLs (actualizar después de deploy)
FRONTEND_URL=https://bautizo-gemelas.vercel.app
BACKEND_URL=https://bautizo-api.up.railway.app

# Seguridad
ADMIN_PASSWORD=TuContraseñaSuperSegura2026!
NODE_ENV=production
PORT=3000
```

#### 1.6 Ejecutar Migraciones

Opción A - Desde Railway CLI:
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link al proyecto
railway link

# Ejecutar migraciones
railway run npx prisma migrate deploy

# Poblar datos iniciales (opcional)
railway run npx prisma db seed
```

Opción B - Desde tu máquina:
```bash
# Configurar DATABASE_URL temporal en .env
DATABASE_URL="postgresql://postgres:password@hostname:5432/railway"

cd backend
npx prisma migrate deploy
npx prisma db seed
```

#### 1.7 Obtener URL del Backend

Railway te dará una URL como:
```
https://bautizo-api-production-abc123.up.railway.app
```

Copia esta URL (la necesitarás para el frontend).

---

### 🔵 Paso 2: Desplegar Frontend en Vercel

#### 2.1 Crear cuenta
- Ve a https://vercel.com
- Regístrate con GitHub
- Verifica tu email

#### 2.2 Importar proyecto
```bash
# En Vercel Dashboard:
1. Click "Add New..." → "Project"
2. Import tu repositorio de GitHub
3. Select el repo
```

#### 2.3 Configurar el proyecto
```bash
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### 2.4 Configurar Variables de Entorno

En Vercel → Project Settings → Environment Variables:

```env
VITE_API_URL=https://bautizo-api-production-abc123.up.railway.app/api
```

⚠️ **Importante:** Usa la URL exacta de Railway del paso anterior.

#### 2.5 Deploy

```bash
# Vercel detecta automáticamente los cambios
# Hace deploy en cada push a main/master

# URL resultante:
https://bautizo-gemelas.vercel.app
```

#### 2.6 Actualizar CORS en Backend

Regresa a Railway y actualiza:

```env
FRONTEND_URL=https://bautizo-gemelas.vercel.app
```

Guarda y Railway re-deployará automáticamente.

---

### 🔵 Paso 3: Configurar Webhooks de Mercado Pago

#### 3.1 Ir al Panel de Webhooks
- https://www.mercadopago.cl/developers/panel/webhooks
- Inicia sesión con tu cuenta de MP

#### 3.2 Crear Webhook
```bash
URL de Notificación:
https://bautizo-api-production-abc123.up.railway.app/api/webhook

Eventos a Escuchar:
☑ payment (todos los eventos de pago)

Modo: Producción
```

#### 3.3 Probar Webhook
```bash
# Mercado Pago enviará un POST de prueba
# Verifica en Railway Logs que llegó correctamente:

Railway → Tu servicio → Deployments → Logs
Busca: "Webhook recibido"
```

---

### 🔵 Paso 4: Verificación Final

#### 4.1 Checklist de Verificación

- [ ] Frontend carga correctamente en Vercel
- [ ] Backend responde en Railway (`/api/regalos`)
- [ ] Portada del evento se muestra
- [ ] Catálogo de regalos carga
- [ ] Carrito funciona
- [ ] Checkout se completa
- [ ] Redirección a MP funciona
- [ ] Pago de prueba se procesa
- [ ] Webhook confirma el pago
- [ ] Regalo cambia de estado
- [ ] Admin panel funciona (`/admin/login`)
- [ ] Dashboard muestra estadísticas
- [ ] CSV exporta correctamente

#### 4.2 Hacer un Pago de Prueba Real

**⚠️ IMPORTANTE:** Usa una tarjeta real con $100-500 para probar

1. Ve a tu sitio en Vercel
2. Selecciona un regalo económico
3. Completa el checkout
4. Paga con tarjeta real
5. Verifica que:
   - MP procesa el pago
   - Webhook actualiza la BD
   - Admin panel refleja la contribución
   - Email de MP llega al invitado

**Nota:** Mercado Pago cobra normalmente en producción. Este pago es real.

#### 4.3 Monitorear Logs

**Railway (Backend):**
```bash
Railway → Deployments → View Logs

Busca errores o warnings
```

**Vercel (Frontend):**
```bash
Vercel → Project → Deployments → Function Logs

Verifica que no haya errores 404 o CORS
```

---

## 🔧 Opción 2: Netlify + Render

Similar a Vercel + Railway, pero con diferentes plataformas.

### Frontend en Netlify

1. **Importar sitio:**
   - https://app.netlify.com
   - Sites → Add new site → Import from Git
   
2. **Configuración:**
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: dist
   ```

3. **Variables de entorno:**
   ```env
   VITE_API_URL=https://tu-backend.onrender.com/api
   ```

### Backend en Render

1. **Crear Web Service:**
   - https://dashboard.render.com
   - New + → Web Service
   
2. **Configuración:**
   ```
   Root Directory: backend
   Build Command: npm install && npx prisma generate
   Start Command: npm start
   ```

3. **Agregar PostgreSQL:**
   - New + → PostgreSQL
   - Conectar al Web Service
   
4. **Variables de entorno:** (mismas que Railway)

---

## 🔧 Opción 3: Todo en un VPS (Avanzado)

Para desarrolladores con experiencia en servidores Linux.

### Requisitos
- VPS con Ubuntu 22.04+ (DigitalOcean, Linode, AWS EC2)
- Dominio propio
- Conocimientos de Nginx, PM2, PostgreSQL

### Pasos Resumidos

1. **Configurar servidor:**
   ```bash
   # Actualizar sistema
   sudo apt update && sudo apt upgrade -y
   
   # Instalar Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Instalar PostgreSQL
   sudo apt install postgresql postgresql-contrib
   
   # Instalar Nginx
   sudo apt install nginx
   
   # Instalar PM2
   sudo npm install -g pm2
   ```

2. **Configurar PostgreSQL:**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE bautizo_gemelas;
   CREATE USER bautizo WITH PASSWORD 'contraseña-segura';
   GRANT ALL PRIVILEGES ON DATABASE bautizo_gemelas TO bautizo;
   \q
   ```

3. **Clonar proyecto:**
   ```bash
   git clone <tu-repo>
   cd mesa-regalos-bautizo-gemelas
   npm run install:all
   ```

4. **Configurar .env:**
   ```bash
   # Copiar y editar variables de producción
   cp .env.example .env
   nano .env
   ```

5. **Ejecutar migraciones:**
   ```bash
   cd backend
   DATABASE_URL="postgresql://bautizo:contraseña@localhost:5432/bautizo_gemelas" npx prisma migrate deploy
   npx prisma db seed
   ```

6. **Build y ejecutar backend:**
   ```bash
   cd backend
   npm run build
   pm2 start dist/index.js --name bautizo-api
   pm2 save
   pm2 startup
   ```

7. **Build frontend:**
   ```bash
   cd frontend
   npm run build
   # dist/ se sirve con Nginx
   ```

8. **Configurar Nginx:**
   ```nginx
   # /etc/nginx/sites-available/bautizo
   server {
       listen 80;
       server_name tu-dominio.com www.tu-dominio.com;
       
       # Frontend
       root /home/usuario/mesa-regalos-bautizo-gemelas/frontend/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # Backend API
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

9. **Habilitar sitio:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/bautizo /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

10. **Configurar SSL con Certbot:**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
    ```

---

## 🔒 Seguridad en Producción

### Variables de Entorno Sensibles

**NUNCA subas a Git:**
- `MP_ACCESS_TOKEN`
- `ADMIN_PASSWORD`
- `DATABASE_URL` (si contiene contraseña)

**Usar siempre:**
- Variables de entorno del hosting
- Archivos `.env` en `.gitignore`
- Secrets managers (Railway Secrets, Vercel Env Vars)

### Contraseña Admin Segura

```bash
# Generar contraseña segura:
openssl rand -base64 32

# Ejemplo:
ADMIN_PASSWORD="Xk9mP2vL8qT3nH5yJ1wR6zF4sD7gA0bC"
```

### Rate Limiting (Opcional)

Instalar en backend:
```bash
npm install express-rate-limit
```

```typescript
// backend/src/index.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Demasiadas solicitudes, intenta de nuevo más tarde'
});

app.use('/api/', limiter);
```

---

## 📊 Monitoreo y Logs

### Railway

- **Ver logs en tiempo real:**
  ```bash
  railway logs
  ```

- **Metrics Dashboard:**
  - CPU usage
  - Memory usage
  - Request rate
  - Response time

### Vercel

- **Analytics:**
  - Page views
  - Unique visitors
  - Performance metrics
  
- **Function Logs:**
  - Server-side rendering errors
  - API route logs (si usas)

### Sentry (Opcional para errores)

```bash
# Instalar Sentry
npm install @sentry/react @sentry/node

# Configurar en frontend/backend
# Docs: https://docs.sentry.io
```

---

## 🔄 Actualizaciones y Mantenimiento

### Deploy Automático con Git

Ambos Railway y Vercel hacen deploy automático:

```bash
# 1. Hacer cambios en local
git add .
git commit -m "Actualizar mensaje de bienvenida"
git push origin main

# 2. Railway y Vercel detectan el push
# 3. Hacen build y deploy automáticamente
# 4. En ~2-5 minutos está en producción
```

### Rollback en caso de Error

**Vercel:**
```bash
Vercel Dashboard → Deployments → Promote to Production
(Selecciona un deploy anterior)
```

**Railway:**
```bash
Railway Dashboard → Deployments → Redeploy
(Click en un deployment anterior)
```

---

## 📝 Post-Despliegue

### Compartir con Invitados

1. **URL final:**
   ```
   https://bautizo-gemelas.vercel.app
   ```

2. **Crear QR Code:**
   - https://www.qr-code-generator.com
   - Pega tu URL
   - Descarga PNG
   - Imprímelo en las invitaciones 🎉

3. **Enviar por WhatsApp:**
   ```
   🍼 ¡Nos casamos/bautizamos a nuestras gemelas! 💕
   
   Aquí está nuestra mesa de regalos:
   https://bautizo-gemelas.vercel.app
   
   ¡Gracias por acompañarnos! 🎀
   ```

### Monitorear Contribuciones

- **Panel admin:** `https://tu-sitio.com/admin/login`
- **Contraseña:** La que configuraste en `ADMIN_PASSWORD`
- **Revisar diariamente** para agradecer a los invitados

---

## ❓ FAQ de Despliegue

### ¿Cuánto cuesta mantener el sitio?

- **Desarrollo:** $0 (gratis)
- **Producción light:** $5-10/mes
- **Con dominio propio:** +$10-15/año

### ¿Necesito dominio propio?

No, Railway y Vercel dan subdominios gratis:
- `tu-app.vercel.app`
- `tu-backend.up.railway.app`

### ¿Puedo usar el tier gratuito?

Sí, pero con límites:
- **Vercel Free:** 100GB bandwidth/mes
- **Railway Free:** $5 de crédito/mes (suficiente para MVP)

### ¿Cómo migrar de SQLite a PostgreSQL?

1. Actualiza `schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Crear migraciones:
   ```bash
   npx prisma migrate dev --name init
   ```

3. Deploy a producción con nueva `DATABASE_URL`

---

## 🎉 ¡Listo para Producción!

Una vez completados estos pasos, tu Mesa de Regalos estará:

✅ Accesible 24/7  
✅ Con pagos reales funcionando  
✅ Escalable automáticamente  
✅ Con HTTPS seguro  
✅ Con backups automáticos de la BD  

**¡Disfruta tu bautizo! 🍼👶👶💝**
