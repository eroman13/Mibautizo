# 🧪 Guía de Pruebas

Documentación completa para probar la Mesa de Regalos Digital.

---

## 📋 Índice

1. [Pruebas Locales](#pruebas-locales)
2. [Pruebas con Mercado Pago](#pruebas-con-mercado-pago)
3. [Pruebas de Webhooks](#pruebas-de-webhooks)
4. [Pruebas del Panel Admin](#pruebas-del-panel-admin)
5. [Checklist de QA](#checklist-de-qa)

---

## 🏠 Pruebas Locales

### Preparación del Entorno

```bash
# 1. Asegúrate de tener todo instalado
npm run install:all

# 2. Configura variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de PRUEBA de MP

# 3. Configura la base de datos
cd backend
npx prisma generate
npx prisma migrate dev
npx prisma db seed
cd ..

# 4. Inicia ambos servidores
npm run dev
```

### Verificar que Todo Funciona

**Backend:**
```bash
# En otra terminal, probar endpoints:
curl http://localhost:3000/api/regalos | jq
# Debe retornar lista de 11 regalos
```

**Frontend:**
```bash
# Abrir navegador:
open http://localhost:5173
# Debe mostrar la página de inicio
```

---

## 💳 Pruebas con Mercado Pago

### Credenciales de Prueba

**⚠️ IMPORTANTE:** Usa SOLO credenciales de prueba para desarrollo.

1. **Obtener credenciales:**
   - Ve a: https://www.mercadopago.cl/developers/panel/credentials
   - Selecciona **"Credenciales de prueba"**
   - Copia Access Token y Public Key

2. **Configurar en .env:**
   ```bash
   MP_ACCESS_TOKEN="TEST-123..."
   MP_PUBLIC_KEY="TEST-abc..."
   ```

3. **Reiniciar backend:**
   ```bash
   # Ctrl+C en la terminal del backend
   npm run dev:backend
   ```

### Tarjetas de Prueba

#### ✅ Pago Aprobado (Success)

```
Número: 5031 7557 3453 0604
CVV: 123
Vencimiento: 11/25
Nombre: APRO
RUT: 11.111.111-1
Email: test_user@test.com
```

**Flujo esperado:**
1. Seleccionar regalo → Agregar al carrito
2. Completar checkout con datos de prueba
3. Usar esta tarjeta en MP
4. **Resultado:** Redirige a `/pago-exitoso`
5. **BD:** Contribución con `estadoPago: "approved"`
6. **Regalo:** `montoRecaudadoCLP` actualizado

#### ❌ Pago Rechazado (Declined)

```
Número: 5031 4332 1540 6351
CVV: 123
Vencimiento: 11/25
Nombre: OTHE
RUT: 22.222.222-2
```

**Resultado esperado:**
- Redirige a `/pago-fallido`
- BD: Contribución con `estadoPago: "rejected"`
- Regalo: NO se actualiza

#### ⏳ Pago Pendiente (Pending)

```
Número: 5031 4447 2179 6186
CVV: 123
Vencimiento: 11/25
Nombre: CONT
RUT: 33.333.333-3
```

**Resultado esperado:**
- Redirige a `/pago-pendiente`
- BD: Contribución con `estadoPago: "pending"`
- Regalo: NO se actualiza (hasta que se apruebe)

### Más Tarjetas de Prueba

| Resultado | Número | CVV | Nombre |
|-----------|--------|-----|--------|
| Aprobado | 5031 7557 3453 0604 | 123 | APRO |
| Fondos insuficientes | 5031 4847 1359 8637 | 123 | FUND |
| Rechazado (genérico) | 5031 4332 1540 6351 | 123 | OTHE |
| Rechazado (CVV inválido) | 5031 4863 3860 1995 | 123 | SECU |
| Pendiente | 5031 4447 2179 6186 | 123 | CONT |

**Fuente oficial:** https://www.mercadopago.cl/developers/es/docs/checkout-pro/additional-content/test-cards

---

## 🔔 Pruebas de Webhooks

### Problema: Localhost no es Alcanzable

Mercado Pago necesita una URL pública para enviar webhooks.

### Solución: ngrok

#### 1. Instalar ngrok

**macOS:**
```bash
brew install ngrok
```

**Otras plataformas:**
```bash
# Descargar de https://ngrok.com/download
# O usar npm:
npm install -g ngrok
```

#### 2. Crear túnel

```bash
# En una terminal aparte:
ngrok http 3000

# Output:
# Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

**Copia la URL HTTPS** (ej: `https://abc123.ngrok.io`)

#### 3. Actualizar .env

```bash
BACKEND_URL="https://abc123.ngrok.io"
```

**Reinicia el backend** para que use la nueva URL.

#### 4. Configurar Webhook en Mercado Pago

1. Ve a: https://www.mercadopago.cl/developers/panel/webhooks
2. Click "Crear webhook"
3. **URL:** `https://abc123.ngrok.io/api/webhook`
4. **Eventos:** Selecciona `payment` (todos)
5. **Modo:** Pruebas
6. Guarda

#### 5. Probar Webhook

1. Haz un pago de prueba con tarjeta `APRO`
2. Ve a los logs del backend:
   ```bash
   # Terminal del backend debe mostrar:
   📨 Webhook recibido: payment
   ✅ Pago verificado: 123456789
   ```
3. Verifica en Prisma Studio:
   ```bash
   cd backend
   npx prisma studio
   # Abre http://localhost:5555
   # Ve tabla Contribution → debe aparecer nueva fila
   ```

### Verificar Webhooks Manualmente

```bash
# Ver contribuciones creadas:
curl http://localhost:3000/api/admin/contribuciones \
  -H "Authorization: Bearer admin-authenticated" | jq

# Debe mostrar la contribución con:
# - estadoPago: "approved"
# - mpPaymentId: "123..."
# - nombreInvitado, emailInvitado, etc.
```

### Probar Idempotencia

Los webhooks pueden llegar duplicados. El sistema debe ignorar duplicados.

**Prueba:**
```bash
# Simular webhook duplicado (reemplaza PAYMENT_ID con uno real):
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "data": { "id": "PAYMENT_ID_REAL" }
  }'

# Primera vez: crea contribución
# Segunda vez: retorna 200 pero no crea duplicado
```

**Verificar en BD:**
```sql
-- En Prisma Studio, buscar por mpPaymentId
-- Debe haber SOLO UNA fila con ese ID
```

---

## 🎛️ Pruebas del Panel Admin

### 1. Login

**URL:** http://localhost:5173/admin/login

**Prueba:**
```
Contraseña correcta: (la de tu .env, default: "gemelas2026")
  → Redirige a /admin/dashboard
  → Token guardado en localStorage

Contraseña incorrecta: "password123"
  → Muestra error "Contraseña incorrecta"
  → NO redirige
```

### 2. Dashboard

**URL:** http://localhost:5173/admin/dashboard

**Verificar:**
- [ ] **Tarjeta Verde:** Total Neto = suma de `montoNetoCLP`
- [ ] **Tarjeta Azul:** Contribuciones = count + promedio
- [ ] **Tarjeta Naranja:** Comisiones = suma de `comisionCLP`
- [ ] **Tarjeta Púrpura:** Regalos pagados vs total

**Hacer un pago de prueba y refrescar:**
- Números deben actualizarse en tiempo real

### 3. Contribuciones

**URL:** http://localhost:5173/admin/contribuciones

**Pruebas:**

| Acción | Resultado Esperado |
|--------|-------------------|
| Cargar página | Tabla con todas las contribuciones |
| Filtrar por nombre "Juan" | Solo muestra contribuciones de Juan |
| Filtrar por regalo "Cuna" | Solo muestra aportes a la Cuna |
| Click "Exportar CSV" | Descarga `contribuciones-YYYY-MM-DD.csv` |
| Abrir CSV en Excel | Acentos se ven bien (UTF-8 con BOM) |

**Verificar columnas del CSV:**
```csv
Fecha,Nombre Invitado,Email,Regalo,Monto Bruto,Comisión,Monto Neto,Estado,ID Pago MP,Dedicatoria
2026-08-28,Juan Pérez,juan@test.com,Pack de 4 bodies,18000,684,17316,approved,123456789,Felicidades!
```

### 4. Gestionar Regalos

**URL:** http://localhost:5173/admin/regalos

#### Crear Regalo

1. Click "Agregar Regalo"
2. Completar formulario:
   ```
   Nombre: Monitor de bebé
   Descripción: Monitor de video con audio bidireccional
   Precio: 95000
   URL imagen: https://picsum.photos/400/400
   Colaborativo: ☑
   ```
3. Click "Guardar"
4. **Resultado:** Regalo aparece en el grid

**Verificar en frontend público:**
```bash
# Abrir catálogo
open http://localhost:5173/regalos

# Debe aparecer el nuevo regalo
```

#### Editar Regalo

1. Click en ícono de lápiz de cualquier regalo
2. Cambiar precio: `20000` → `22000`
3. Click "Guardar"
4. **Resultado:** Precio se actualiza

#### Eliminar Regalo

**Caso 1: Regalo sin contribuciones**
1. Click en ícono de basurero
2. Confirmar eliminación
3. **Resultado:** Regalo desaparece

**Caso 2: Regalo con contribuciones**
1. Intentar eliminar un regalo que tiene aportes
2. **Resultado:** Error "No se puede eliminar un regalo con contribuciones"

**Probar:**
```bash
# Crear una contribución de prueba
# Luego intentar eliminar ese regalo desde admin
# Debe rechazar la eliminación
```

### 5. Configuración

**URL:** http://localhost:5173/admin/configuracion

**Pruebas:**

| Campo | Acción | Verificación |
|-------|--------|--------------|
| Nombre Gemela 1 | Cambiar "Antonia" → "Isabella" | Guardar → Ver en Home |
| Fecha | Cambiar a 2026-10-15 | Guardar → Ver en Home |
| Mensaje Bienvenida | Editar texto | Guardar → Ver en Home |
| Modo Comisión | Cambiar A → B | Guardar → Ver en `/api/evento` |

**Verificar cambio de modo:**
```bash
# Antes (Modo A):
Regalo $100.000 → Invitado paga ~$103.953

# Después (Modo B):
Regalo $100.000 → Invitado paga $100.000 (tú recibes ~$96.200)
```

### 6. Logout

1. Click "Cerrar Sesión" en cualquier página admin
2. **Resultado:**
   - Redirige a `/admin/login`
   - Token borrado de localStorage
   - Intentar acceder a `/admin/dashboard` redirige a login

---

## ✅ Checklist de QA Completo

### Frontend Público

- [ ] **Home Page**
  - [ ] Imagen de portada carga
  - [ ] Nombres de gemelas se muestran
  - [ ] Fecha/hora/lugar correctos
  - [ ] Mensaje de bienvenida correcto
  - [ ] Botón "Ver Regalos" funciona

- [ ] **Catálogo**
  - [ ] 11 regalos cargan (o los que tengas)
  - [ ] Imágenes de regalos cargan
  - [ ] Precios formateados correctamente ($18.000)
  - [ ] Badge "Ya regalado 💝" en regalos pagados
  - [ ] Barra de progreso en colaborativos
  - [ ] Carrito flotante aparece

- [ ] **Carrito**
  - [ ] Agregar regalo → aparece en carrito
  - [ ] Badge muestra cantidad correcta
  - [ ] Total calcula bien
  - [ ] Quitar regalo funciona
  - [ ] Cerrar carrito funciona

- [ ] **Checkout**
  - [ ] Resumen de regalos correcto
  - [ ] Campos requeridos: nombre, email
  - [ ] Email válida requerida (test@test.com ✅, "asd" ❌)
  - [ ] Dedicatoria opcional funciona
  - [ ] Botón "Pagar con Mercado Pago" funciona

- [ ] **Mercado Pago**
  - [ ] Redirige correctamente
  - [ ] Monto mostrado es correcto
  - [ ] Tarjeta APRO funciona
  - [ ] Tarjeta OTHE rechaza

- [ ] **Post-Pago**
  - [ ] `/pago-exitoso` muestra payment_id
  - [ ] `/pago-fallido` muestra mensaje de error
  - [ ] `/pago-pendiente` explica el estado
  - [ ] Botones de navegación funcionan

### Backend API

- [ ] **GET /api/regalos**
  - [ ] Retorna todos los regalos
  - [ ] Incluye `modoComision`
  - [ ] Regalos tienen estructura correcta

- [ ] **GET /api/regalos/:id**
  - [ ] Retorna regalo específico
  - [ ] Incluye contribuciones si las hay
  - [ ] 404 si no existe

- [ ] **GET /api/evento**
  - [ ] Retorna info del evento
  - [ ] Incluye todos los campos

- [ ] **POST /api/preferencia**
  - [ ] Valida campos requeridos
  - [ ] Rechaza precios manipulados
  - [ ] Calcula comisión correctamente
  - [ ] Retorna initPoint válido

- [ ] **POST /api/webhook**
  - [ ] Recibe notificaciones de MP
  - [ ] Verifica pago con MP API
  - [ ] Crea contribución
  - [ ] Actualiza regalo
  - [ ] Idempotente (ignora duplicados)

### Panel Admin

- [ ] **Login**
  - [ ] Acepta contraseña correcta
  - [ ] Rechaza contraseña incorrecta
  - [ ] Guarda token en localStorage
  - [ ] Redirige a dashboard

- [ ] **Dashboard**
  - [ ] Muestra estadísticas correctas
  - [ ] Tarjetas tienen colores correctos
  - [ ] Links de acciones rápidas funcionan
  - [ ] Botón logout funciona

- [ ] **Contribuciones**
  - [ ] Tabla carga todas las contribuciones
  - [ ] Filtro funciona
  - [ ] CSV exporta correctamente
  - [ ] Acentos en CSV correctos

- [ ] **Regalos**
  - [ ] Grid muestra todos los regalos
  - [ ] Crear regalo funciona
  - [ ] Editar regalo funciona
  - [ ] Eliminar valida contribuciones
  - [ ] Modal se cierra correctamente

- [ ] **Configuración**
  - [ ] Todos los campos editables
  - [ ] Modo comisión cambia
  - [ ] Guardar actualiza BD
  - [ ] Cambios reflejan en frontend

- [ ] **Seguridad**
  - [ ] Rutas protegidas redirigen sin token
  - [ ] Token inválido rechazado
  - [ ] Logout borra token

### Responsive (Mobile)

- [ ] **iPhone (375px)**
  - [ ] Home se ve bien
  - [ ] Catálogo en columna única
  - [ ] Carrito slide-in funciona
  - [ ] Checkout legible
  - [ ] Admin panel usable

- [ ] **iPad (768px)**
  - [ ] Grid de 2 columnas
  - [ ] Dashboard 2x2
  - [ ] Tabla con scroll horizontal

- [ ] **Desktop (1920px)**
  - [ ] Grid de 3-4 columnas
  - [ ] Dashboard 4x1
  - [ ] Tabla completa visible

### Performance

- [ ] **Tiempos de carga**
  - [ ] Home < 2s
  - [ ] Catálogo < 3s
  - [ ] API responses < 500ms

- [ ] **Imágenes**
  - [ ] Se cargan sin bloquear UI
  - [ ] Placeholders mientras cargan

### Browser Testing

- [ ] **Chrome** (última versión)
- [ ] **Safari** (macOS/iOS)
- [ ] **Firefox** (última versión)
- [ ] **Edge** (última versión)

### Edge Cases

- [ ] **Carrito vacío**
  - [ ] No permite ir a checkout
  - [ ] Muestra mensaje apropiado

- [ ] **Regalo agotado**
  - [ ] No permite agregar al carrito
  - [ ] Muestra badge "Ya regalado"

- [ ] **Red lenta**
  - [ ] Muestra loading states
  - [ ] No hace requests duplicados

- [ ] **Offline**
  - [ ] Muestra error amigable
  - [ ] No crashea la app

---

## 🐛 Casos de Prueba Específicos

### Test Case 1: Pago Completo End-to-End

```
Precondición: Backend y frontend corriendo, webhooks configurados

Pasos:
1. Ir a http://localhost:5173
2. Click "Ver Nuestros Regalos"
3. Seleccionar "Pack de 4 bodies" ($18.000)
4. Click "Agregar al Carrito"
5. Click en ícono del carrito (debe mostrar "1")
6. Click "Ir a Pagar"
7. Completar formulario:
   - Nombre: Juan Test
   - Email: test@test.com
   - Dedicatoria: Felicidades!
8. Click "Pagar con Mercado Pago"
9. En MP, usar tarjeta APRO (5031 7557 3453 0604)
10. Completar pago

Resultado esperado:
✅ Redirige a /pago-exitoso?payment_id=...
✅ Mensaje "Tu pago ha sido aprobado"
✅ Backend logs muestran "Webhook recibido"
✅ En /admin/contribuciones aparece la nueva contribución
✅ En /regalos el "Pack de 4 bodies" muestra "Ya regalado 💝"
```

### Test Case 2: Regalo Colaborativo

```
Precondición: Regalo "Coche doble" ($180.000) en colaborativo

Pasos:
1. Usuario A: Aporta $50.000
2. Usuario B: Aporta $60.000
3. Usuario C: Aporta $70.000

Resultado esperado:
✅ Barra de progreso: 50.000 / 180.000 = 27.7%
✅ Barra de progreso: 110.000 / 180.000 = 61.1%
✅ Barra de progreso: 180.000 / 180.000 = 100%
✅ Estado cambia a "pagado"
✅ Badge "Ya regalado 💝" aparece
✅ No se puede agregar más al carrito
```

### Test Case 3: Validación de Precio

```
Precondición: Regalo con ID=1 tiene precio $18.000

Pasos (usando DevTools):
1. Abrir Network tab
2. Agregar regalo al carrito
3. Ir a checkout
4. Antes de enviar, interceptar request
5. Modificar JSON: "precioCLP": 1 (en vez de 18000)
6. Enviar request manipulado

Resultado esperado:
❌ Backend responde 400 Bad Request
❌ Error: "Precio del regalo no coincide"
❌ No se crea preferencia de pago
```

### Test Case 4: Modo de Comisión

```
Escenario A: Modo A (invitado cubre)
  Regalo: $100.000
  Comisión: 3.8% → $3.953
  Total a pagar: $103.953
  Organizador recibe: $100.000

Escenario B: Modo B (organizador asume)
  Regalo: $100.000
  Comisión: 3.8% → $3.800
  Total a pagar: $100.000
  Organizador recibe: $96.200

Verificar en:
✅ /api/preferencia calcula correcto
✅ MP Checkout muestra monto correcto
✅ BD guarda montoBruto, comision, montoNeto correctos
✅ Admin Dashboard refleja correctamente
```

---

## 📊 Herramientas de Testing

### Prisma Studio

Ver y editar BD directamente:
```bash
cd backend
npx prisma studio
# Abre http://localhost:5555
```

### Postman / Insomnia

Colección de requests:

```json
{
  "name": "Mesa de Regalos API",
  "requests": [
    {
      "name": "Get Regalos",
      "method": "GET",
      "url": "http://localhost:3000/api/regalos"
    },
    {
      "name": "Admin Login",
      "method": "POST",
      "url": "http://localhost:3000/api/admin/login",
      "body": { "password": "gemelas2026" }
    },
    {
      "name": "Get Stats",
      "method": "GET",
      "url": "http://localhost:3000/api/admin/stats",
      "headers": {
        "Authorization": "Bearer admin-authenticated"
      }
    }
  ]
}
```

### ngrok Web Inspector

Ver todos los webhooks recibidos:
```
http://127.0.0.1:4040/inspect/http
```

---

## 🚨 Solución de Problemas Comunes

### "Webhook no llega"

**Síntomas:** Pago aprobado en MP pero no se actualiza la BD

**Solución:**
1. Verificar que ngrok está corriendo
2. Verificar URL en panel de MP
3. Ver logs del backend para errores
4. Verificar que `BACKEND_URL` en .env es la URL de ngrok

### "Regalo no se marca como pagado"

**Posibles causas:**
- Webhook no llegó
- Estado de pago no es "approved"
- Regalo es colaborativo y no llegó al 100%

**Verificar:**
```bash
# Ver estado en Prisma Studio
# Tabla Contribution → buscar por mpPaymentId
# Verificar estadoPago = "approved"
# Tabla Gift → verificar montoRecaudadoCLP
```

### "CSV con caracteres raros"

**Causa:** Excel usa encoding incorrecto

**Solución:** Ya implementado en el backend (UTF-8 con BOM)

Si persiste:
```bash
# Abrir CSV con:
- LibreOffice Calc (seleccionar UTF-8)
- Google Sheets (detecta automáticamente)
- VS Code (para ver el formato crudo)
```

---

## 🎓 Conclusión

Con estas pruebas cubres:

- ✅ Flujos de usuario completos
- ✅ Integración con Mercado Pago
- ✅ Webhooks idempotentes
- ✅ Panel administrativo
- ✅ Validaciones de seguridad
- ✅ Edge cases y errores

**Siguiente paso:** Deploy a producción (ver [DEPLOYMENT.md](./DEPLOYMENT.md))

---

<div align="center">

**¡Happy Testing! 🧪**

</div>
