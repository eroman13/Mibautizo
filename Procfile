build: cd backend && npm install && npm run build
web: cd backend && (prisma db push --accept-data-loss 2>/dev/null || true) && node dist/index.js
