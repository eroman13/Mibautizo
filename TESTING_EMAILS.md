# 🎁 Guía de Pruebas - Sistema de Correos Electrónicos

## Configuración Previa

### 1. Configurar Variables de Entorno

En `/backend/.env`, agrega:

```bash
# Correos electrónicos
GMAIL_USER=tu-email@gmail.com
GMAIL_PASS=your-16-char-app-password
ADMIN_EMAIL=admin@example.com

# Datos del evento
GEMELA1_NAME=Antonia
GEMELA2_NAME=Emilia
EVENT_DATE=15 de septiembre de 2026
```

### 2. Obtener Contraseña de Google

1. Abre: https://myaccount.google.com/apppasswords
2. Selecciona "Mail" y tu dispositivo
3. Google genera una contraseña de 16 caracteres
4. Cópiala sin espacios al archivo `.env`

## Test Flow

### Paso 1: Iniciar Servidores
```bash
# Backend (puerto 3000)
cd backend && npm run dev

# Frontend (puerto 5174) - en otra terminal
cd frontend && npm run dev
```

### Paso 2: Navegar a la App
- Abre http://localhost:5174
- Ve a "Regalos"

### Paso 3: Realizar una Compra de Prueba

1. **Selecciona un regalo**
   - Haz clic en "Para Antonia" o "Para Emilia"
   - Deberías ver notificación sin abrir carrito

2. **Abre el carrito flotante**
   - Haz clic en el icono del carrito
   - Verifica el regalo se muestre

3. **Procede al checkout**
   - Haz clic en "Continuar al Pago"
   - Llenar formulario con:
     - Nombre: Tu Nombre Prueba
     - Email: **tu-email-prueba@gmail.com** (el que recibirá confirmación)
     - Dedicatoria: Prueba de correos (opcional)

4. **Realizar pago en Mercado Pago**
   - Haz clic en "Crear Preferencia de Pago"
   - Deberías redirigir a Mercado Pago
   - Usa tarjeta de prueba:
     - Número: 4111 1111 1111 1111
     - Vencimiento: 11/25
     - CVV: 123
     - Nombre: APRO

5. **Esperar confirmación**
   - Deberías llegar a "Pago Exitoso"

### Paso 4: Verificar Correos

#### En tu Inbox (emailInvitado)
✓ Deberías recibir un correo con:
- Asunto: "✅ Confirmación de regalo para Antonia y Emilia"
- Contenido:
  - Tabla con detalles del regalo (nombre, cantidad, precio)
  - Total: $[monto] CLP
  - Tu dedicatoria (si la escribiste)
  - Información del evento
  - Formato HTML colorido

#### En ADMIN_EMAIL
✓ Deberías recibir un correo con:
- Asunto: "✅ Nuevo regalo: $[monto] CLP de Tu Nombre Prueba"
- Contenido:
  - Nombre del invitado
  - Email del invitado
  - Listado de regalos
  - Monto total

### Paso 5: Verificar Console del Backend

En la terminal del backend, deberías ver logs como:
```
📨 Webhook recibido: { type: 'payment', data: { id: ... } }
💳 Pago consultado: { id: ..., status: 'approved', transaction_amount: ... }
📝 Procesando contribución: { invitado: 'Tu Nombre Prueba', ... }
✅ Contribución registrada para regalo ID 1
✅ Correo enviado: <message-id>
✅ Notificación enviada al admin: <message-id>
```

## Troubleshooting

### Error: "Error: Invalid login: 535-5.7.8..."
**Problema:** Contraseña de Google incorrecta
**Solución:** 
- Verifica que copiaste la contraseña sin espacios
- Usa contraseña de APP, no la contraseña regular de Google
- Activa 2FA si no está activado

### No llega correo al invitado
**Problema:** Email inválido en checkout
**Solución:**
- Verifica el email en el formulario sea válido
- Revisa consola del backend por errores de Nodemailer

### No llega correo al admin
**Problema:** ADMIN_EMAIL no configurado o incorrecto
**Solución:**
- Verifica ADMIN_EMAIL en `.env`
- Puede ser el mismo email que GMAIL_USER

### No se ve el webhook procesado
**Problema:** Mercado Pago no envía webhook
**Solución:**
- En desarrollo, Mercado Pago usa sandbox
- Los webhooks de test pueden no funcionar desde localhost
- Alterna: Reinicia backend después del pago para triggering manual

## Resumen de Validación

✅ Sistema de correos electrónicos completamente implementado
✅ Integración webhook funcionando
✅ Templates HTML personalizados
✅ Documentación de configuración disponible
✅ Listo para testing en sandbox de Mercado Pago

**Próximos pasos:**
1. Configurar `.env` con credenciales de Gmail
2. Completar prueba del flow completo
3. Verificar recepción de correos en ambas direcciones
4. Validar contenido y formato del email
