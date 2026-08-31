# 🏗️ Arquitectura del Sistema

Documentación técnica detallada de la arquitectura de la Mesa de Regalos Digital.

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura de Alto Nivel](#arquitectura-de-alto-nivel)
3. [Frontend](#frontend)
4. [Backend](#backend)
5. [Base de Datos](#base-de-datos)
6. [Integración con Mercado Pago](#integración-con-mercado-pago)
7. [Flujos de Datos](#flujos-de-datos)
8. [Decisiones de Diseño](#decisiones-de-diseño)

---

## 🎯 Visión General

### Objetivo
Aplicación web full-stack para gestionar regalos en dinero para el bautizo de gemelas, con pagos electrónicos y panel administrativo.

### Arquitectura Elegida
**Monorepo con separación frontend/backend**

**Ventajas:**
- ✅ Código organizado en un solo repositorio
- ✅ Compartir tipos TypeScript entre frontend y backend
- ✅ Deploy independiente de cada parte
- ✅ Versionado unificado
- ✅ Fácil de desarrollar localmente

**Stack:**
- **Frontend:** React SPA (Single Page Application)
- **Backend:** RESTful API con Express
- **Database:** SQLite (dev) → PostgreSQL (prod)
- **Payments:** Mercado Pago Checkout Pro

---

## 🌐 Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                         NAVEGADOR DEL USUARIO                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    REACT SPA (Frontend)                  │   │
│  │  • Home Page          • Regalos (Catálogo)              │   │
│  │  • Checkout           • Confirmación de Pago            │   │
│  │  • Admin Panel        • Dashboard + CRUD                │   │
│  └──────────────┬───────────────────────────────────────────┘   │
└─────────────────┼───────────────────────────────────────────────┘
                  │ HTTP/HTTPS
                  │ REST API Calls
                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SERVIDOR BACKEND (Express)                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Capa de Rutas                                           │   │
│  │  • /api/regalos       • /api/preferencia                 │   │
│  │  • /api/webhook       • /api/admin/*                     │   │
│  └───────────────┬──────────────────────────────────────────┘   │
│                  │                                               │
│  ┌───────────────┴──────────────────────────────────────────┐   │
│  │  Capa de Controladores                                   │   │
│  │  • regalos.controller    • preferencia.controller        │   │
│  │  • webhook.controller    • admin.controller              │   │
│  └───────────────┬──────────────────────────────────────────┘   │
│                  │                                               │
│  ┌───────────────┴──────────────────────────────────────────┐   │
│  │  Servicios y Lógica de Negocio                           │   │
│  │  • Prisma Client      • Mercado Pago SDK                 │   │
│  │  • Cálculos de comisión • Validaciones                   │   │
│  └───────────────┬──────────────────────────────────────────┘   │
└──────────────────┼──────────────────────────────────────────────┘
                   │
      ┌────────────┴────────────┐
      │                         │
      ↓                         ↓
┌─────────────────┐   ┌─────────────────────────┐
│   BASE DE DATOS │   │   MERCADO PAGO API      │
│   PostgreSQL    │   │   • Checkout Pro        │
│   • Event       │   │   • Payment Status      │
│   • Gift        │   │   • Webhooks            │
│   • Contribution│   └─────────────────────────┘
└─────────────────┘
```

---

## 💻 Frontend

### Tecnologías

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.3 | UI framework |
| TypeScript | 5.7 | Type safety |
| Vite | 6.4 | Build tool |
| React Router | 7.x | Routing |
| Tailwind CSS | 3.x | Styling |
| Context API | - | State management |

### Estructura de Carpetas

```
frontend/src/
├── pages/                  # Páginas completas
│   ├── Home.tsx            # Landing page
│   ├── Regalos.tsx         # Catálogo
│   ├── Checkout.tsx        # Formulario de pago
│   ├── PagoExitoso.tsx     # Success page
│   ├── PagoFallido.tsx     # Error page
│   ├── PagoPendiente.tsx   # Pending page
│   └── admin/
│       ├── Login.tsx       # Admin login
│       ├── Dashboard.tsx   # Admin dashboard
│       ├── Contribuciones.tsx  # Contributions table
│       ├── Regalos.tsx     # Gift CRUD
│       └── Configuracion.tsx   # Event config
│
├── components/             # Componentes reutilizables
│   ├── regalos/
│   │   └── TarjetaRegalo.tsx   # Gift card
│   ├── carrito/
│   │   └── CarritoFlotante.tsx # Shopping cart
│   └── admin/
│       └── ProtectedRoute.tsx  # Route guard
│
├── context/                # Estado global
│   ├── CarritoContext.tsx  # Shopping cart state
│   └── AuthContext.tsx     # Admin auth state
│
├── services/               # API clients
│   ├── api.ts              # Public API
│   └── adminApi.ts         # Admin API
│
├── types/                  # TypeScript interfaces
│   └── index.ts
│
├── utils/                  # Helpers
│   └── format.ts           # Currency & date formatting
│
├── App.tsx                 # Root component
└── main.tsx                # Entry point
```

### Patrones de Diseño

#### 1. Context API para Estado Global

**CarritoContext:**
- Gestiona items del carrito
- Métodos: `agregarAlCarrito`, `quitarDelCarrito`, `limpiarCarrito`
- Persiste en memoria (no localStorage para evitar inconsistencias)

**AuthContext:**
- Gestiona autenticación admin
- Token guardado en localStorage
- Auto-logout en refresh si token inválido

#### 2. Composición de Componentes

```typescript
// Página compuesta de componentes pequeños
<Regalos>
  <TarjetaRegalo /> x N
  <CarritoFlotante>
    <ItemCarrito /> x M
  </CarritoFlotante>
</Regalos>
```

#### 3. Protected Routes

```typescript
<Route
  path="/admin/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Flujo de Navegación

```
     [Home]
        │
        ↓ Ver Regalos
   [Regalos] ← → [Carrito Flotante]
        │            │
        │            ↓ Continuar
        │        [Checkout]
        │            │
        │            ↓ Pagar con MP
        │     [Mercado Pago]
        │            │
        ├────────────┼────────────┐
        ↓            ↓            ↓
[PagoExitoso]  [PagoFallido]  [PagoPendiente]


Admin Flow:
[Admin Login] → [Dashboard] → [Contribuciones]
                     │
                     ├→ [Gestionar Regalos]
                     └→ [Configuración]
```

---

## 🔧 Backend

### Tecnologías

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 20+ | Runtime |
| Express | 4.21 | Web framework |
| TypeScript | 5.7 | Type safety |
| Prisma | 5.22 | ORM |
| tsx | - | TS execution |
| Mercado Pago SDK | latest | Payment integration |

### Estructura de Carpetas

```
backend/src/
├── routes/
│   └── index.ts            # Route definitions
│
├── controllers/
│   ├── regalos.controller.ts      # Public endpoints
│   ├── preferencia.controller.ts  # Payment creation
│   ├── webhook.controller.ts      # MP notifications
│   └── admin.controller.ts        # Admin CRUD
│
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   └── mercadopago.ts      # MP SDK config
│
├── utils/
│   └── currency.ts         # Commission calculations
│
├── middlewares/
│   └── verificarAuth.ts    # Admin auth middleware
│
└── index.ts                # Server entry point
```

### Capas de la Aplicación

#### 1. Capa de Rutas (`routes/index.ts`)

Define los endpoints y middlewares:

```typescript
// Rutas públicas
router.get('/regalos', getRegalos);
router.get('/regalos/:id', getRegaloById);
router.get('/evento', getEvento);
router.post('/preferencia', crearPreferencia);
router.post('/webhook', webhookMercadoPago);

// Rutas admin (protegidas)
router.post('/admin/login', adminLogin);
router.get('/admin/stats', verificarAuth, getStats);
router.get('/admin/contribuciones', verificarAuth, getContribuciones);
router.post('/admin/regalos', verificarAuth, crearRegalo);
router.put('/admin/regalos/:id', verificarAuth, actualizarRegalo);
router.delete('/admin/regalos/:id', verificarAuth, eliminarRegalo);
router.put('/admin/evento', verificarAuth, actualizarEvento);
router.get('/admin/export-csv', verificarAuth, exportarCSV);
```

#### 2. Capa de Controladores

**Responsabilidades:**
- Validar entrada del request
- Llamar a servicios/modelos
- Formatear respuesta
- Manejo de errores

**Ejemplo:**
```typescript
export const crearPreferencia = async (req: Request, res: Response) => {
  try {
    // 1. Validar entrada
    const { invitado, regalos } = req.body;
    if (!invitado || !regalos) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    // 2. Lógica de negocio
    const preference = await crearPreferenciaMP(invitado, regalos);

    // 3. Respuesta exitosa
    res.json({
      initPoint: preference.init_point,
      preferenceId: preference.id
    });
  } catch (error) {
    // 4. Manejo de errores
    res.status(500).json({ error: 'Error al crear preferencia' });
  }
};
```

#### 3. Capa de Servicios

**Prisma Client:**
- Singleton para evitar múltiples conexiones
- Todas las queries pasan por Prisma
- Type-safe con TypeScript

**Mercado Pago SDK:**
- Configurado con Access Token
- Clients: `preferenceClient`, `paymentClient`
- Wrapper para manejo de errores

#### 4. Middlewares

**verificarAuth:**
```typescript
export const verificarAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || authHeader !== 'Bearer admin-authenticated') {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  next();
};
```

**CORS:**
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

---

## 🗄️ Base de Datos

### Prisma Schema

```prisma
// Configuración del evento
model Event {
  id                 Int      @id @default(autoincrement())
  nombreGemela1      String
  nombreGemela2      String
  fecha              DateTime
  hora               String
  lugar              String
  mensajeBienvenida  String
  portadaUrl         String
  modoComision       String   @default("modo_a")
}

// Catálogo de regalos
model Gift {
  id                  Int            @id @default(autoincrement())
  nombre              String
  descripcion         String
  precioCLP           Int
  imagenUrl           String
  permiteColaborativo Boolean        @default(false)
  montoRecaudadoCLP   Int            @default(0)
  estado              String         @default("disponible")
  contributions       Contribution[]
}

// Registro de contribuciones
model Contribution {
  id              Int      @id @default(autoincrement())
  giftId          Int?
  gift            Gift?    @relation(fields: [giftId], references: [id])
  montoBrutoCLP   Int
  comisionCLP     Int
  montoNetoCLP    Int
  nombreInvitado  String
  emailInvitado   String
  dedicatoria     String?
  estadoPago      String   @default("pending")
  mpPaymentId     String   @unique
  createdAt       DateTime @default(now())
}
```

### Relaciones

```
Event (1) ←→ (configuración global)

Gift (1) ←→ (N) Contribution
  - Un regalo puede tener múltiples contribuciones (colaborativo)
  - Una contribución pertenece a un regalo (o ninguno si es aporte libre)
```

### Índices

```prisma
// Índice único para idempotencia de webhooks
@@unique([mpPaymentId])

// Índice para búsquedas rápidas
@@index([giftId])
@@index([estadoPago])
```

---

## 💳 Integración con Mercado Pago

### Flujo de Pago Completo

```
1. Usuario selecciona regalos
        ↓
2. Frontend: POST /api/preferencia
        ↓
3. Backend: Valida regalos contra BD
        ↓
4. Backend: Calcula comisión (modo A o B)
        ↓
5. Backend: Crea preferencia en MP
        ↓
6. Backend: Retorna initPoint
        ↓
7. Frontend: Redirige a MP Checkout
        ↓
8. Usuario: Paga en Mercado Pago
        ↓
9. MP: Envía webhook a /api/webhook
        ↓
10. Backend: Verifica pago con MP API
        ↓
11. Backend: Actualiza BD (idempotente)
        ↓
12. MP: Redirige a /pago-exitoso
```

### Crear Preferencia

```typescript
// backend/src/controllers/preferencia.controller.ts

const preference = await preferenceClient.create({
  body: {
    items: [
      {
        title: regalo.nombre,
        quantity: 1,
        unit_price: totalCharge,
        currency_id: 'CLP'
      }
    ],
    payer: {
      name: invitado.nombre,
      email: invitado.email
    },
    back_urls: {
      success: `${FRONTEND_URL}/pago-exitoso`,
      failure: `${FRONTEND_URL}/pago-fallido`,
      pending: `${FRONTEND_URL}/pago-pendiente`
    },
    auto_return: 'approved',
    external_reference: JSON.stringify({
      invitado,
      regalos,
      payment: {
        montoBruto: totalCharge,
        comision,
        montoNeto: netAmount
      }
    }),
    notification_url: `${BACKEND_URL}/api/webhook`
  }
});
```

### Webhook Idempotente

**Problema:** MP puede enviar el mismo webhook múltiples veces.

**Solución:** Constraint `@unique` en `mpPaymentId`

```typescript
// Verificar si ya fue procesado
const existingContribution = await prisma.contribution.findUnique({
  where: { mpPaymentId: paymentId }
});

if (existingContribution) {
  return res.status(200).json({ received: true, duplicate: true });
}

// Procesar solo si es nuevo
```

### Estados de Pago

| Estado MP | Estado en BD | Acción |
|-----------|--------------|--------|
| `approved` | `approved` | Actualiza regalo, guarda contribución |
| `pending` | `pending` | Guarda contribución sin actualizar regalo |
| `rejected` | `rejected` | Guarda contribución sin actualizar regalo |
| `cancelled` | `rejected` | Guarda contribución sin actualizar regalo |

---

## 🔄 Flujos de Datos

### Flujo 1: Ver Catálogo

```
[Frontend]
    │
    ↓ GET /api/regalos
    │
[Backend: regalos.controller]
    │
    ↓ prisma.gift.findMany()
    │
[Database]
    │
    ↓ { regalos: [...], modoComision: "modo_a" }
    │
[Frontend]
    │
    ↓ Renderiza <TarjetaRegalo /> x N
```

### Flujo 2: Agregar al Carrito

```
[Frontend: TarjetaRegalo]
    │
    ↓ onClick
    │
[CarritoContext]
    │
    ↓ agregarAlCarrito(regalo)
    │
[Estado global]
    │
    ↓ Re-render <CarritoFlotante />
```

### Flujo 3: Checkout y Pago

```
[Frontend: Checkout]
    │ Usuario completa formulario
    ↓
    │ POST /api/preferencia { invitado, regalos }
    │
[Backend: preferencia.controller]
    │
    ├→ Validar regalos contra BD
    │  (evita manipulación de precios)
    │
    ├→ Calcular comisión según modo
    │
    ├→ Crear preferencia en MP
    │
    ↓ { initPoint: "https://mp.com/checkout/..." }
    │
[Frontend]
    │ window.location.href = initPoint
    │
[Mercado Pago]
    │ Usuario paga
    ↓
    ├→ Webhook POST /api/webhook
    │
[Backend: webhook.controller]
    │
    ├→ Verificar pago con MP API
    │
    ├→ Guardar contribución (idempotente)
    │
    ├→ Actualizar montoRecaudadoCLP
    │
    ├→ Si completo: estado = "pagado"
    │
    ↓
[Database actualizada]
    │
    ↓
[MP redirige]
    │
    ↓ GET /pago-exitoso?payment_id=123
    │
[Frontend: PagoExitoso]
```

### Flujo 4: Admin Dashboard

```
[Frontend: Dashboard]
    │
    ↓ GET /admin/stats + Auth header
    │
[Backend: verificarAuth middleware]
    │
    ├→ Verifica token
    │
    ↓ admin.controller.getStats
    │
[Backend: Queries agregadas]
    │
    ├→ SUM(montoNetoCLP)
    ├→ COUNT(contributions)
    ├→ SUM(comisionCLP)
    ├→ COUNT(gifts WHERE estado="pagado")
    │
    ↓ { contribuciones: {...}, regalos: {...} }
    │
[Frontend: Renderiza 4 tarjetas]
```

---

## 🧠 Decisiones de Diseño

### 1. ¿Por qué Monorepo?

**Alternativas consideradas:**
- Repositorios separados (frontend / backend)
- Monolito (todo junto sin separación)

**Decisión: Monorepo con npm workspaces**

**Razones:**
- ✅ Compartir tipos TypeScript sin npm publish
- ✅ Deploy independiente de cada parte
- ✅ Un solo `git clone` para empezar
- ✅ Versionado unificado
- ✅ CI/CD simplificado

### 2. ¿Por qué SQLite en dev y PostgreSQL en prod?

**Decisión: SQLite para desarrollo, PostgreSQL para producción**

**Razones:**
- ✅ SQLite: cero configuración, archivo local
- ✅ PostgreSQL: mejor para concurrencia
- ✅ Prisma abstrae diferencias
- ✅ Migración sencilla (solo cambiar `provider`)

### 3. ¿Por qué Context API en vez de Redux/Zustand?

**Decisión: Context API de React**

**Razones:**
- ✅ Suficiente para este tamaño de app
- ✅ Cero dependencias extra
- ✅ Integración nativa con React
- ✅ Carrito y auth no requieren persistencia compleja

### 4. ¿Por qué Checkout Pro en vez de Checkout Transparente?

**Decisión: Mercado Pago Checkout Pro (hosted checkout)**

**Razones:**
- ✅ MP maneja validaciones de tarjeta
- ✅ No necesitamos guardar datos sensibles
- ✅ Soporte nativo para cuotas
- ✅ Más fácil de implementar
- ✅ PCI compliance incluido

### 5. ¿Por qué calcular comisión en backend?

**Decisión: NUNCA confiar en precios del frontend**

**Razones:**
- ✅ Seguridad: evita manipulación de precios
- ✅ Validar contra BD antes de crear preferencia
- ✅ Recalcular comisión con tasa actual
- ✅ Un solo punto de verdad (database)

**Ejemplo de ataque prevenido:**
```javascript
// ❌ MAL: Usuario podría hacer esto en DevTools
fetch('/api/preferencia', {
  body: JSON.stringify({
    regalos: [{ id: 1, precioCLP: 1 }]  // ¡Precio falso!
  })
});

// ✅ BIEN: Backend valida contra BD
const dbGift = await prisma.gift.findUnique({ where: { id: regalos[0].id } });
if (dbGift.precioCLP !== regalos[0].precioCLP) {
  throw new Error('Precio inválido');
}
```

### 6. ¿Por qué idempotencia en webhooks?

**Decisión: `mpPaymentId` como unique constraint**

**Razones:**
- ✅ MP puede reenviar webhooks
- ✅ Evita duplicar contribuciones
- ✅ `@unique` en BD = idempotencia garantizada
- ✅ Responder 200 aunque sea duplicado (MP requiere)

### 7. ¿Por qué autenticación simple para admin?

**Decisión: Password en .env + token Bearer**

**Razones:**
- ✅ Suficiente para MVP (no es banca online)
- ✅ Solo 1 admin (los padres)
- ✅ Panel no expone datos sensibles bancarios
- ✅ HTTPS ya provee encriptación en tránsito
- ⚠️ **Nota:** Para producción enterprise considerar OAuth2/JWT

---

## 📈 Escalabilidad

### Limitaciones Actuales

1. **Auth simple:** Un solo password
2. **SQLite:** No soporta alta concurrencia
3. **Sin caché:** Queries directas siempre
4. **Sin CDN para imágenes:** URLs externas

### Mejoras Futuras

Si el proyecto crece:

1. **Auth mejorada:**
   - JWT con refresh tokens
   - Multi-usuario con roles
   - 2FA para admin

2. **Base de datos:**
   - Migrar a PostgreSQL en desarrollo
   - Connection pooling (PgBouncer)
   - Read replicas

3. **Caché:**
   - Redis para catálogo de regalos
   - Cache de API responses
   - Session storage en Redis

4. **CDN y Assets:**
   - Cloudinary/Cloudflare Images
   - Lazy loading de imágenes
   - WebP con fallback

5. **Monitoreo:**
   - Sentry para errores
   - Datadog/New Relic para APM
   - Alertas de Slack

---

## 🔍 Patrones Usados

| Patrón | Ubicación | Propósito |
|--------|-----------|-----------|
| **Singleton** | `prisma.ts` | Una sola instancia de cliente |
| **Factory** | `mercadopago.ts` | Crear clients configurados |
| **Middleware Chain** | `routes/index.ts` | Autenticación, logging, CORS |
| **Repository** | Controllers + Prisma | Abstracción de BD |
| **DTO** | Types | Transferir datos entre capas |
| **Provider** | Context API | Inyección de dependencias |
| **Strategy** | `currency.ts` | Dos modos de comisión |

---

## 🧪 Testing (Futuro)

Para implementar tests:

```bash
# Frontend
npm install --save-dev vitest @testing-library/react

# Backend
npm install --save-dev jest supertest @types/jest
```

**Prioridades de testing:**
1. Cálculos de comisión (crítico para dinero)
2. Webhook idempotencia
3. Validación de precios
4. Auth middleware
5. Flujos de pago end-to-end

---

## 📚 Referencias

- **Arquitectura Clean:** https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- **REST API Best Practices:** https://restfulapi.net/
- **React Patterns:** https://reactpatterns.com/
- **Mercado Pago Integration:** https://www.mercadopago.cl/developers/es/docs/checkout-pro/landing

---

<div align="center">

**Arquitectura diseñada para ser simple, segura y escalable** 🚀

</div>
