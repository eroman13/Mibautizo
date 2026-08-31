# Configuración de Correos Electrónicos

## Para habilitar el envío de correos de confirmación, agrega estas variables a tu archivo `.env`:

```bash
# Gmail SMTP
GMAIL_USER=tu-email@gmail.com
GMAIL_PASS=tu-contraseña-app-de-gmail

# Email del administrador (para recibir notificaciones)
ADMIN_EMAIL=tu-email@gmail.com

# Información del evento (para los correos)
GEMELA1_NAME=Antonia
GEMELA2_NAME=Emilia
EVENT_DATE=15 de septiembre de 2026
```

## Cómo obtener credenciales de Gmail:

1. Ve a: https://myaccount.google.com/apppasswords
2. Selecciona "Mail" y "Windows Computer" (o tu dispositivo)
3. Google te generará una contraseña de 16 caracteres
4. Copia esa contraseña en `GMAIL_PASS` (sin espacios)

**Importante:** 
- No es tu contraseña de Gmail normal
- Es una "contraseña de aplicación" específica para aplicaciones
- Debes tener activada la verificación en dos pasos en tu cuenta de Google

## Funcionalidad:

Cuando alguien realiza un pago exitoso a través de Mercado Pago:

✅ **Correo al invitado:**
- Confirmación de su regalo
- Detalles del monto y productos
- Dedicatoria (si la escribió)
- Información del evento

✅ **Correo al administrador:**
- Notificación de nuevo regalo recibido
- Datos del invitado
- Monto y productos

## Pruebas:

Para probar sin configurar Gmail:
1. Los correos se loguearán en consola (backend)
2. El sistema funcionará sin enviarlos realmente
3. Habilita la funcionalidad cuando estés listo
