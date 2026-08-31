# 🚀 DEPLOYMENT PARA 50 DÍAS - Guía Actualizada

## ⚠️ Problema con Planes Gratuitos (50 días)

### Render Free - ❌ NO es recomendado para 50 días
- El servicio se **pausa después de 15 min de inactividad**
- Se reactiva cuando recibe una solicitud
- Problema: **Los webhooks de Mercado Pago pueden fallar** si backend está pausado
- Resultado: **Los pagos no se procesan, emails no se envían**

### Vercel Free - ✅ SÍ funciona para 50 días
- Frontend puede correr indefinidamente sin problemas
- No tiene pausas por inactividad
- Ideal para 50 días

---

## 💡 OPCIÓN RECOMENDADA (Costo Mínimo)

### Stack Recomendado: Vercel + Railway

| Componente | Servicio | Plan | Costo/mes |
|-----------|----------|------|-----------|
| Frontend | Vercel | Free | **$0** |
| Backend | Railway | Starter Plan | **$5** |
| Database | Railway | Incluido | **Incluido** |
| Emails | Gmail | Existente | **$0** |
| **TOTAL** | | | **$5 USD (~$9.000 CLP)** |

**Ventajas:**
- ✅ Backend NUNCA se pausa
- ✅ Webhooks de Mercado Pago llegan 100% del tiempo
- ✅ Muy confiable para 50 días
- ✅ Incluye database PostgreSQL
- ✅ Costo muy bajo

---

## 🚀 DEPLOYMENT EN RAILWAY (50 días garantizado)

### PASO 1: Frontend en Vercel (igual que antes)
1. Ir a https://vercel.com
2. Conectar GitHub
3. Importar repo
4. **Root Directory**: `frontend/`
5. Deploy ✅

### PASO 2: Crear Cuenta en Railway
1. Ir a https://railway.app
2. Click "Sign up with GitHub"
3. Conectar GitHub account

### PASO 3: Deploy Backend en Railway

#### 3.1 Crear Base de Datos
1. Dashboard → **New Project**
2. Buscar y seleccionar "PostgreSQL"
3. Click "Add"
4. Esperar a que se cree (~1 min)
5. Click en la database
6. Tab "Variables"
7. **COPIAR**: La variable `DATABASE_URL` completa

#### 3.2 Agregar Backend Service
1. En el mismo proyecto → **New**
2. Seleccionar "GitHub Repo"
3. Conectar repo "Mibautizo"
4. **Root Directory**: `backend`
5. Esperar a que termine el build

#### 3.3 Configurar Variables de Entorno
1. Click en el servicio "backend"
2. Tab "Variables"
3. Agregar estas variables:

```
DATABASE_URL=(copiar de PostgreSQL)
MP_ACCESS_TOKEN=APP_USR-6032208155105752-010810-61dba3eba0dd04d9fe6834080b8e4141-3120378089
MP_PUBLIC_KEY=APP_USR-d437a4b4-5235-4190-a083-326bf35e3c9d
FRONTEND_URL=(tu URL de Vercel, ej: https://mibautizo.vercel.app)
BACKEND_URL=(se genera automáticamente en Railway)
NODE_ENV=production
GMAIL_USER=regalapp.spa@gmail.com
GMAIL_PASS=einzwdfqiwcojgew
ADMIN_EMAIL=regalapp.spa@gmail.com
GEMELA1_NAME=Antonia
GEMELA2_NAME=Emilia
EVENT_DATE=15 de septiembre de 2026
MP_COMMISSION_RATE=0.038
WEBHOOK_URL=(se genera en Railway)
DEFAULT_COMMISSION_MODE=A
```

#### 3.4 Obtener URL del Backend
1. En Railway, ir a "Settings" del servicio
2. Copiar el dominio autogenerado
3. Formato: `https://mibautizo-production-xyz.railway.app`

### PASO 4: Actualizar Vercel
1. Ir a Vercel Dashboard
2. Project Settings → Environment Variables
3. Actualizar `VITE_API_URL` con URL de Railway
4. Redeploy automático

### PASO 5: Configurar Webhook en Mercado Pago
1. https://www.mercadopago.com.ar/developers/panel/webhooks
2. Notification URL:
   ```
   https://mibautizo-production-xyz.railway.app/api/webhook
   ```
3. Guardar

---

## ✅ COMPARATIVA: Render vs Railway

| Característica | Render Free | Railway Starter |
|---|---|---|
| **Costo** | $0 | $5/mes |
| **Backend se pausa** | ❌ SÍ (15 min) | ✅ NO |
| **Webhooks confiables** | ❌ NO | ✅ SÍ |
| **Database incluida** | ✅ SÍ | ✅ SÍ |
| **Ideal para 50 días** | ❌ NO | ✅ SÍ |
| **Uptime garantizado** | No | ~99.9% |

### Conclusión
Para **50 días sin problemas**: **Railway Starter ($5)** es la mejor opción

---

## 💳 CÓMO PAGAR EN RAILWAY

### Agregar Tarjeta
1. Railway Dashboard → **Billing**
2. Click "Add Payment Method"
3. Ingresar datos de tarjeta
4. Confirmar

### Costo Real
- Railway te cobra por uso (CPU, RAM, Storage)
- Starter Plan = $5/mes crédito gratis
- Tu uso probablemente será < $5/mes
- Si excede, te contactan antes de cobrar
- **Costo esperado para 50 días**: $0-2 USD

---

## 🎯 FLUJO FINAL DE DEPLOYMENT (30 min)

1. ✅ Vercel Frontend (ya sabes cómo)
2. ✅ Railway: Crear PostgreSQL (3 min)
3. ✅ Railway: Deploy Backend (5 min)
4. ✅ Configurar variables de entorno (5 min)
5. ✅ Actualizar Vercel con URL de Railway (2 min)
6. ✅ Configurar webhook en Mercado Pago (2 min)
7. ✅ Pruebas (8 min)

**Tiempo Total**: ~30 minutos

---

## 🧪 TEST PRE-LANZAMIENTO

### Test 1: Accesibilidad
- [ ] Puedo abrir frontend en navegador
- [ ] Puedo ver todos los regalos
- [ ] Admin panel es accesible

### Test 2: Flujo Completo de Pago
- [ ] Agrego regalo al carrito
- [ ] Checkout calcula montos correctamente
- [ ] Mercado Pago abre sin errores
- [ ] Pago de prueba procesa exitosamente
- [ ] Email de confirmación llega en 5 min
- [ ] Contribución aparece en admin panel

### Test 3: Confiabilidad (50 días)
- [ ] Backend nunca se pausa
- [ ] API responde en < 1s
- [ ] Webhooks se procesan inmediatamente
- [ ] Imágenes cargan correctamente
- [ ] Emails se envían sin demoras

---

## 🚨 ¿Qué Pasa si Alguien Paga en los 50 Días?

### Con Railway (RECOMENDADO ✅)
1. Pago llega a Mercado Pago
2. MP envía webhook inmediatamente
3. Backend en Railway procesa pago
4. Contribución se guarda en BD
5. Email se envía al instante
6. Admin ve pago en panel
7. ✅ **TODO FUNCIONA PERFECTAMENTE**

### Con Render Free (❌ RIESGO)
1. Pago llega a Mercado Pago
2. MP envía webhook
3. Backend está pausado (inactivo 15+ min)
4. Webhook espera...
5. Backend se activa después de 5-10 min
6. Pago se procesa CON RETRASO
7. Email llega tarde
8. ❌ **PROBLEMAS DE TIMING**

---

## 💰 RESUMEN DE COSTOS (50 días)

### MEJOR OPCIÓN: Vercel + Railway
| Item | Costo |
|------|-------|
| Vercel (Frontend) | $0 |
| Railway Starter | $5 |
| Database PostgreSQL | Incluida |
| Emails Gmail | $0 |
| **TOTAL 50 DÍAS** | **$5 USD** (~$9.000 CLP) |

### Alternativa: Render + Keep-Alive Script (No recomendado)
| Item | Costo |
|------|-------|
| Vercel | $0 |
| Render Free | $0 |
| Uptimerobot (ping) | $0-5 |
| **TOTAL** | **$0-5** |
**Problema**: No es 100% confiable, webhooks pueden fallar

---

## ✨ NEXT STEPS

1. **Opción A (RECOMENDADO)**: Railway
   - Ve a https://railway.app
   - Sigue los pasos de arriba
   - Agrega tarjeta de crédito (solo $5, sin sorpresas)

2. **Opción B (Si no quieres gastar)**: Render + Script
   - Usar Render free
   - Configurar uptimerobot para ping cada 14 min
   - Aceptar riesgo de webhooks atrasados

---

## 📞 Recomendación Final

**Para 50 días SIN PROBLEMAS:**
- ✅ Usar Railway ($5)
- ✅ Garantiza que todo funcione
- ✅ Los invitados pueden pagar sin preocupaciones
- ✅ Emails se envían al instante
- ✅ Admin panel siempre disponible

¿Comenzamos con Railway?
