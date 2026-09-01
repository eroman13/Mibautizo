#!/bin/bash
set -e

echo "🔨 Building application..."
npm run build

echo "📦 Running database migrations..."
npm run start:prod &
BACKEND_PID=$!

# Give the server 5 seconds to start
sleep 5

if ps -p $BACKEND_PID > /dev/null 2>&1; then
  echo "✅ Server started successfully (PID: $BACKEND_PID)"
  wait $BACKEND_PID
else
  echo "❌ Server failed to start"
  exit 1
fi
