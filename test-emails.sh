#!/bin/bash

# Script de prueba del sistema de emails
# Simula un webhook de Mercado Pago con pago aprobado

BACKEND_URL="http://localhost:3000"
INVITADO_EMAIL="test@example.com"
NOMBRE_INVITADO="Juan Pérez"

echo "🧪 Iniciando prueba del sistema de emails..."
echo "📧 Email de prueba: $INVITADO_EMAIL"
echo ""

# Crear payload de webhook
WEBHOOK_PAYLOAD=$(cat <<EOF
{
  "type": "payment",
  "data": {
    "id": $(date +%s)
  }
}
EOF
)

# Para esta prueba, usaremos un ID de pago simulado
# (En producción, esto vendría de Mercado Pago)

echo "📤 Enviando request de prueba al backend..."
echo ""

# Hacer request de prueba
curl -X POST "$BACKEND_URL/api/webhook" \
  -H "Content-Type: application/json" \
  -d "$WEBHOOK_PAYLOAD" \
  -v

echo ""
echo ""
echo "✅ Request enviado. Verifica los logs del backend para confirmación de envío de emails."
echo ""
echo "Los logs deberían mostrar:"
echo "✅ Correo enviado: <message-id>"
echo "✅ Notificación enviada al admin: <message-id>"
