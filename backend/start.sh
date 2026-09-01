#!/bin/bash
set -e

echo "🔨 Starting Mesa de Regalos Backend..."
echo "📦 Environment: $NODE_ENV"
echo "🌐 Server will run on port $PORT or 3000"

# Compile TypeScript
echo "⚙️ Compiling TypeScript..."
npm run build

# Sync database schema (best effort, don't fail if it errors)
echo "🗄️  Syncing database..."
prisma db push --accept-data-loss || echo "⚠️ Database sync skipped (using existing schema)"

# Start the server
echo "🚀 Starting Express server..."
node dist/index.js

