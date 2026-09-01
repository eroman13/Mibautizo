# ============================================================
# Dockerfile para el backend - Mesa de Regalos Bautizo
# Build determinista para Railway (evita ambigüedad de Nixpacks)
# Usa Debian (node:20-slim) por compatibilidad con Prisma/OpenSSL
# ============================================================

FROM node:20-slim

WORKDIR /app

# Prisma requiere OpenSSL en Debian slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copiar archivos de dependencias primero (para cachear capa)
COPY package*.json ./
COPY prisma ./prisma

# Instalar TODAS las dependencias (incluye devDependencies para tsc y prisma)
RUN npm install

# Copiar el resto del código fuente
COPY tsconfig.json ./
COPY src ./src

# Generar cliente Prisma y compilar TypeScript
RUN npx prisma generate && npx tsc --skipLibCheck

ENV NODE_ENV=production

# Exponer el puerto 8080 (Railway usa 8080 para el dominio público)
EXPOSE 8080

# Iniciar el servidor
CMD ["node", "dist/index.js"]
