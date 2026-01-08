# ========== STAGE 1: Build ==========
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.prisma.json ./

# Instalar TODAS as dependências (incluindo devDependencies para build)
RUN npm install --legacy-peer-deps

# Copiar código fonte
COPY prisma ./prisma
COPY src ./src

# Gerar Prisma Client
RUN npx prisma generate

# Compilar TypeScript (apenas arquivos Prisma)
RUN npm run build:prisma

# ========== STAGE 2: Production ==========
FROM node:22-alpine

# Instalar dependências de runtime
RUN apk add --no-cache \
    openssl \
    ca-certificates \
    dumb-init

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar APENAS dependências de produção
RUN npm install --omit=dev --legacy-peer-deps

# Copiar Prisma schema e gerar client de produção
COPY prisma ./prisma
RUN npx prisma generate

# Copiar código compilado do builder (se houver dist)
COPY --from=builder /app/dist ./dist

# Copiar código fonte e script de produção
COPY src ./src
COPY start-server-production.js ./

# Criar diretórios necessários
RUN mkdir -p /app/data /app/logs && \
    chown -R node:node /app

# Usar usuário não-root
USER node

# Expor portas
EXPOSE 25 587

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('net').connect(587, 'localhost').on('connect', () => process.exit(0)).on('error', () => process.exit(1))"

# Iniciar servidor
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "start-server-production.js"]
