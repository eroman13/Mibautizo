#!/bin/bash

echo "🔨 Starting Mesa de Regalos Backend..."
echo "📦 Environment: $NODE_ENV"
echo "🌐 Server will run on port $PORT or 3000"

# Compile TypeScript (MUST succeed)
echo "⚙️ Compiling TypeScript..."
if ! npm run build; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build successful"

# Sync database schema (optional, don't fail)
echo "🗄️  Syncing database..."
npx prisma db push --accept-data-loss 2>/dev/null || echo "⚠️ Database sync skipped"

# Start the server (MUST be last)
echo "🚀 Starting Express server..."
exec node dist/index.js

