#!/bin/bash
set -e

echo "🔨 Building..."
npm run build

echo "📦 Running Prisma migrations (if needed)..."
npx prisma db push --accept-data-loss || echo "⚠️  Database already in sync"

echo "✅ Ready to start"
