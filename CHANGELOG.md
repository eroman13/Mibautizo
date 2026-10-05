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
  - Nombres de las mellizas
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
  - Editar nombres de las mellizas
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

## [1.1.0] - 2026-09-30

### ✨ Added - Álbum de fotos del evento

#### Backend
- **Modelo `Foto`** en Prisma (url, storage, autor, mensaje, invitacionToken, estado) con índices
  por `estado` y `createdAt`, más la migración `20260930120000_add_fotos_y_asistente_asiste`.
- **Endpoints públicos** (`/api/fotos`): listado de fotos aprobadas y subida por invitados
  (queda `pendiente` de moderación). Rate limit de 40 solicitudes cada 10 minutos.
- **Endpoints admin** (`/api/admin/fotos`): listado completo con resumen por estado, subida
  (se aprueba al instante), aprobar/rechazar/dejar pendiente y eliminar.
- **Almacenamiento**: las fotos se suben a Cloudflare R2 en la carpeta `fotos/`; si R2 no está
  configurado se guardan como data URL con un tope de 3 MB (8 MB si R2 está disponible).
- **Validación compartida** en `lib/imagen.ts` (firmas de archivo JPG/PNG/WEBP/GIF y tamaño),
  reutilizada por la subida del álbum y por `/upload-image`.
- `subirImagenR2` acepta prefijo/carpeta y se agregó `eliminarImagenR2` (borra el archivo del
  bucket al eliminar una foto del panel).
- **Diagnóstico de almacenamiento**: `npm run diagnose:r2` (backend/diagnose-r2.ts) verifica las
  variables `R2_*`, los permisos del token (subir/leer/borrar) y que la URL pública responda.
  Admite `--bucket`, `--public-url` y `--prefix` para comparar buckets sin tocar el `.env`.
- **Activación asistida del token**: `npm run r2:activar -- <access-key-id> <secret-access-key>`
  (backend/activar-r2.ts) escribe las claves en `.env` respetando el resto del archivo (con
  `--dry-run`, `--bucket`, `--public-url`, `--prefix`, `--env`) y encadena el diagnóstico,
  terminando con su mismo código de salida.
- **R2 activado y verificado**: bucket `mibautizo-recuerdos` con URL pública
  `https://pub-2f5965b2a1c644b98f0fb181a2bfae49.r2.dev`; `diagnose:r2` termina en `🎉 R2 listo`
  (subir / leer / borrar / URL pública 200) y `/api/health` responde `"storage":"r2"`.
  Las fotos del álbum ya no se guardan como base64 en la base de datos.
  Guía de configuración en `backend/R2_CONFIG.md`.

#### Frontend público
- **Nueva página `/fotos`**: subida de hasta 10 fotos a la vez (con compresión en el navegador),
  campos opcionales de autor y mensaje, y galería responsive con lightbox.
  Si la URL trae `?familia=` y `?token=` se precargan el nombre y el token de la invitación.
- Enlace al álbum desde el Home y registro de la página en analytics.

#### Frontend admin
- **Nueva página `/admin/fotos`**: resumen clicable (total / pendientes / aprobadas / rechazadas),
  filtrado por estado, aprobar, rechazar, dejar pendiente, eliminar y subir fotos oficiales.
  Cada foto muestra un indicador `· R2` / `· BD` para ver de un vistazo dónde está almacenada.
- Acceso desde la navegación y las acciones rápidas del Dashboard.

### 🐛 Fixed - Contador "No asistirán" en el panel de Asistencias

- Las invitaciones marcadas como **declinadas** desde el panel de Invitaciones no generaban fila
  en `Asistencia`, por lo que el resumen mostraba **0 personas** en "No asistirán". Ahora
  `sincronizarDeclinadas()` crea la confirmación declinada equivalente (idempotente) al abrir
  Asistencias, y `sincronizarDeclinacion()` lo hace al cambiar el estado a mano.
- Las personas que **no asistirán dentro de una familia que sí va** ya no se pierden: el frontend
  envía todas las personas con su flag `asiste` y el backend requiere al menos una que asista.
- El resumen de asistencias ahora distingue familias declinadas, personas sueltas que no asisten,
  total que no asistirá, total que sí asistirá y el estado de las invitaciones (respondidas,
  confirmadas, declinadas y sin responder).

### 🐛 Fixed - Fotos en formatos que el navegador no puede leer (HEIC de iPhone)

- Al elegir una foto en **HEIC/HEIF** (el formato de iPhone), **TIFF** o **RAW**, el navegador no
  puede decodificarla y la subida se cortaba con el mensaje genérico *“No se pudo cargar la
  imagen”*, que no decía ni qué archivo fallaba ni qué hacer. `comprimirImagen()` ahora identifica
  el formato (por MIME y, si viene vacío, por la extensión: las fotos reenviadas por WhatsApp
  pierden el MIME) y explica la salida: enviarla por WhatsApp/correo, hacer una captura de pantalla
  o, en iPhone, Ajustes → Cámara → Formatos → “Más compatible”.
- El resto de fallos al leer una foto ahora dicen **nombre, tipo y peso** (`foto.jpg`, `image/jpeg`,
  2.0 MB), para distinguir un archivo dañado o a medio descargar de un formato no soportado.
- Se avisa antes de intentar leer un archivo vacío o de más de 40 MB, y una foto que tarde más de
  60 s en procesarse ya no deja la subida colgada con la barra de progreso girando.
- En el álbum (público y admin) se recuerda qué formatos funcionan y el truco de iPhone, y subir la
  imagen de una fila en Regalos ya no falla en silencio si el formato no es válido.

### ✨ Added - Nueva experiencia para subir fotos y galería del álbum

- **Subir fotos ya no arranca solo:** al elegir archivos estos quedan en una **lista de espera con
  miniaturas** (y su peso), se pueden quitar de a una o todas con “Quitar todas”, y recién se envían
  al pulsar el botón **“📨 Enviar N fotos”** (deshabilitado mientras no haya fotos o mientras sube).
- El envío muestra una **barra de progreso** con porcentaje (“Enviando foto 2 de 5…”), y los fallos
  parciales dejan solo las fotos que fallaron en la lista para reintentar, sin perder las demás.
- **Aviso de revisión bien visible:** antes de elegir nada se explica que *“Tus fotos pasan por
  revisión antes de publicarse… aparecerán en la galería cuando los papás las aprueben”*, con los
  tres pasos (1. Tú las envías → 2. Los papás las aprueban → 3. Aparecen en la galería). Al terminar
  el envío se confirma que quedaron **en revisión** y no publicadas.
- **Galería separada y más amigable:** vive en su propia sección (separador decorativo entre subir y
  ver), con título “Galería de recuerdos”, contador de fotos aprobadas, botón **“Ver si hay nuevas”**
  para recargar sin salir de la página y un estado vacío que invita a subir la primera foto.
- Las fotos ahora muestran **autor, mensaje y fecha sobre la imagen** (al pasar el mouse en
  escritorio, siempre en móvil) e incluyen un ícono de zoom; el visor a pantalla completa suma
  **flechas anterior/siguiente, contador (3 / 12) y navegación con el teclado** (← → y Esc).
- Los problemas al cargar la galería y los de la subida se avisan por separado para no mezclar
  mensajes.


### ✨ Added - Panel de fotos: botón para actualizar y QR para las mesas

- **“🔄 Ver si hay nuevas”** en el panel (`/admin/fotos`): vuelve a pedir las fotos al servidor sin
  recargar la página, avisa cuántas llegaron desde la revisión anterior (“✅ Llegaron 3 fotos
  nuevas…”), muestra la hora de la última revisión y, si el servidor no responde, lo dice sin
  perder la lista que ya estaba en pantalla. Está en la tarjeta de subida y junto a la lista, que es
  donde aparecen las fotos nuevas.
- **Tarjeta “🔳 QR para las mesas”** (misma página): muestra el QR que lleva al álbum público, con
  vista previa de la tarjeta y acciones para **descargarlo en PNG o SVG, copiar el enlace, copiar un
  mensaje listo para WhatsApp, probar el enlace e imprimir tarjetas** (4 por hoja A4 para las mesas
  o 1 grande tipo letrero). El QR se arma con el dominio desde el que se abrió el panel (y se puede
  corregir a mano), usa corrección de errores alta y mantiene su espacio blanco alrededor, para que
  se lea bien impreso.
- **Generador de tarjetas imprimibles** (`npm run qr:mesas`): escribe en `qr/` el QR en PNG
  (1200 px) y en SVG vectorial, una **hoja A4 con 4 tarjetas** para cortar por la línea de puntos,
  una **tarjeta grande por hoja** y un `LEEME.md` con el paso a paso de impresión. Toma los nombres
  y la fecha reales desde la API (o se pasan a mano) y **verifica el QR decodificándolo** antes de
  guardarlo, así no se imprime un código roto; `--url` permite regenerar todo si cambia el dominio.
- **Tarjetas en hoja apaisada (horizontal)**: además de las hojas verticales, el panel y el
  generador producen la versión **A4 horizontal**, donde el QR queda a la izquierda y el texto a la
  derecha (la tarjeta es ancha y baja, ideal para doblarla por la mitad y dejarla parada en la mesa).
  - En `/admin/fotos → 🔳 QR para las mesas` hay un selector **Orientación de la hoja:
    ↕️ Vertical / ↔️ Horizontal** junto a “Tarjetas por hoja A4”, y la vista previa cambia de forma
    según lo que elijas.
  - `npm run qr:mesas` deja ahora cuatro archivos listos para imprimir:
    `tarjetas-mesas-4-por-hoja(-horizontal).pdf` y `tarjeta-mesas-1-por-hoja(-horizontal).pdf`
    (más sus `.html`), con la orientación de página ya fijada en el PDF.

### 🗄️ Base de datos


- `Asistente.asiste BOOLEAN DEFAULT true` (las filas existentes se mantienen como asistentes).
- Nueva tabla `Foto` con índices.

---

## [Unreleased] - Próximas Mejoras

### ✨ Added

- **Recordatorios para invitaciones sin confirmar**: en el panel `/admin/invitaciones` ahora se
  ve un resumen y un panel con las familias que aún no responden, un filtro "🔔 Sin confirmar",
  un botón "🔔 Recordar" por invitación (y otro dentro del modal de recordatorios) que abre
  WhatsApp con un mensaje de recordatorio ya redactado, incluyendo el enlace único de la
  invitación.
  - Nuevos campos en `Invitacion`: `recordatoriosEnviados` (contador) y
    `fechaUltimoRecordatorio`, visibles en la lista.
  - Nuevo endpoint `POST /api/admin/invitaciones/:id/recordatorio` (redirige el estado de
    "pendiente" a "enviada" la primera vez).
  - El resumen de `GET /api/admin/invitaciones` incluye `sinConfirmar`.

- **Imágenes en Cloudflare R2**: las imágenes subidas desde el panel (portada, portada móvil y
  fotos de regalos) ya no se guardan como base64 dentro de PostgreSQL: se suben al bucket R2 y
  en la base de datos solo queda la URL pública.
  - Nuevo módulo `backend/src/lib/r2.ts` (AWS SDK v3 - S3) con las variables `R2_ACCOUNT_ID`,
    `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` (y `R2_PREFIX`
    opcional). Si falta alguna, la subida sigue funcionando como antes (data URL en la BD),
    así que la app nunca se rompe por configuración faltante.
  - `POST /api/upload-image` ahora responde `{ success, imageUrl, storage: 'r2' | 'base64' }`.
  - Seguridad: `POST /api/upload-image` ahora exige token de admin (antes era público, cualquiera
    podía escribir imágenes) y tiene rate limit de 30 subidas por minuto.
  - Nuevo `adminApi.subirImagen()` en el frontend, usado por `Configuracion.tsx` y `Regalos.tsx`
    (así la llamada envía el token y se centraliza la subida).
  - `GET /api/health` ahora informa `storage` (`"r2"` o `"base64"`) para verificar la
    configuración en producción.

- **Informe de invitados y valores para la productora**: en el panel `/admin/asistencias` ahora hay
  una tarjeta "💰 Informe para la productora" que muestra la cantidad de invitados por categoría de
  edad y el valor a pagar según lo acordado: niños de 0 a 7 años no pagan, de 8 a 13 años $15.000 y
  jóvenes/adultos de 14 años o más $29.000 (con subtotales y total general).
  - Botón "🖨️ Imprimir / PDF" que abre el informe en una pestaña nueva listo para imprimir o guardar
    como PDF, y botón "📊 Excel" que descarga el resumen por categoría como CSV.
  - Nuevo módulo `src/utils/informeProductora.ts` con la lógica de cálculo, la vista imprimible y la
    exportación a Excel.

- **Tabla de asistencias más clara**: en `/admin/asistencias` se agregó la columna "Valor" con el monto
  a pagar por cada familia (según sus asistentes; los niños/as de 0 a 7 años no pagan), para no tener
  que calcularlo a mano.

- **Arreglo al borrar y volver a confirmar**: si los papás eliminan una confirmación desde el panel
  para corregir un dato, el enlace de invitación se rehabilita automáticamente para que la familia
  pueda responder de nuevo (antes el enlace quedaba "trabado" mostrando "ya confirmaste" y no se
  creaba el nuevo registro). `POST /api/confirmar-asistencia` y `GET /api/invitacion` ahora verifican
  que la confirmación asociada siga existiendo antes de bloquear una nueva respuesta.

- **Totales siempre actualizados**: las lecturas del panel admin (`asistencias`, `invitaciones`,
  `stats`, `contribuciones`, `fotos`, `analytics`) y la consulta pública de la invitación ahora piden
  datos frescos al servidor (`cache: 'no-store'`), evitando que el navegador muestre conteos antiguos
  al cambiar de página.

- **Reparación de confirmaciones huérfanas**: si una invitación queda marcada como "Confirmada" en el
  panel de Invitaciones pero no tiene una confirmación de asistencia viva (por ejemplo, porque se marcó
  a mano sin RSVP o porque se borró el registro y el vínculo quedó roto), al abrir
  `/admin/asistencias` se vuelve a crear la confirmación automáticamente (idempotente) usando las
  personas invitadas, para que la familia reaparezca en el listado y se cuente en los totales.

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
