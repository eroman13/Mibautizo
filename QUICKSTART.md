# ⚡ Quick Start Guide

Guía rápida de 5 minutos para tener el proyecto corriendo localmente.

---

## 📋 Requisitos Previos

Antes de empezar, asegúrate de tener:

- ✅ **Node.js 20+** instalado ([descargar](https://nodejs.org/))
- ✅ **npm** (incluido con Node.js)
- ✅ **Git** instalado
- ✅ Editor de código (VS Code recomendado)

Verifica las versiones:
```bash
node -v    # Debe ser v20.0.0 o superior
npm -v     # Debe ser v10.0.0 o superior
```

---

## 🚀 Instalación Rápida (5 pasos)

### Paso 1: Clonar el Repositorio

```bash
# Clona el proyecto
git clone <url-del-repositorio>
cd mesa-regalos-bautizo-gemelas
```

### Paso 2: Instalar Dependencias

```bash
# Instala todas las dependencias de una vez
npm run install:all

# Esto ejecuta:
# - npm install (raíz)
# - npm install en frontend/
# - npm install en backend/
```

⏱️ **Tiempo estimado:** 1-2 minutos

### Paso 3: Configurar Variables de Entorno

```bash
# Copia el template
cp .env.example .env
cp .env.example backend/.env
cp frontend/.env.example frontend/.env
```

**Edita `.env` y `backend/.env`:**

```bash
# Abre con tu editor favorito
code .env          # VS Code
nano .env          # Terminal
```

**Mínimo requerido para empezar:**
```env
# En .env y backend/.env:
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="gemelas2026"
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3000"

# Puedes usar estas credenciales de PRUEBA temporalmente:
MP_ACCESS_TOKEN="TEST-tu-token-aqui"
MP_PUBLIC_KEY="TEST-tu-key-aqui"
MP_COMMISSION_RATE="0.038"
```

**En `frontend/.env`:**
```env
VITE_API_URL="http://localhost:3000/api"
```

> 💡 **Nota:** Para pagos reales, obtén tus [credenciales de Mercado Pago](https://www.mercadopago.cl/developers/panel/credentials)

### Paso 4: Configurar la Base de Datos

```bash
cd backend

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones (crear tablas)
npx prisma migrate dev

# Poblar con datos de ejemplo
npx prisma db seed

cd ..
```

Esto crea:
- ✅ Base de datos SQLite (`backend/dev.db`)
- ✅ 1 evento (bautizo de Antonia y Emilia)
- ✅ 11 regalos de ejemplo

⏱️ **Tiempo estimado:** 30 segundos

### Paso 5: Ejecutar el Proyecto

```bash
# Ejecuta backend + frontend simultáneamente
npm run dev
```

**Output esperado:**
```
[0] 🚀 Servidor backend corriendo en http://localhost:3000
[1] ➜  Local:   http://localhost:5173/
```

⏱️ **Tiempo de inicio:** 10-15 segundos

---

## ✅ Verificación

### Frontend

Abre en tu navegador: **http://localhost:5173**

Deberías ver:
- ✅ Página de inicio con portada
- ✅ Nombres "Antonia" y "Emilia"
- ✅ Fecha del evento
- ✅ Botón "Ver Nuestros Regalos"

### Backend

En otra terminal, prueba la API:

```bash
# Obtener lista de regalos
curl http://localhost:3000/api/regalos | jq

# Deberías ver un JSON con 11 regalos
```

### Panel Admin

1. Ve a: **http://localhost:5173/admin/login**
2. Contraseña: `gemelas2026`
3. Deberías ver el dashboard con estadísticas

---

## 🎯 ¿Qué Hacer Ahora?

### 1. Explorar el Frontend Público

```
http://localhost:5173
```

- Navega a "Ver Regalos"
- Agrega regalos al carrito
- Simula un checkout

### 2. Probar el Panel Admin

```
http://localhost:5173/admin/login
Contraseña: gemelas2026
```

- Ve las estadísticas (estarán en 0 por ahora)
- Explora las secciones de Contribuciones, Regalos, Configuración
- Edita la información del evento

### 3. Hacer un Pago de Prueba

Para probar pagos necesitas:

1. **Credenciales de Mercado Pago:**
   - Ve a: https://www.mercadopago.cl/developers/panel/credentials
   - Selecciona "Credenciales de prueba"
   - Copia Access Token y Public Key
   - Pégalas en `.env` y `backend/.env`
   - Reinicia el backend

2. **Usar tarjeta de prueba:**
   ```
   Número: 5031 7557 3453 0604
   CVV: 123
   Vencimiento: 11/25
   Nombre: APRO
   Email: test@test.com
   ```

3. **Flujo completo:**
   - Selecciona un regalo
   - Completa checkout
   - Paga en Mercado Pago
   - Verás la confirmación
   - Revisa el admin panel

### 4. Personalizar el Evento

En el panel admin → Configuración:

- Cambia los nombres de las gemelas
- Ajusta fecha y hora
- Modifica el mensaje de bienvenida
- Cambia la imagen de portada

---

## 📚 Próximos Pasos

### Si Todo Funciona

Lee la documentación completa:
- 📖 **[README.md](./README.md)** - Guía completa
- 🚀 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Desplegar a producción
- 🏗️ **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Entender la arquitectura
- 🧪 **[TESTING.md](./TESTING.md)** - Guía de pruebas

### Si Algo No Funciona

Revisa:
- 🐛 **[Troubleshooting en README](./README.md#-troubleshooting)**
- 💬 Issues de GitHub del proyecto
- 📞 Abre un nuevo issue con detalles del error

---

## 🛠️ Comandos Útiles

### General

```bash
npm run dev              # Ejecutar frontend + backend
npm run dev:frontend     # Solo frontend
npm run dev:backend      # Solo backend
npm run install:all      # Re-instalar todas las dependencias
```

### Frontend

```bash
cd frontend
npm run dev              # Servidor de desarrollo
npm run build            # Build de producción
npm run preview          # Preview del build
```

### Backend

```bash
cd backend
npm run dev              # Servidor con tsx watch
npx prisma studio        # Interfaz gráfica para la BD
npx prisma migrate dev   # Crear nueva migración
npx prisma db seed       # Re-ejecutar seed
```

---

## 🔍 Estructura Básica

```
mesa-regalos-bautizo-gemelas/
├── frontend/           # React app
│   ├── src/
│   │   ├── pages/      # Páginas
│   │   ├── components/ # Componentes
│   │   └── ...
│   └── package.json
│
├── backend/            # API REST
│   ├── src/
│   │   ├── routes/     # Rutas de la API
│   │   ├── controllers/# Lógica de negocio
│   │   └── ...
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── .env                # Variables de entorno
├── README.md           # Documentación completa
└── package.json        # Workspace raíz
```

---

## 💡 Tips

### Reiniciar desde Cero

Si algo se rompe, siempre puedes empezar de nuevo:

```bash
# Borrar node_modules y reinstalar
rm -rf node_modules frontend/node_modules backend/node_modules
npm run install:all

# Recrear base de datos
cd backend
rm dev.db
npx prisma migrate dev
npx prisma db seed
cd ..

# Reiniciar servidores
npm run dev
```

### Ver Logs en Tiempo Real

```bash
# Terminal 1: Backend logs
cd backend && npm run dev

# Terminal 2: Frontend logs
cd frontend && npm run dev
```

### Inspeccionar la Base de Datos

```bash
cd backend
npx prisma studio
# Abre http://localhost:5555
```

---

## 🎓 Recursos de Aprendizaje

Si eres nuevo en alguna tecnología del stack:

- **React:** https://react.dev/learn
- **TypeScript:** https://www.typescriptlang.org/docs/
- **Prisma:** https://www.prisma.io/docs/getting-started
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Mercado Pago:** https://www.mercadopago.cl/developers/es/docs

---

## ❓ FAQ Rápido

### ¿Por qué el puerto es 5173 en vez de 5173?

Vite puede auto-seleccionar otro puerto si 5173 está ocupado. Verifica en el output de `npm run dev`.

### ¿Cómo cambio la contraseña del admin?

Edita `ADMIN_PASSWORD` en `.env` y `backend/.env`, luego reinicia el backend.

### ¿Puedo usar PostgreSQL en desarrollo?

Sí, edita `DATABASE_URL` en `.env` y cambia el `provider` en `schema.prisma` a `postgresql`.

### ¿Necesito pagar por Mercado Pago?

No para desarrollo. Las credenciales de prueba son gratis. Solo pagas comisiones en producción con pagos reales.

---

## 🎉 ¡Todo Listo!

Si llegaste hasta aquí, ya tienes:

- ✅ Proyecto corriendo localmente
- ✅ Base de datos con datos de ejemplo
- ✅ Frontend y backend funcionando
- ✅ Panel admin accesible

**¡Ahora puedes empezar a personalizar para tu evento! 🍼👶💕**

---

## 📞 ¿Necesitas Ayuda?

- 📖 Lee el [README completo](./README.md)
- 🐛 Revisa [Troubleshooting](./README.md#-troubleshooting)
- 💬 Abre un issue en GitHub
- 📧 Contacta al equipo de desarrollo

---

<div align="center">

**¡Bienvenido al proyecto! 🎈**

[Ver Documentación Completa](./README.md) • [Arquitectura](./ARCHITECTURE.md) • [Deploy](./DEPLOYMENT.md)

</div>
