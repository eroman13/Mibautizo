# 🚀 Guía Completa de Deployment - Bautizo de las Gemelas

## 📋 Opciones Recomendadas (Calidad/Precio Óptimo)

### ✅ OPCIÓN RECOMENDADA (Mejor para 1 mes)
- **Frontend**: Vercel (GRATIS, instantáneo)
- **Backend**: Render.com (GRATIS, tier gratuito robusto)
- **Base de datos**: PostgreSQL en Render (GRATIS)
- **Emails**: Gmail (YA CONFIGURADO ✅)
- **Imágenes**: Cloudinary (GRATIS 25GB)

**Costo Total**: $0 (100% GRATIS para 1 mes)
**Tiempo de setup**: ~30 minutos

---

## 🎯 PASO 1: Preparar el Código para Producción

### 1.1 Frontend - Variables de Entorno

Crear `frontend/.env.production`:
```bash
VITE_API_URL=https://tu-backend.onrender.com
```

### 1.2 Backend - Variables de Producción

Necesitarás en Render:
```
DATABASE_URL=postgresql://user:pass@...
MP_ACCESS_TOKEN=APP_USR-...
MP_PUBLIC_KEY=APP_USR-...
FRONTEND_URL=https://tu-dominio.vercel.app
GMAIL_USER=regalapp.spa@gmail.com
GMAIL_PASS=einzwdfqiwcojgew
ADMIN_EMAIL=regalapp.spa@gmail.com
GEMELA1_NAME=Antonia
GEMELA2_NAME=Emilia
EVENT_DATE=15 de septiembre de 2026
```

---

## 📦 PASO 2: Deploy Frontend en Vercel

### 2.1 Crear cuenta y conectar repo
1. Ir a https://vercel.com/sign-up
2. Conectar tu GitHub (o GitLab/Bitbucket)
3. Importar repo `Mibautizo`

### 2.2 Configurar Build
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `frontend/dist`
- Install Command: `npm install`

### 2.3 Variables de Entorno
En Vercel Dashboard → Settings → Environment Variables:
```
VITE_API_URL=https://tu-backend.onrender.com
```

**Resultado**: Tu app en `https://mibautizo.vercel.app` (o custom domain)

---

## 🔧 PASO 3: Deploy Backend en Render

### 3.1 Crear cuenta en Render
1. Ir a https://render.com/
2. Sign up (puedes usar GitHub)

### 3.2 Crear PostgreSQL Database
1. Dashboard → New → PostgreSQL
2. Name: `mibautizo-db`
3. Region: Santiago (Chile)
4. Plan: Free (gratis)
5. Copiar la `DATABASE_URL` completa

### 3.3 Crear Web Service (Backend)
1. Dashboard → New → Web Service
2. Conectar repo GitHub
3. Name: `mibautizo-backend`
4. Environment: Node
5. Build Command: 
   ```
   npm install && npm run build
   ```
6. Start Command:
   ```
   npm run start:prod
   ```

### 3.4 Variables de Entorno en Render
En la sección Environment:
```
DATABASE_URL=postgresql://user:pass@... (copiado de PostgreSQL)
MP_ACCESS_TOKEN=APP_USR-...
MP_PUBLIC_KEY=APP_USR-...
FRONTEND_URL=https://mibautizo.vercel.app
BACKEND_URL=https://mibautizo-backend.onrender.com
GMAIL_USER=regalapp.spa@gmail.com
GMAIL_PASS=einzwdfqiwcojgew
ADMIN_EMAIL=regalapp.spa@gmail.com
GEMELA1_NAME=Antonia
GEMELA2_NAME=Emilia
EVENT_DATE=15 de septiembre de 2026
NODE_ENV=production
```

### 3.5 Conectar Base de Datos
En el backend necesitas ejecutar migraciones:
```bash
# En tu máquina local, después de hacer push a GitHub:
npm run migrate:deploy
```

O en Render, agregar en "Pre-deploy Command":
```bash
npm run migrate:deploy
```

---

## 🌐 PASO 4: Configurar Dominio Personalizado (Opcional)

### Si quieres `mibautizo.cl` en lugar de URLs de terceros:

#### 4.1 Comprar dominio
- GoDaddy, Namecheap, NIC (Chile)
- Costo: ~$10-15 USD/año

#### 4.2 Conectar a Vercel
1. Vercel Dashboard → Settings → Domains
2. Agregar dominio personalizado
3. Actualizar DNS records en registrador
4. Esperar propagación (24-48h)

#### 4.3 Conectar Backend a dominio
- Crear subdominio: `api.mibautizo.cl` en Render
- O usar: `mibautizo-backend.onrender.com` sin cambios

---

## 🗄️ PASO 5: Migrar Base de Datos

### 5.1 Crear SQL Dump local
```bash
cd backend
sqlite3 dev.db ".dump" > schema_dump.sql
```

### 5.2 Importar a PostgreSQL en Render
```bash
# Instalar PostgreSQL client
brew install postgresql

# Conectar a base de datos remota
psql $DATABASE_URL < schema_dump.sql
```

O simplemente ejecutar migrations:
```bash
npm run migrate:deploy
```

---

## 📸 PASO 6: Configurar Almacenamiento de Imágenes

### Problema
SQLite local no funciona en producción. Las imágenes necesitan almacenamiento en nube.

### Solución: Cloudinary (GRATIS)

#### 6.1 Crear cuenta
1. https://cloudinary.com/users/register/free
2. Copiar Cloud Name, API Key, API Secret

#### 6.2 Actualizar backend
Instalar: `npm install cloudinary`

Crear `backend/src/lib/cloudinary.ts`:
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(base64: string, filename: string) {
  const result = await cloudinary.uploader.upload(
    `data:image/jpeg;base64,${base64}`,
    { public_id: filename, folder: 'mibautizo' }
  );
  return result.secure_url;
}
```

#### 6.3 Agregar variables a Render
```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

#### 6.4 Actualizar upload controller
```typescript
import { uploadImage } from '../lib/cloudinary';

export async function handleImageUpload(req, res) {
  const { base64, filename } = req.body;
  const imageUrl = await uploadImage(base64, filename);
  res.json({ imageUrl });
}
```

---

## ✅ CHECKLIST PRE-LANZAMIENTO

### Funcionalidad
- [ ] Todos los regalos se cargan correctamente
- [ ] Carrito funciona sin errores
- [ ] Checkout calcula montos correctamente
- [ ] Pago en Mercado Pago procesa exitosamente
- [ ] Email de confirmación se recibe
- [ ] Admin puede login y gestionar
- [ ] Imágenes se suben y ven correctamente

### Seguridad
- [ ] Variables de entorno NO están en código
- [ ] Base de datos tiene contraseña fuerte
- [ ] Admin password es único y seguro
- [ ] HTTPS está activado en todas las URLs
- [ ] CORS está configurado solo para dominio

### Performance
- [ ] Frontend carga en < 3 segundos
- [ ] Imágenes están optimizadas
- [ ] No hay console errors en DevTools
- [ ] Mobile responsive funciona bien

### Datos
- [ ] Seed de admin usuario en producción
- [ ] Seed de al menos 2-3 regalos de prueba
- [ ] Configuración de evento correcta
- [ ] Información de contacto actualizada

### Email
- [ ] Gmail está configurado
- [ ] Email de prueba se envía correctamente
- [ ] Template HTML se ve bien en Outlook/Gmail
- [ ] Admin recibe notificaciones

### URLs Finales
- [ ] Frontend: `https://mibautizo.vercel.app`
- [ ] Backend: `https://mibautizo-backend.onrender.com`
- [ ] API Health: `/api/health` responde
- [ ] Webhooks: Mercado Pago puede enviar requests

---

## 🧪 PRUEBA COMPLETA EN PRODUCCIÓN

### Antes de anunciar a los invitados:

1. **Test de pago completo**
   - Ir a URL de producción
   - Seleccionar regalo
   - Checkout
   - Pagar con tarjeta de prueba de Mercado Pago
   - Verificar email de confirmación recibido

2. **Test de admin**
   - Login con credenciales
   - Ver contribuciones creadas
   - Crear nuevo usuario admin para pareja

3. **Test de mobile**
   - Abrir en iPhone/Android
   - Verificar diseño responsive
   - Probar carrito flotante
   - Hacer test de pago

---

## 📌 RESUMEN DE COSTOS

| Componente | Plan | Precio/mes |
|-----------|------|-----------|
| Frontend (Vercel) | Free | $0 |
| Backend (Render) | Free | $0 |
| Database PostgreSQL (Render) | Free | $0 |
| Emails (Gmail) | Existente | $0 |
| Almacenamiento (Cloudinary) | Free 25GB | $0 |
| Dominio (Opcional) | .cl | ~$15/año |
| **TOTAL** | - | **$0-15 para todo un mes** |

---

## 🆘 TROUBLESHOOTING

### "Build failed on Vercel"
- Verificar que `frontend/dist` se genera localmente
- Chequear variables de entorno configuradas
- Ver logs en Vercel Dashboard

### "Backend no conecta a DB"
- Verificar DATABASE_URL correcta
- Ejecutar `npm run migrate:deploy`
- Chequear credenciales PostgreSQL

### "Imágenes no se suben"
- Verificar Cloudinary API keys
- Chequear permisos en carpeta
- Ver logs de Cloudinary dashboard

### "Emails no se envían"
- Verificar Gmail app password (16 caracteres)
- Chequear GMAIL_PASS sin espacios
- Ver logs del backend en Render

---

## 📞 Próximos Pasos

1. Crear cuentas en Vercel y Render (10 min)
2. Conectar repositorio (5 min)
3. Configurar variables de entorno (10 min)
4. Realizar primer deploy (5 min)
5. Pruebas completas (10 min)

**Tiempo total estimado**: ~40 minutos

¿Comenzamos?
