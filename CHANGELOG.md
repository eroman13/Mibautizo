# 📝 Changelog

Registro de todos los cambios notables en el proyecto Mesa de Regalos Digital.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-28

### 🎉 Release Inicial

Primera versión completa y funcional de la Mesa de Regalos Digital para el bautizo de Antonia y Emilia.

### ✨ Added - Funcionalidades Nuevas

#### Frontend Público
- **Landing Page (Home)** con información del evento
  - Imagen de portada personalizable
  - Nombres de las gemelas
  - Fecha, hora y lugar del bautizo
  - Mensaje de bienvenida personalizable
  - Botón CTA a catálogo

- **Catálogo de Regalos** interactivo
  - Grid responsive (1-4 columnas según dispositivo)
  - Tarjetas de regalo con imagen, nombre, descripción y precio
  - Badge "Ya regalado 💝" para regalos completados
  - Barra de progreso para regalos colaborativos
  - Botón "Agregar al carrito" con validaciones

- **Carrito de Compras Flotante**
  - Slide-in desde la derecha
  - Lista de items seleccionados
  - Total calculado automáticamente
  - Contador de items en badge
  - Botones para quitar items y continuar

- **Checkout con Integración de Mercado Pago**
  - Formulario con validación de campos
  - Campos: nombre, email (requeridos), dedicatoria (opcional)
  - Resumen de regalos seleccionados
  - Desglose de montos (según modo de comisión)
  - Redirección a Mercado Pago Checkout Pro

- **Páginas Post-Pago**
  - `/pago-exitoso` - Confirmación de pago aprobado
  - `/pago-fallido` - Mensaje de error con sugerencias
  - `/pago-pendiente` - Estado de pago pendiente

#### Panel Administrativo
- **Sistema de Autenticación**
  - Login con contraseña
  - Token guardado en localStorage
  - Logout funcional
  - Rutas protegidas con ProtectedRoute

- **Dashboard con Estadísticas**
  - Total Neto Recaudado (tarjeta verde)
  - Contribuciones (cantidad, promedio) (tarjeta azul)
  - Comisiones MP (tarjeta naranja)
  - Regalos pagados vs disponibles (tarjeta púrpura)
  - Accesos rápidos a otras secciones

- **Gestión de Contribuciones**
  - Tabla completa con todas las contribuciones
  - Filtro por nombre de invitado o regalo
  - Exportación a CSV con formato UTF-8 + BOM
  - Resumen de totales (bruto, comisión, neto)
  - Vista detallada de dedicatorias

- **CRUD de Regalos**
  - Crear nuevos regalos con modal
  - Editar regalos existentes
  - Eliminar regalos (con validación de contribuciones)
  - Vista en grid con tarjetas
  - Campos: nombre, descripción, precio, imagen, colaborativo

- **Configuración del Evento**
  - Editar nombres de las gemelas
  - Configurar fecha, hora y lugar
  - URL de imagen de portada
  - Mensaje de bienvenida
  - **Selector de modo de comisión**:
    - Modo A: Invitado cubre la comisión
    - Modo B: Organizador asume la comisión

#### Backend API
- **Endpoints Públicos**
  - `GET /api/regalos` - Listar todos los regalos
  - `GET /api/regalos/:id` - Detalle de regalo con contribuciones
  - `GET /api/evento` - Información del evento
  - `POST /api/preferencia` - Crear preferencia de pago en MP
  - `POST /api/webhook` - Recibir notificaciones de MP

- **Endpoints Admin (protegidos)**
  - `POST /api/admin/login` - Autenticación
  - `GET /api/admin/stats` - Estadísticas agregadas
  - `GET /api/admin/contribuciones` - Listar contribuciones
  - `POST /api/admin/regalos` - Crear regalo
  - `PUT /api/admin/regalos/:id` - Actualizar regalo
  - `DELETE /api/admin/regalos/:id` - Eliminar regalo
  - `PUT /api/admin/evento` - Actualizar configuración
  - `GET /api/admin/export-csv` - Exportar contribuciones

#### Base de Datos
- **Schema Prisma** con 3 modelos:
  - `Event` - Configuración del evento
  - `Gift` - Catálogo de regalos
  - `Contribution` - Registro de contribuciones

- **Migraciones**
  - Migración inicial con todas las tablas
  - Constraints e índices optimizados
  - `mpPaymentId` único para idempotencia

- **Seed Data**
  - 1 evento de ejemplo (bautizo de Antonia y Emilia)
  - 11 regalos de ejemplo con precios variados
  - 3 regalos colaborativos incluidos

#### Integración con Mercado Pago
- **Checkout Pro** implementado
  - Creación de preferencias de pago
  - Back URLs configuradas (success, failure, pending)
  - External reference con datos completos
  - Notification URL para webhooks

- **Webhooks Idempotentes**
  - Verificación de pago con API de MP
  - Constraint único en `mpPaymentId`
  - Actualización automática de regalos
  - Soporte para regalos colaborativos con progreso

- **Cálculo de Comisiones**
  - Modo A: `totalCharge = baseAmount / (1 - rate)`
  - Modo B: `netAmount = baseAmount - (baseAmount * rate)`
  - Tasa configurable vía variable de entorno
  - Validación de precios contra base de datos

#### Arquitectura y Configuración
- **Monorepo** con npm workspaces
  - Frontend y backend en carpetas separadas
  - Package.json raíz con scripts unificados
  - Concurrently para ejecutar ambos servidores

- **TypeScript** en todo el stack
  - Tipos compartidos entre frontend y backend
  - Validación en tiempo de compilación
  - IntelliSense mejorado

- **Variables de Entorno**
  - `.env.example` documentado
  - Configuración separada para frontend y backend
  - Credenciales de MP nunca expuestas al cliente

### 🛠️ Technical Stack

- **Frontend:**
  - React 18.3 + TypeScript 5.7
  - Vite 6.4.3 (build tool)
  - Tailwind CSS 3 (estilos)
  - React Router 7 (navegación)
  - Context API (estado global)

- **Backend:**
  - Node.js 20+ + Express 4.21
  - TypeScript 5.7
  - tsx (ejecución de TS)
  - Prisma ORM 5.22
  - Mercado Pago SDK

- **Base de Datos:**
  - SQLite (desarrollo)
  - PostgreSQL (producción recomendado)

### 📚 Documentación

- **README.md** - Guía completa de instalación y uso
- **DEPLOYMENT.md** - Guía de despliegue a producción
- **ARCHITECTURE.md** - Documentación técnica de arquitectura
- **TESTING.md** - Guía de pruebas y QA
- **RESOURCES.md** - Enlaces y recursos útiles
- **CHANGELOG.md** - Este archivo

### 🔒 Seguridad

- Validación de precios en backend (nunca confiar en frontend)
- Middleware de autenticación para rutas admin
- CORS configurado correctamente
- Webhooks idempotentes con constraint único
- Variables de entorno para credenciales sensibles
- .gitignore completo para evitar leaks

### 🎨 Diseño

- Tema pastel personalizado (azul, rosa, durazno, lavanda)
- Responsive mobile-first
- Componentes reutilizables
- Loading states
- Error boundaries

### ✅ Testing

- Tarjetas de prueba de Mercado Pago documentadas
- Guía de testing con ngrok para webhooks locales
- Checklist de QA completo
- Casos de prueba end-to-end

---

## [Unreleased] - Próximas Mejoras

### Planificado para v1.1.0

- [ ] Envío de emails de confirmación (Resend/SendGrid)
- [ ] Notificaciones push para admin
- [ ] Mejora de accesibilidad (ARIA labels)
- [ ] Tests automatizados (Vitest + Jest)
- [ ] CI/CD con GitHub Actions

### Ideas para v2.0.0

- [ ] Sistema RSVP para invitados
- [ ] Galería de fotos del evento
- [ ] Contador regresivo dinámico
- [ ] Integración con WhatsApp Business
- [ ] Multi-idioma (ES/EN)
- [ ] Tema personalizable (dark mode)
- [ ] App móvil (React Native)

### Mejoras Técnicas Futuras

- [ ] Migrar a Next.js (SSR/SSG)
- [ ] Rate limiting en API
- [ ] Redis para caché
- [ ] Sentry para error tracking
- [ ] Logger estructurado (Winston)
- [ ] Validación con Zod
- [ ] E2E tests con Playwright

---

## Tipos de Cambios

- `Added` - Nuevas funcionalidades
- `Changed` - Cambios en funcionalidades existentes
- `Deprecated` - Funcionalidades que se eliminarán pronto
- `Removed` - Funcionalidades eliminadas
- `Fixed` - Corrección de bugs
- `Security` - Mejoras de seguridad

---

## Formato de Versiones

Versionado semántico: `MAJOR.MINOR.PATCH`

- **MAJOR:** Cambios incompatibles en la API
- **MINOR:** Nuevas funcionalidades compatibles hacia atrás
- **PATCH:** Corrección de bugs compatibles hacia atrás

---

## Releases

### [1.0.0] - 2026-08-28

**Release inicial estable** - Lista para producción

Incluye todas las funcionalidades core:
- Catálogo público
- Checkout con MP
- Panel admin completo
- Webhooks funcionales
- Documentación completa

---

<div align="center">

**Mantén actualizado este archivo con cada release** 📝

</div>
