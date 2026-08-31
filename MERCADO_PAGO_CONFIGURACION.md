# 🛒 Configuración Completa: Mercado Pago

**Fecha:** 28 de agosto de 2026  
**Status:** ✅ Completamente Configurado

---

## 🔑 Credenciales

### Access Token (Backend)
```
APP_USR-6032208155105752-010810-61dba3eba0dd04d9fe6834080b8e4141-3120378089
```

### Public Key (Frontend)
```
APP_USR-d437a4b4-5235-4190-a083-326bf35e3c9d
```

---

## ⚙️ Configuración Backend

### Variables de Entorno (`.env`)

```env
# Mercado Pago
MP_ACCESS_TOKEN=APP_USR-6032208155105752-010810-61dba3eba0dd04d9fe6834080b8e4141-3120378089
MP_PUBLIC_KEY=APP_USR-d437a4b4-5235-4190-a083-326bf35e3c9d

# URLs de Retorno
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

### Configuración en el Servicio de Pagos

**Archivo:** `/backend/src/modules/reservations/payments.service.ts`

```typescript
const body: any = {
  items: [
    {
      title: 'Alquiler de Campers',
      quantity: 1,
      unit_price: totalPrice,
      description: `Camper: ${camperData.modelo}`,
    }
  ],
  back_urls: {
    success: `${frontendUrl}/reserva/confirmacion`,
    failure: `${frontendUrl}/reserva/error`,
    pending: `${frontendUrl}/reserva/pendiente`,
  },
  auto_return: 'approved',  // ✅ Redirección automática aprobada
  notification_url: `${backendUrl}/reservations/webhook`,
  external_reference: reservationData.id.toString(),
  statement_descriptor: 'CAMPERS RENTAL',  // Descriptor en estado de cuenta
  payer: {
    email: reservationData.email
  }
};

const preference = await this.mpService.preferences.create({ body });
return {
  id: reservationData.id,
  mercadopagoPreferenceId: preference.id,
  init_point: preference.init_point,
  preference_id: preference.id
};
```

---

## 🎨 Configuración Frontend

### Inicializar Mercado Pago

**Archivo:** `vite.config.ts` o en el componente principal

```typescript
import { initMercadoPago } from '@mercadopago/sdk-js';

initMercadoPago('APP_USR-d437a4b4-5235-4190-a083-326bf35e3c9d');
```

### Componente de Pago (Wallet)

```typescript
import { Wallet } from '@mercadopago/sdk-js';

const checkout = new Wallet({
  initialization: {
    preferenceId: preferenceId // Del backend
  },
  customization: {
    texts: {
      valueProp: 'smart_option'
    }
  }
});

checkout.mount('#walletContainer');
```

---

## 📍 URLs de Retorno Configuradas

| Estado | URL |
|--------|-----|
| **Éxito** | `http://localhost:5173/reserva/confirmacion` |
| **Error** | `http://localhost:5173/reserva/error` |
| **Pendiente** | `http://localhost:5173/reserva/pendiente` |

### Parámetros Capturados en las URLs

Las URLs de Mercado Pago pasan los siguientes parámetros en la query string:

```
?payment_id=XXXXX
&status=approved
&external_reference=XXXXX
&merchant_order_id=XXXXX
```

---

## 📧 Email Configuration (Complementario)

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=eroman13@gmail.com
MAIL_PASS=ppscnhtvihcwetpj
ADMIN_EMAIL=eroman13@gmail.com
```

---

## 🧪 Testing

### Opción 1: Postman

```json
POST http://localhost:3000/reservations
Content-Type: application/json

{
  "usuarioId": 1,
  "camperId": 1,
  "fechaInicio": "2026-01-15",
  "fechaFin": "2026-01-20",
  "cliente": {
    "nombre": "Test Usuario",
    "email": "test@test.com",
    "telefono": "+56912345678"
  },
  "extras": {}
}
```

**Respuesta Esperada:**
```json
{
  "id": 1,
  "mercadopagoPreferenceId": "1234567890-abcdefg",
  "init_point": "https://www.mercadopago.com/checkout/v1/redirect?preference_id=1234567890-abcdefg",
  "preference_id": "1234567890-abcdefg"
}
```

### Opción 2: cURL

```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioId": 1,
    "camperId": 1,
    "fechaInicio": "2026-01-15",
    "fechaFin": "2026-01-20",
    "cliente": {
      "nombre": "Test Usuario",
      "email": "test@test.com",
      "telefono": "+56912345678"
    },
    "extras": {}
  }'
```

---

## ✅ Problemas Resueltos

### Error: "auto_return invalid. back_url.success must be defined"

**Causa:** Faltaba el parámetro `auto_return` en la preferencia.

**Solución:** Agregar `auto_return: 'approved'` en la configuración de la preferencia.

```typescript
auto_return: 'approved',  // ✅ Requerido por SDK de Mercado Pago
```

---

## 📚 Documentación Oficial

- **Mercado Pago Dev:** https://www.mercadopago.com.ar/developers/es
- **SDK JS:** https://github.com/mercadopago/sdk-js
- **Checkout Pro:** https://www.mercadopago.com.mx/developers/es/docs/checkout-pro
- **Credenciales:** https://www.mercadopago.com.ar/developers/panel/credentials

---

## 🚀 Pasos para Implementar en Otro Proyecto

1. **Copiar credenciales** en el archivo `.env`
2. **Instalar SDK:** `npm install @mercadopago/sdk-js`
3. **Configurar Backend:** Implementar el servicio de pagos según el ejemplo
4. **Configurar Frontend:** Inicializar Mercado Pago e implementar Wallet
5. **Crear URLs de retorno:** Las 3 páginas (confirmación, error, pendiente)
6. **Configurar webhook:** Para recibir notificaciones de pagos
7. **Probar con Postman o cURL**

---

## 📞 Soporte

Si experimentas errores, verifica:

✅ Las credenciales estén correctas en `.env`  
✅ Las URLs de retorno coincidan en backend y frontend  
✅ El parámetro `auto_return: 'approved'` esté presente  
✅ La URL del webhook esté correctamente configurada  
✅ El email del payer esté configurado  

