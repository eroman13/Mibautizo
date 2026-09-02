# ============================================================
# Dockerfile raíz - Construye el backend para Railway
# El contexto de build es la raíz del repositorio
# Usa Debian (node:20-slim) por compatibilidad con Prisma/OpenSSL
# ============================================================

FROM node:20-slim

WORKDIR /app

# Prisma requiere OpenSSL en Debian slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copiar archivos del backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma

# Instalar TODAS las dependencias (incluye devDependencies para tsc y prisma)
RUN npm install

# Copiar el resto del código fuente del backend
COPY backend/tsconfig.json ./
COPY backend/src ./src

# Generar cliente Prisma y compilar TypeScript
RUN npx prisma generate && npx tsc --skipLibCheck

ENV NODE_ENV=production

EXPOSE 8080

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/index.js"]
