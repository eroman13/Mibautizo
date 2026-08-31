# 🍼 Mesa de Regalos Digital - Bautizo de Gemelas 💝

Aplicación web completa para gestionar una mesa de regalos en dinero para el bautizo de gemelas Antonia y Emilia, con integración de **Mercado Pago Chile** para pagos con tarjeta de crédito/débito y en cuotas.

## 🎯 Características Principales

- ✅ **Catálogo de regalos** con imágenes referenciales y precios en CLP
- 💳 **Pagos con Mercado Pago** (tarjeta de crédito/débito, hasta 12 cuotas)
- 🎁 **Regalos colaborativos** con barra de progreso visual
- 💰 **Lógica configurable de comisión**:
  - **Modo A**: El invitado cubre la comisión (precio final mayor)
  - **Modo B**: El organizador asume la comisión (precio final igual)
- 📊 **Panel administrativo completo**:
  - Dashboard con estadísticas en tiempo real
  - Gestión de contribuciones con filtros
  - CRUD de regalos con validación
  - Configuración del evento
  - Exportación a CSV para respaldo contable
- 🔔 **Webhooks automáticos** para confirmación de pagos
- 📱 **Diseño responsive** mobile-first con tema pastel
- 🔒 **Seguridad**: Access Token protegido en backend, nunca expuesto
- 🌐 **Localización chilena**: CLP, formato de fechas y números

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18.3** + **TypeScript 5.7**
- **Vite 6.4.3** (build tool ultrarrápido)
- **Tailwind CSS 3** (estilos utility-first)
- **React Router 7** (navegación SPA)
- **Context API** (gestión de estado)

### Backend
- **Node.js 20+** + **Express 4.21**
- **TypeScript 5.7** (tsx para ejecución)
- **Prisma ORM 5.22** (base de datos)
- **SQLite** (desarrollo) / **PostgreSQL** (producción)
- **Mercado Pago SDK** (pagos)

### Arquitectura
- **Monorepo** con npm workspaces
- **RESTful API** con validación completa
- **Webhook idempotente** con `mpPaymentId` único
- **Autenticación** con token Bearer para admin

---

## 📦 Estructura del Proyecto

```
mesa-regalos-bautizo-gemelas/
├── frontend/                    # Aplicación React
│   ├── src/
│   │   ├── pages/               # Páginas de la app
│   │   │   ├── Home.tsx         # Landing page
│   │   │   ├── Regalos.tsx      # Catálogo
│   │   │   ├── Checkout.tsx     # Formulario de pago
│   │   │   ├── PagoExitoso.tsx  # Confirmación
│   │   │   ├── PagoFallido.tsx  # Error
│   │   │   ├── PagoPendiente.tsx # Pendiente
│   │   │   └── admin/           # Panel administrativo
│   │   │       ├── Login.tsx
│   │   │       ├── Dashboard.tsx
│   │   │       ├── Contribuciones.tsx
│   │   │       ├── Regalos.tsx
│   │   │       └── Configuracion.tsx
│   │   ├── components/          # Componentes reutilizables
│   │   │   ├── regalos/         # TarjetaRegalo
│   │   │   ├── carrito/         # CarritoFlotante
│   │   │   └── admin/           # ProtectedRoute
│   │   ├── context/             # Estado global
│   │   │   ├── CarritoContext.tsx
│   │   │   └── AuthContext.tsx
│   │   ├── services/            # Clientes API
│   │   │   ├── api.ts           # API pública
│   │   │   └── adminApi.ts      # API admin
│   │   ├── types/               # Interfaces TypeScript
│   │   └── utils/               # Helpers de formato
│   ├── public/
│   │   └── portada-bautizo.jpg  # Imagen de portada
│   └── package.json
│
├── backend/                     # API REST
│   ├── src/
│   │   ├── routes/
│   │   │   └── index.ts         # Definición de rutas
│   │   ├── controllers/
│   │   │   ├── regalos.controller.ts    # Endpoints públicos
│   │   │   ├── preferencia.controller.ts # Crear pago
│   │   │   ├── webhook.controller.ts    # Notificaciones MP
│   │   │   └── admin.controller.ts      # Panel admin
│   │   ├── lib/
│   │   │   ├── prisma.ts        # Cliente Prisma
│   │   │   └── mercadopago.ts   # SDK de MP
│   │   ├── utils/
│   │   │   └── currency.ts      # Cálculos de comisión
│   │   ├── middlewares/
│   │   │   └── verificarAuth.ts # Autenticación admin
│   │   └── index.ts             # Entry point
│   ├── prisma/
│   │   ├── schema.prisma        # Modelos de datos
│   │   ├── seed.ts              # Datos iniciales
│   │   └── migrations/          # Historial de BD
│   ├── dev.db                   # SQLite (desarrollo)
│   └── package.json
│
├── .env                         # Variables de entorno (NO SUBIR)
├── .env.example                 # Template público
├── .gitignore
├── package.json                 # Workspace raíz
└── README.md                    # Este archivo
```

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Node.js 20+** (verificar con `node -v`)
- **npm 10+** (incluido con Node)
- Cuenta de **Mercado Pago Chile** (gratis)
- Editor de código (VS Code recomendado)

### Paso 1: Clonar el Proyecto

```bash
git clone <url-del-repo>
cd mesa-regalos-bautizo-gemelas
```

### Paso 2: Instalar Dependencias

```bash
# Instala todas las dependencias (frontend + backend)
npm run install:all
```

O manualmente:
```bash
npm install              # Raíz (concurrently)
npm install --prefix frontend
npm install --prefix backend
```

### Paso 3: Configurar Variables de Entorno

1. **Copiar el template:**
   ```bash
   cp .env.example .env
   cp .env.example backend/.env
   ```

2. **Obtener credenciales de Mercado Pago:**
   - Ve a: https://www.mercadopago.cl/developers/panel/credentials
   - Inicia sesión con tu cuenta
   - Ve a **"Credenciales de prueba"** (para desarrollo)
   - Copia el **Access Token** (empieza con `TEST-`)
   - Copia la **Public Key** (empieza con `TEST-`)

3. **Editar `.env` y `backend/.env`:**
   ```bash
   # Pega tus credenciales de PRUEBA
   MP_ACCESS_TOKEN="TEST-tu-access-token-real-aqui"
   MP_PUBLIC_KEY="TEST-tu-public-key-real-aqui"
   
   # Contraseña del panel admin (cámbiala)
   ADMIN_PASSWORD="gemelas2026"
   
   # URLs por defecto
   FRONTEND_URL="http://localhost:5173"
   BACKEND_URL="http://localhost:3000"
   ```

4. **Editar `frontend/.env`:**
   ```bash
   VITE_API_URL="http://localhost:3000/api"
   ```

### Paso 4: Configurar la Base de Datos

```bash
cd backend

# Generar el cliente Prisma
npx prisma generate

# Ejecutar migraciones (crea las tablas)
npx prisma migrate dev

# Poblar con datos de ejemplo
npx prisma db seed

cd ..
```

Esto creará:
- 1 evento (bautizo de Antonia y Emilia)
- 11 regalos de ejemplo (incluyendo regalos colaborativos)

### Paso 5: Ejecutar el Proyecto

```bash
# Opción 1: Ejecutar ambos servidores simultáneamente
npm run dev

# Opción 2: Por separado (en terminales diferentes)
npm run dev:backend   # Terminal 1: http://localhost:3000
npm run dev:frontend  # Terminal 2: http://localhost:5173
```

**URLs disponibles:**
- **Frontend público**: http://localhost:5173
- **Panel admin**: http://localhost:5173/admin/login
- **API backend**: http://localhost:3000/api

---

## 📝 Scripts Disponibles

### Raíz (workspaces)

```bash
npm run dev              # Ejecuta frontend + backend
npm run dev:frontend     # Solo frontend
npm run dev:backend      # Solo backend
npm run install:all      # Instala todas las dependencias
```

### Frontend

```bash
cd frontend
npm run dev              # Servidor de desarrollo (Vite)
npm run build            # Build de producción
npm run preview          # Preview del build
npm run lint             # Verificar código
```

### Backend

```bash
cd backend
npm run dev              # Servidor con tsx watch
npm run build            # Compilar TypeScript
npm start                # Ejecutar build compilado

# Prisma
npx prisma studio        # Interfaz visual de la BD
npx prisma migrate dev   # Crear nueva migración
npx prisma db seed       # Re-ejecutar seed
npx prisma generate      # Regenerar cliente
```

---

## 🔌 Documentación de la API

### Base URL
```
http://localhost:3000/api
```

### Endpoints Públicos

#### 1. Obtener Todos los Regalos
```http
GET /regalos
```

**Respuesta:**
```json
{
  "regalos": [
    {
      "id": 1,
      "nombre": "Pack de 4 bodies",
      "descripcion": "Bodies de algodón suave...",
      "precioCLP": 18000,
      "imagenUrl": "https://...",
      "permiteColaborativo": false,
      "montoRecaudadoCLP": 0,
      "estado": "disponible"
    }
  ],
  "modoComision": "modo_a"
}
```

#### 2. Obtener Detalle de un Regalo
```http
GET /regalos/:id
```

**Respuesta:**
```json
{
  "id": 1,
  "nombre": "Pack de 4 bodies",
  "precioCLP": 18000,
  "montoRecaudadoCLP": 0,
  "estado": "disponible",
  "contribuciones": []
}
```

#### 3. Obtener Información del Evento
```http
GET /evento
```

**Respuesta:**
```json
{
  "nombreGemela1": "Sofía",
  "nombreGemela2": "Valentina",
  "fecha": "2026-09-15",
  "hora": "11:00",
  "lugar": "Iglesia San Francisco",
  "mensajeBienvenida": "¡Celebra con nosotros!",
  "portadaUrl": "/portada-bautizo.jpg",
  "modoComision": "modo_a"
}
```

#### 4. Crear Preferencia de Pago
```http
POST /preferencia
Content-Type: application/json
```

**Body:**
```json
{
  "invitado": {
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "dedicatoria": "Felicidades por sus gemelas"
  },
  "regalos": [
    {
      "id": 1,
      "nombre": "Pack de 4 bodies",
      "precioCLP": 18000,
      "cantidad": 1
    }
  ]
}
```

**Respuesta exitosa:**
```json
{
  "initPoint": "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=...",
  "preferenceId": "123456789-abcd-..."
}
```

#### 5. Webhook de Mercado Pago
```http
POST /webhook
Content-Type: application/json
```

**Idempotente** - Procesa notificaciones de pago automáticamente.

---

### Endpoints Administrativos

**Autenticación requerida:** `Authorization: Bearer admin-authenticated`

#### 1. Login Administrativo
```http
POST /admin/login
Content-Type: application/json
```

**Body:**
```json
{
  "password": "gemelas2026"
}
```

**Respuesta:**
```json
{
  "success": true,
  "token": "admin-authenticated",
  "message": "Inicio de sesión exitoso"
}
```

#### 2. Obtener Estadísticas
```http
GET /admin/stats
Authorization: Bearer admin-authenticated
```

**Respuesta:**
```json
{
  "data": {
    "contribuciones": {
      "total": 5,
      "montoBruto": 250000,
      "comision": 9500,
      "montoNeto": 240500,
      "promedio": 50000
    },
    "regalos": {
      "total": 11,
      "pagados": 3,
      "disponibles": 8
    }
  }
}
```

#### 3. Listar Contribuciones
```http
GET /admin/contribuciones
Authorization: Bearer admin-authenticated
```

**Respuesta:**
```json
{
  "contribuciones": [
    {
      "id": 1,
      "nombreInvitado": "Juan Pérez",
      "emailInvitado": "juan@example.com",
      "montoBrutoCLP": 18000,
      "comisionCLP": 684,
      "montoNetoCLP": 17316,
      "estadoPago": "approved",
      "mpPaymentId": "123456789",
      "dedicatoria": "Felicidades",
      "createdAt": "2026-08-28T10:00:00Z",
      "gift": {
        "nombre": "Pack de 4 bodies"
      }
    }
  ]
}
```

#### 4. Crear Regalo
```http
POST /admin/regalos
Authorization: Bearer admin-authenticated
Content-Type: application/json
```

**Body:**
```json
{
  "nombre": "Cuna de viaje",
  "descripcion": "Cuna plegable portátil",
  "precioCLP": 85000,
  "imagenUrl": "https://...",
  "permiteColaborativo": false
}
```

#### 5. Actualizar Regalo
```http
PUT /admin/regalos/:id
Authorization: Bearer admin-authenticated
Content-Type: application/json
```

**Body:** (igual que crear, todos los campos opcionales)

#### 6. Eliminar Regalo
```http
DELETE /admin/regalos/:id
Authorization: Bearer admin-authenticated
```

**Nota:** No se puede eliminar un regalo con contribuciones asociadas.

#### 7. Actualizar Configuración del Evento
```http
PUT /admin/evento
Authorization: Bearer admin-authenticated
Content-Type: application/json
```

**Body:**
```json
{
  "nombreGemela1": "Antonia",
  "nombreGemela2": "Emilia",
  "fecha": "2026-09-15",
  "hora": "11:00",
  "lugar": "Iglesia San Francisco",
  "portadaUrl": "/portada-bautizo.jpg",
  "mensajeBienvenida": "¡Los esperamos!",
  "modoComision": "modo_a"
}
```

#### 8. Exportar Contribuciones a CSV
```http
GET /admin/export-csv
Authorization: Bearer admin-authenticated
```

**Respuesta:** Archivo CSV descargable con todas las contribuciones.

---

## 🎨 Panel Administrativo

### Acceso

**URL:** http://localhost:5173/admin/login

**Credenciales por defecto:**
- Contraseña: `gemelas2026` (definida en `.env`)

### Secciones

#### 1. Dashboard 📊
- **Total Neto Recaudado** (lo que realmente recibes)
- **Contribuciones** (cantidad y promedio)
- **Comisiones MP** (total pagado a Mercado Pago)
- **Regalos** (pagados vs disponibles)
- Accesos rápidos a otras secciones

#### 2. Contribuciones 💰
- Tabla completa con todas las contribuciones
- Filtro por nombre de invitado o regalo
- Columnas: Fecha, Nombre, Email, Regalo, Montos, Estado, Dedicatoria
- Botón **"Exportar CSV"** para descarga
- Resumen de totales al final

#### 3. Gestionar Regalos 🎁
- Grid de tarjetas con todos los regalos
- Botón **"Agregar Regalo"** abre modal
- Editar: click en lápiz de cada tarjeta
- Eliminar: click en basurero (valida si tiene contribuciones)
- Campos del formulario:
  - Nombre del regalo
  - Descripción
  - Precio en CLP
  - URL de imagen
  - Permitir colaborativo (checkbox)

#### 4. Configuración ⚙️
- Información del evento:
  - Nombres de las gemelas
  - Fecha y hora
  - Lugar
  - URL de imagen de portada
  - Mensaje de bienvenida
- **Modo de comisión:**
  - **Modo A** (invitado cubre): precio aumenta
  - **Modo B** (organizador asume): precio se mantiene
- Botón **"Guardar Cambios"** con confirmación

---

## 💳 Guía de Pruebas con Mercado Pago

### Tarjetas de Prueba (Sandbox)

Usa estas tarjetas para simular pagos **sin gastar dinero real**:

#### ✅ Tarjeta Aprobada
```
Número: 5031 7557 3453 0604
CVV: 123
Fecha: 11/25
Nombre: APRO
RUT: 11.111.111-1
Email: test_user@test.com
```

#### ❌ Tarjeta Rechazada
```
Número: 5031 4332 1540 6351
CVV: 123
Fecha: 11/25
Nombre: OTHE
RUT: 22.222.222-2
```

#### ⏳ Tarjeta Pendiente
```
Número: 5031 4447 2179 6186
CVV: 123
Fecha: 11/25
Nombre: CONT
RUT: 33.333.333-3
```

### Flujo de Prueba Completo

1. **Frontend**: Selecciona regalos → Agrega al carrito
2. **Checkout**: Completa nombre, email, dedicatoria
3. **Mercado Pago**: Usa tarjeta de prueba
4. **Confirmación**: Serás redirigido a `/pago-exitoso`
5. **Webhook**: Backend recibe notificación automática
6. **Admin**: Ve la contribución en el dashboard

### Verificar Webhooks en Desarrollo Local

Para recibir notificaciones de MP en tu máquina local:

1. **Instalar ngrok** (túnel HTTPS):
   ```bash
   brew install ngrok  # macOS
   # O descarga de https://ngrok.com
   ```

2. **Exponer puerto 3000**:
   ```bash
   ngrok http 3000
   ```

3. **Actualizar webhook URL en MP**:
   - Copia la URL de ngrok (ej: `https://abc123.ngrok.io`)
   - Ve a: https://www.mercadopago.cl/developers/panel/webhooks
   - Configura: `https://abc123.ngrok.io/api/webhook`

4. **Reiniciar el backend** con la nueva URL en `.env`:
   ```bash
   BACKEND_URL="https://abc123.ngrok.io"
   ```

---

## 🌐 Despliegue a Producción

### Checklist Pre-Despliegue

- [ ] **Cambiar credenciales de MP** de prueba a producción
- [ ] **Cambiar contraseña admin** por una segura
- [ ] **Migrar a PostgreSQL** (recomendado para producción)
- [ ] **Configurar variables de entorno** en servicios de hosting
- [ ] **Probar flujo completo** en staging
- [ ] **Configurar webhooks** con URL pública

### Opción 1: Vercel + Railway (Recomendado)

#### Frontend en Vercel

1. **Conectar repositorio:**
   - Ve a https://vercel.com
   - Importa tu repositorio de GitHub
   - Framework: **Vite**
   - Root directory: `frontend`

2. **Configurar variables de entorno:**
   ```
   VITE_API_URL=https://tu-backend.up.railway.app/api
   ```

3. **Deploy:**
   - Vercel detecta automáticamente Vite
   - Build command: `npm run build`
   - Output directory: `dist`
   - Deploy automático en cada push

#### Backend en Railway

1. **Crear proyecto:**
   - Ve a https://railway.app
   - New Project → Deploy from GitHub
   - Selecciona tu repositorio
   - Root directory: `backend`

2. **Configurar variables de entorno:**
   ```
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   MP_ACCESS_TOKEN=APP_USR-tu-access-token-produccion
   MP_PUBLIC_KEY=APP_USR-tu-public-key-produccion
   MP_COMMISSION_RATE=0.038
   FRONTEND_URL=https://tu-app.vercel.app
   BACKEND_URL=https://tu-backend.up.railway.app
   ADMIN_PASSWORD=tu-contraseña-super-segura
   PORT=3000
   NODE_ENV=production
   ```

3. **Agregar base de datos PostgreSQL:**
   - En Railway: New → Database → PostgreSQL
   - Copia la `DATABASE_URL` a las variables de entorno
   - Railway la conecta automáticamente

4. **Ejecutar migraciones:**
   - Railway ejecuta `npm install` automáticamente
   - Agrega build command: `npx prisma generate && npx prisma migrate deploy`
   - O ejecuta manualmente después del primer deploy

5. **Configurar webhook en Mercado Pago:**
   - URL: `https://tu-backend.up.railway.app/api/webhook`
   - Eventos: `payment` (todos)

### Opción 2: Netlify + Render

#### Frontend en Netlify

1. **Importar sitio:**
   - Ve a https://netlify.com
   - New site from Git → Selecciona repo
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Variables de entorno:**
   ```
   VITE_API_URL=https://tu-backend.onrender.com/api
   ```

#### Backend en Render

1. **Crear Web Service:**
   - Ve a https://render.com
   - New → Web Service
   - Conecta repositorio
   - Root directory: `backend`
   - Build command: `npm install && npx prisma generate`
   - Start command: `npm start`

2. **Agregar PostgreSQL:**
   - New → PostgreSQL
   - Copia la URL interna
   - Agrégala a las variables de entorno del backend

3. **Variables de entorno:**
   (Igual que Railway, ver arriba)

### Opción 3: VPS (DigitalOcean, AWS, etc.)

Si prefieres control total:

1. **Servidor con Node.js:**
   ```bash
   # Instalar Node 20+
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Instalar PM2 (gestor de procesos)
   sudo npm install -g pm2
   ```

2. **Clonar y configurar:**
   ```bash
   git clone <tu-repo>
   cd mesa-regalos-bautizo-gemelas
   npm run install:all
   
   # Configurar .env con credenciales de producción
   cp .env.example .env
   nano .env
   ```

3. **Ejecutar backend con PM2:**
   ```bash
   cd backend
   npm run build
   pm2 start dist/index.js --name "bautizo-api"
   pm2 save
   pm2 startup
   ```

4. **Configurar Nginx como reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name tu-dominio.com;
       
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Frontend estático:**
   ```bash
   cd frontend
   npm run build
   # Subir carpeta dist/ a tu servidor web
   ```

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@prisma/client'"

**Solución:**
```bash
cd backend
npx prisma generate
```

### Error: "Port 3000 is already in use"

**Solución:**
```bash
# macOS/Linux: Encuentra el proceso
lsof -ti:3000 | xargs kill -9

# O cambia el puerto en .env
PORT=3001
```

### Error: "Contraseña incorrecta" en admin

**Causa:** La variable `ADMIN_PASSWORD` no está en `backend/.env`

**Solución:**
```bash
# Asegúrate de que backend/.env tenga:
ADMIN_PASSWORD="gemelas2026"

# Y reinicia el backend
```

### Webhooks no llegan en desarrollo local

**Problema:** MP no puede alcanzar `localhost`

**Solución:** Usa **ngrok** (ver sección de pruebas arriba)

### Pagos no se confirman automáticamente

**Verificar:**
1. ¿El webhook está configurado en MP?
2. ¿La URL del webhook es pública y accesible?
3. ¿El backend está corriendo?
4. ¿Revisa los logs del backend para errores?

```bash
# Ver logs en tiempo real
cd backend
npm run dev
# O con PM2:
pm2 logs bautizo-api
```

### Error: "Unknown argument: workspace"

**Causa:** Versión antigua de npm que no soporta workspaces

**Solución:**
```bash
# Actualizar npm
npm install -g npm@latest

# Verificar versión (debe ser 7+)
npm -v
```

### Base de datos corrupta

**Solución:**
```bash
cd backend
rm dev.db
npx prisma migrate dev
npx prisma db seed
```

### CORS Error en producción

**Causa:** `FRONTEND_URL` no está configurado correctamente en `.env`

**Solución:**
```bash
# En backend/.env
FRONTEND_URL="https://tu-dominio-frontend.com"
```

---

## 📊 Modelos de Datos

### Event (Tabla: `Event`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int | ID único (auto) |
| nombreGemela1 | String | Nombre de la primera gemela |
| nombreGemela2 | String | Nombre de la segunda gemela |
| fecha | DateTime | Fecha del bautizo |
| hora | String | Hora del evento (formato "HH:mm") |
| lugar | String | Ubicación del evento |
| mensajeBienvenida | String | Texto de bienvenida personalizado |
| portadaUrl | String | URL de la imagen de portada |
| modoComision | String | `"modo_a"` o `"modo_b"` |

### Gift (Tabla: `Gift`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int | ID único (auto) |
| nombre | String | Nombre del regalo |
| descripcion | String | Descripción detallada |
| precioCLP | Int | Precio base en pesos chilenos |
| imagenUrl | String | URL de imagen referencial |
| permiteColaborativo | Boolean | Si múltiples personas pueden aportar |
| montoRecaudadoCLP | Int | Monto acumulado (default: 0) |
| estado | String | `"disponible"` o `"pagado"` |

### Contribution (Tabla: `Contribution`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int | ID único (auto) |
| giftId | Int? | ID del regalo (nullable para "aporte libre") |
| montoBrutoCLP | Int | Monto total que pagó el invitado |
| comisionCLP | Int | Comisión que se llevó MP |
| montoNetoCLP | Int | Monto neto que recibes |
| nombreInvitado | String | Nombre del donante |
| emailInvitado | String | Email del donante |
| dedicatoria | String? | Mensaje personal (opcional) |
| estadoPago | String | `"pending"`, `"approved"`, `"rejected"` |
| mpPaymentId | String | ID de pago de MP (único) |
| createdAt | DateTime | Fecha de creación (auto) |

---

## 💡 Lógica de Comisión

### Modo A: Invitado Cubre la Comisión

**Fórmula:**
```
totalCharge = baseAmount / (1 - commissionRate)
commission = totalCharge - baseAmount
netAmount = baseAmount
```

**Ejemplo con regalo de $100.000:**
- Precio base: $100.000
- Comisión (3.8%): $3.953
- **Total que paga invitado:** $103.953
- **Tú recibes:** $100.000 ✅

### Modo B: Organizador Asume la Comisión

**Fórmula:**
```
totalCharge = baseAmount
commission = baseAmount * commissionRate
netAmount = baseAmount - commission
```

**Ejemplo con regalo de $100.000:**
- Precio base: $100.000
- Comisión (3.8%): $3.800
- **Total que paga invitado:** $100.000
- **Tú recibes:** $96.200

---

## 📚 Recursos Adicionales

### Documentación Oficial

- **Mercado Pago Developers**: https://www.mercadopago.cl/developers
- **Mercado Pago Checkout Pro**: https://www.mercadopago.cl/developers/es/docs/checkout-pro/landing
- **Webhooks MP**: https://www.mercadopago.cl/developers/es/docs/your-integrations/notifications/webhooks
- **Prisma Docs**: https://www.prisma.io/docs
- **Vite Guide**: https://vite.dev/guide/
- **React Router**: https://reactrouter.com/en/main

### Herramientas Útiles

- **Prisma Studio** (GUI para BD): `npx prisma studio`
- **Postman** (probar API): https://www.postman.com
- **ngrok** (túnel HTTPS local): https://ngrok.com
- **Railway** (hosting backend): https://railway.app
- **Vercel** (hosting frontend): https://vercel.com

---

## 🤝 Contribuir

Si encuentras bugs o quieres agregar funcionalidades:

1. Fork del proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## 📜 Licencia

Este proyecto es de uso personal para el bautizo de Antonia y Emilia. 

Siéntete libre de adaptarlo para tus propios eventos. 💕

---

## 🙏 Agradecimientos

- **Mercado Pago** por su API robusta y bien documentada
- **Prisma** por hacer la gestión de BD más simple
- **Vite** por builds ultrarrápidos
- **React** y **Tailwind** por una gran experiencia de desarrollo

---

## 📧 Contacto y Soporte

Si tienes preguntas sobre este proyecto:

1. **Issues del repositorio** (para bugs o mejoras)
2. **Documentación de Mercado Pago** (para problemas con pagos)
3. **Stack Overflow** (para dudas técnicas generales)

---

## 📚 Índice de Documentación Completa

Este proyecto incluye documentación extensa para todos los aspectos del desarrollo, testing y deployment:

| 📄 Documento | 📝 Descripción | ⏱️ Tiempo | 🎯 Para Quién |
|-------------|---------------|----------|--------------|
| **[QUICKSTART.md](./QUICKSTART.md)** | Instalación rápida en 5 pasos | 5 min | Principiantes, setup inicial |
| **[README.md](./README.md)** | Documentación completa (este archivo) | 30 min | Todos, referencia completa |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Guía de despliegue a producción | 40 min | DevOps, deployment |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Arquitectura técnica y diseño | 35 min | Desarrolladores avanzados |
| **[TESTING.md](./TESTING.md)** | Guía completa de testing y QA | 40 min | QA, testers |
| **[RESOURCES.md](./RESOURCES.md)** | Enlaces útiles y referencias | 15 min | Aprendizaje continuo |
| **[CHANGELOG.md](./CHANGELOG.md)** | Historial de versiones | 10 min | Seguimiento de cambios |
| **[DOCS_INDEX.md](./DOCS_INDEX.md)** | Índice navegable de toda la docs | 5 min | Navegación rápida |

**Total:** ~5100 líneas de documentación • ~110 páginas • ~3 horas de lectura

### 🚀 Inicio Rápido

¿Primera vez aquí? Lee en este orden:
1. **[QUICKSTART.md](./QUICKSTART.md)** - Instala y ejecuta en 5 minutos
2. **Este archivo (README.md)** - Entender el proyecto completo
3. **[TESTING.md](./TESTING.md)** - Probar funcionalidades
4. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Llevar a producción

---

<div align="center">

**¡Hecho con ❤️ para Antonia y Emilia!**

🍼 👶 👶 🎀

---

**Documentación profesional • Código limpio • Listo para producción**

[⚡ Quick Start](./QUICKSTART.md) • [🚀 Deploy](./DEPLOYMENT.md) • [🧪 Testing](./TESTING.md) • [📚 Docs Index](./DOCS_INDEX.md)

</div>
```

## 🚀 Instalación y Configuración

### 1. Requisitos Previos

- **Node.js** v18 o superior
- **npm** v9 o superior
- Cuenta en [Mercado Pago Chile](https://www.mercadopago.cl)

### 2. Clonar y Configurar

```bash
# Clonar el repositorio
git clone <tu-repo>
cd mesa-regalos-bautizo-gemelas

# Instalar dependencias de todos los workspaces
npm run install:all
```

### 3. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

#### Obtener Credenciales de Mercado Pago

1. Crea una cuenta en [Mercado Pago Chile](https://www.mercadopago.cl)
2. Ve al [Panel de Desarrolladores](https://www.mercadopago.cl/developers/panel)
3. Copia el **Access Token** y la **Public Key**
4. **Para desarrollo:** Usa las credenciales de **PRUEBA** (empiezan con `TEST-`)
5. **Para producción:** Usa las credenciales de **PRODUCCIÓN** (empiezan con `APP_USR-`)

Variables clave del `.env`:

```env
# Mercado Pago (USAR PRIMERO CREDENCIALES DE PRUEBA)
MP_ACCESS_TOKEN="TEST-tu-access-token-aqui"
MP_PUBLIC_KEY="TEST-tu-public-key-aqui"

# Comisión de Mercado Pago (3.19% + IVA ≈ 3.80%)
MP_COMMISSION_RATE="0.038"

# URLs
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3000"

# Contraseña del panel admin
ADMIN_PASSWORD="cambiar-por-contraseña-segura"

# Modo de comisión por defecto
DEFAULT_COMMISSION_MODE="A"  # A = invitado cubre, B = organizador asume
```

### 4. Configurar Base de Datos

```bash
# Ir al directorio del backend
cd backend

# Generar el cliente de Prisma
npm run prisma:generate

# Crear la base de datos y ejecutar migraciones
npm run prisma:migrate

# Poblar con datos de ejemplo
npm run prisma:seed

# (Opcional) Abrir Prisma Studio para ver los datos
npm run prisma:studio
```

## 🏃 Ejecutar en Desarrollo

### Opción 1: Ejecutar Todo (recomendado)

Desde la raíz del proyecto:

```bash
npm run dev
```

Esto iniciará:
- Frontend en [http://localhost:5173](http://localhost:5173)
- Backend en [http://localhost:3000](http://localhost:3000)

### Opción 2: Ejecutar por Separado

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

## 🧪 Probar Pagos con Tarjetas de Prueba

Mercado Pago provee tarjetas de prueba para Chile:

### Tarjetas de Aprobación

| Tarjeta      | Número               | CVV | Vencimiento | Nombre |
|--------------|----------------------|-----|-------------|--------|
| VISA         | 4168 8188 4444 7115  | 123 | 11/25       | APRO   |
| Mastercard   | 5416 7526 0258 2580  | 123 | 11/25       | APRO   |

### Tarjetas de Rechazo (para testing)

| Nombre | Resultado                     |
|--------|-------------------------------|
| OXXO   | Rechazada por fondos insuf.   |
| CONT   | Pendiente (contingencia)      |

Más info: [Tarjetas de prueba de Mercado Pago](https://www.mercadopago.cl/developers/es/docs/checkout-pro/additional-content/test-cards)

## 🔒 Webhooks (para Desarrollo Local)

Mercado Pago necesita enviar notificaciones a una URL pública. Para desarrollo local:

1. Instala [ngrok](https://ngrok.com/):
   ```bash
   npm install -g ngrok
   ```

2. Expón tu backend:
   ```bash
   ngrok http 3000
   ```

3. Copia la URL pública (ej: `https://abc123.ngrok.io`)

4. Actualiza el `.env`:
   ```env
   WEBHOOK_URL="https://abc123.ngrok.io/api/webhook"
   BACKEND_URL="https://abc123.ngrok.io"
   ```

5. Reinicia el backend

## 📚 Scripts Disponibles

### Raíz del Proyecto

```bash
npm run dev              # Ejecutar frontend + backend
npm run build            # Compilar ambos proyectos
npm run dev:frontend     # Solo frontend
npm run dev:backend      # Solo backend
```

### Backend

```bash
npm run dev              # Modo desarrollo con hot reload
npm run build            # Compilar TypeScript
npm run start            # Ejecutar compilado
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:seed      # Poblar base de datos
npm run prisma:studio    # Abrir interfaz visual de BD
```

### Frontend

```bash
npm run dev              # Servidor de desarrollo
npm run build            # Compilar para producción
npm run preview          # Vista previa del build
npm run lint             # Linter
```

## 🚢 Despliegue a Producción

### Frontend (Vercel recomendado)

1. Crea una cuenta en [Vercel](https://vercel.com)
2. Conecta tu repositorio
3. Configuración de build:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Agrega las variables de entorno (solo las del frontend si las hay)

### Backend (Render recomendado)

1. Crea una cuenta en [Render](https://render.com)
2. Crea un nuevo **Web Service**
3. Conecta tu repositorio
4. Configuración:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run prisma:generate && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Agrega TODAS las variables de entorno del `.env`
6. **Importante:** Actualiza `WEBHOOK_URL` con tu URL de Render

### Base de Datos (para Producción)

Migra de SQLite a PostgreSQL:

1. Crea una base de datos PostgreSQL (Render, Railway, Supabase, etc.)
2. Actualiza `DATABASE_URL` en el `.env` de producción
3. En `backend/prisma/schema.prisma` cambia:
   ```prisma
   datasource db {
     provider = "postgresql"  // era "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
4. Ejecuta las migraciones:
   ```bash
   npm run prisma:migrate
   ```

## 🔐 Seguridad

- ✅ Access Token de Mercado Pago **NUNCA** en el frontend
- ✅ Validación de precios en el backend (contra la BD)
- ✅ Verificación de webhooks consultando la API de MP
- ✅ Protección de rutas admin con contraseña
- ✅ CORS configurado solo para tu dominio
- ⚠️ En producción: usa HTTPS siempre

## 📝 Lógica de Comisión

La app soporta dos modos:

### Modo A: El invitado cubre la comisión
- El invitado paga: `precio ÷ (1 - comisión)`
- Tú recibes: el precio exacto del regalo
- Ejemplo: regalo $50.000 → invitado paga $51.975 → recibes $50.000

### Modo B: Tú asumes la comisión
- El invitado paga: el precio exacto
- Tú recibes: `precio × (1 - comisión)`
- Ejemplo: regalo $50.000 → invitado paga $50.000 → recibes $48.100

Se configura desde el panel admin o en `.env` (`DEFAULT_COMMISSION_MODE`).

## 📊 Panel Administrativo

Accede en [http://localhost:5173/admin](http://localhost:5173/admin)

Funcionalidades:
- 📈 Dashboard con total recaudado y estadísticas
- 🎁 CRUD de regalos del catálogo
- 💰 Tabla de aportes con detalles de cada pago
- ⚙️ Configuración del modo de comisión
- 📤 Exportar aportes a CSV

## 🤝 Contribuciones

Este es un proyecto personal, pero si encuentras bugs o mejoras, ¡las sugerencias son bienvenidas!

## 📄 Licencia

MIT

---

## 📞 Soporte

Para dudas sobre Mercado Pago:
- [Documentación oficial](https://www.mercadopago.cl/developers/es/docs)
- [Foro de desarrolladores](https://www.mercadopago.cl/developers/es/support)

---

Hecho con 💝 para el bautizo de nuestras gemelas
