# ========== STAGE 1: Build ==========
FROM node:22-alpine AS builder

# Instalar dependências de build
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

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

# Copiar código
COPY prisma ./prisma
COPY src ./src

# Gerar Prisma Client (com DATABASE_URL dummy para build)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Build TypeScript
RUN npm run build:prisma
RUN npm run build
RUN mkdir -p dist/bot/flows && cp -r src/bot/flows/* dist/bot/flows/

# ========== STAGE 2: Production ==========
FROM node:22-alpine

# Instalar apenas dependências de runtime
RUN apk add --no-cache dumb-init tini

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

# Copiar código compilado do builder
COPY --from=builder /app/dist ./dist

# Criar diretórios
RUN mkdir -p uploads logs

# Expor portas
EXPOSE 9001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Copiar script de startup
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Usar dumb-init para gerenciar processos
ENTRYPOINT ["dumb-init", "--"]

# Startup: migrations + servidor
CMD ["/app/docker-entrypoint.sh"]
