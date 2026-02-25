# ========== STAGE 1: Build ==========
FROM node:22-alpine AS builder

WORKDIR /app

# Configurar npm para ambientes CI/CD
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-timeout 60000

# Copiar package files
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.prisma.json ./

# Instalar TODAS as dependências (incluindo devDependencies para build)
RUN npm install --legacy-peer-deps --prefer-offline --no-audit

# Copiar código fonte
COPY prisma ./prisma
COPY src ./src

# Gerar Prisma Client (com DATABASE_URL dummy para build)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN ./node_modules/.bin/prisma generate

# Compilar TypeScript (arquivos Prisma)
RUN npm run build:prisma

# ========== STAGE 2: Production ==========
FROM node:22-alpine

# Instalar dependências de runtime
RUN apk add --no-cache \
    openssl \
    ca-certificates \
    dumb-init

WORKDIR /app

# Configurar npm para ambientes CI/CD
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-timeout 60000

# Copiar package files
COPY package*.json ./

# Instalar APENAS dependências de produção
RUN npm install --omit=dev --legacy-peer-deps --prefer-offline --no-audit

# Copiar Prisma Client gerado no builder (evita conflito de versões)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

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
