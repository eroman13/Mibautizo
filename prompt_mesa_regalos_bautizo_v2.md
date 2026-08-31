# 🍼 Prompt Definitivo para GitHub Copilot — Mesa de Regalos Digital para Bautizo de Gemelas

> **Cómo usarlo:** Abre GitHub Copilot Chat en VS Code y pega este documento completo. Pídele que empiece por la **Etapa 1** y avance solo cuando confirmes. Está optimizado para el caso chileno (CLP, español), con Mercado Pago y lógica de comisión configurable.

---

## 1. CONTEXTO Y OBJETIVO

Construye conmigo, **paso a paso**, una **aplicación web de "mesa de regalos" (lista de regalos en dinero)** para el **bautizo de mis hijas gemelas**.

La idea central:
- Mis invitados entran a un **link único**, ven una lista de regalos de bebé (foto referencial, nombre, precio en CLP).
- Eligen uno o varios y, **en lugar de comprarlos en una tienda, me transfieren ese monto a mí** (a mi cuenta Mercado Pago, y de ahí a mi banco).
- Debe permitir **pago con tarjeta de crédito y en cuotas**.

**IMPORTANTE — Naturaleza del negocio:** Esto NO es un e-commerce. No se venden productos reales; las imágenes son solo **referenciales de un monto de aporte/regalo en dinero**. Por lo tanto:
- No hay lógica de venta, ni carrito de stock, ni emisión de boletas/facturas, ni cálculo de IVA de venta.
- El único costo real es la **comisión de la pasarela de pago** (Mercado Pago), cuyo IVA ya viene incluido en esa comisión y lo retiene la propia pasarela.
- Trátalo conceptualmente como "aportes en dinero / regalos simbólicos".

**Localización:** Todo en **español de Chile (es-CL)** y en **pesos chilenos (CLP)**, montos formateados con `Intl.NumberFormat('es-CL')` (ej: `$50.000`).

---

## 2. STACK TECNOLÓGICO

- **Monorepo** con dos carpetas: `/frontend` y `/backend`.
- **Frontend:** React + Vite + TypeScript + **Tailwind CSS**. Diseño responsive (mobile-first), tierno y elegante, temática de bautizo de gemelas (tonos pastel: celeste, rosa suave, durazno, blanco; tipografía delicada; detalles como nubes, estrellas o angelitos).
- **Backend:** Node.js + Express + TypeScript. Es **obligatorio** para (a) proteger el Access Token de Mercado Pago, (b) crear las preferencias de pago y (c) recibir los webhooks. El Access Token **NUNCA** debe estar en el frontend.
- **Base de datos:** SQLite + **Prisma ORM** (simple, sin servidor). Deja el schema preparado para migrar a PostgreSQL.
- **Pasarela de pago:** Mercado Pago Chile, **Checkout Pro** vía SDK oficial de Node (`mercadopago`), usando **Preferences API**. Deja comentado y con interfaz preparada para agregar después **Khipu/transferencia** como método alternativo más barato.
- **Variables sensibles** en `.env` (incluye un `.env.example` documentado).

---

## 3. FUNCIONALIDAD CLAVE — LÓGICA DE COMISIÓN CONFIGURABLE ⭐

Esta es la característica diferenciadora. La app debe manejar la comisión de Mercado Pago (configurable en `.env`, por defecto **3,19% + IVA ≈ 3,80% efectivo**) con **dos modos** seleccionables por mí desde el panel admin:

- **MODO A — "El invitado cubre la comisión"** (yo recibo el 100% del regalo):
  - Al crear la preferencia, el monto cobrado = precio del regalo ÷ (1 − comisión efectiva). Ej: regalo $50.000 → invitado paga ~$51.975 → yo recibo $50.000.
- **MODO B — "Yo asumo la comisión"** (el invitado paga el precio exacto):
  - El invitado paga $50.000 y yo recibo el neto (~$48.100).

**Transparencia obligatoria (estilo CelebraConmigo):** En el checkout, antes de pagar, muéstrale al invitado un desglose claro:
```
Regalo:                 $50.000
Comisión procesamiento:  $1.975   (solo visible en Modo A)
─────────────────────────────────
Total a pagar:          $51.975
```
En el panel admin, muéstrame siempre: monto aportado, comisión pasarela, y neto real que me llega.

---

## 4. FUNCIONALIDADES (MVP)

### Vista pública (invitados) — sin necesidad de crear cuenta
1. **Landing del evento:** foto/portada, nombres de las gemelas, fecha, hora y lugar del bautizo, mensaje de bienvenida cálido.
2. **Catálogo de regalos:** grid de tarjetas (imagen referencial, nombre, descripción corta, precio CLP, botón "Regalar esto"). Los ya regalados se muestran como **"Ya regalado 💝"** y deshabilitados, para evitar repetidos.
3. **Regalos colaborativos** (opcional pero deseable): varios invitados aportan a un regalo de mayor valor, con **barra de progreso** en tiempo real.
4. **Aporte con monto libre:** opción "Quiero aportar el monto que yo elija" para las gemelas.
5. **Carrito simple:** permite elegir uno o varios regalos.
6. **Checkout:** formulario mínimo (nombre del invitado, email opcional, dedicatoria/mensaje para los papás). Muestra el desglose (sección 3) y, al confirmar, el backend crea la **preferencia de Mercado Pago** con **cuotas habilitadas** y redirige a Checkout Pro.
7. **Páginas de retorno:** `/pago-exitoso`, `/pago-pendiente`, `/pago-fallido` (configuradas como `back_urls` con `auto_return`).
8. **Muro de saludos** (opcional): mensajes y dedicatorias de los invitados visibles en una sección linda.

### Backend / lógica de pago
9. `POST /api/crear-preferencia`: recibe los ítems + datos del invitado. **Valida los precios contra la base de datos** (nunca confía en montos del frontend). Aplica el modo de comisión (A/B). Crea la preferencia con el SDK y devuelve el `init_point`.
10. `POST /api/webhook`: recibe notificaciones de Mercado Pago, consulta el pago por su ID, y si está `approved` marca el/los regalo(s) como pagados, registrando quién regaló, monto, comisión, neto, dedicatoria y fecha. **Idempotente** (un webhook repetido no duplica registros).
11. `GET /api/regalos`: lista pública de regalos con su estado.

### Vista privada (yo, la mamá organizadora)
12. **Panel admin** protegido por contraseña simple (variable de entorno):
    - Dashboard con **total recaudado neto**, cantidad de aportes y regalos pendientes.
    - Tabla de aportes: quién regaló qué, monto bruto, comisión, neto, dedicatoria, fecha, estado.
    - CRUD de regalos del catálogo (agregar/editar/eliminar, subir imagen o pegar URL).
    - Selector del **modo de comisión** (A/B) y edición de datos del evento.
    - Botón para **exportar aportes a CSV** (respaldo, útil por si el SII pregunta el origen de las transferencias).

---

## 5. MODELO DE DATOS (Prisma)

- **Event:** id, nombreGemela1, nombreGemela2, fecha, hora, lugar, mensajeBienvenida, portadaUrl, modoComision ("A" | "B").
- **Gift:** id, nombre, descripcion, precioCLP, imagenUrl, permiteColaborativo (bool), montoRecaudadoCLP, estado ("disponible" | "reservado" | "pagado").
- **Contribution:** id, giftId (nullable si es aporte libre), montoBrutoCLP, comisionCLP, montoNetoCLP, nombreInvitado, emailInvitado, dedicatoria, estadoPago, mpPaymentId (único), createdAt.

Incluye un **seed** con ~10 regalos de bebé de ejemplo para gemelas (ver sección 8).

---

## 6. REQUISITOS DE CALIDAD Y SEGURIDAD

- Código limpio, tipado y **comentado en español**.
- Manejo de errores y estados de carga (spinners, mensajes claros) en el frontend.
- **Seguridad de pagos (crítico):**
  - Access Token solo en el backend, jamás en el cliente.
  - Validar SIEMPRE precios en el backend contra la BD.
  - Verificar la autenticidad del webhook consultando el pago vía API antes de marcarlo como pagado.
- Usar primero **credenciales de prueba (sandbox)** y tarjetas de test.
- No habilitar restricciones de `payment_methods` (para que las **cuotas** aparezcan según la tarjeta del invitado).

---

## 7. ENTREGABLES ADICIONALES

- **README.md** completo con: instalación, cómo obtener las credenciales de Mercado Pago (Access Token y Public Key, prueba y producción), configuración del `.env`, cómo correr en local, cómo probar con **tarjetas de prueba de Mercado Pago**, y cómo desplegar (frontend en **Vercel/Netlify**, backend en **Render/Railway**).
- **.env.example** documentado.
- Comentarios `// TODO: integrar Khipu` en los puntos exactos donde se añadiría el método de transferencia más barato.

---

## 8. DATOS DE EJEMPLO (seed de regalos para gemelas)

Usa regalos duplicados o pensados para dos bebés, con precios realistas en CLP:
1. Pack de 2 bodies de algodón — $18.000
2. Coche doble para gemelas — $180.000 (permite colaborativo)
3. 2 mantitas de apego — $25.000
4. Set de mudador + pañales — $30.000
5. 2 mamaderas anticólicos — $22.000
6. Cuna colecho — $120.000 (permite colaborativo)
7. Pack de 2 pijamas de invierno — $28.000
8. Bañera para bebé — $35.000
9. 2 peluches de regalo — $20.000
10. Aporte libre "Para el futuro de las gemelas" — monto a elección

---

## 9. FORMA DE TRABAJO (por etapas — no generes todo de golpe)

1. **Etapa 1:** Estructura del monorepo (frontend + backend), dependencias, configuración base (Tailwind, TS, Prisma).
2. **Etapa 2:** Schema Prisma + migración + seed con los regalos de la sección 8.
3. **Etapa 3:** Backend — endpoints de preferencia (con lógica de comisión A/B) y webhook idempotente.
4. **Etapa 4:** Frontend público — landing + catálogo + checkout con desglose + páginas de retorno.
5. **Etapa 5:** Panel admin — dashboard, tabla de aportes, CRUD de regalos, selector de modo, export CSV.
6. **Etapa 6:** README, `.env.example` y comentarios de despliegue.

**Empieza por la Etapa 1 y espera mi confirmación antes de continuar con la siguiente.**

---

## 10. NOTAS TÉCNICAS QUE DEBES RESPETAR
- El **Access Token** de Mercado Pago va SOLO en el backend.
- Las **cuotas** se habilitan automáticamente en Checkout Pro; no las restrinjas.
- Valida SIEMPRE los precios en el backend contra la base de datos.
- Usa credenciales **sandbox** y tarjetas de prueba antes de producción.
- Recuerda: **no hay venta de productos ni IVA de venta**; solo aportes en dinero y la comisión de la pasarela.
