# ========== STAGE 1: Build ==========
FROM node:22-alpine AS builder

# Dependências de build
RUN apk add --no-cache \
    python3 \
    make \
    g++

WORKDIR /app

# Configurar npm
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-timeout 60000

# Copiar package files
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.prisma.json ./

# Instalar TODAS as dependências
RUN npm install --legacy-peer-deps --prefer-offline --no-audit

# Copiar código
COPY prisma ./prisma
COPY src ./src

# Gerar Prisma Client
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN ./node_modules/.bin/prisma generate

# Build TypeScript
RUN npm run build

# ========== STAGE 2: Production ==========
FROM node:22-alpine

# Playwright (Chromium do sistema) + netcat para esperar o DB no entrypoint
RUN apk add --no-cache \
    dumb-init \
    netcat-openbsd \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto \
    font-noto-cjk

# Usar o Chromium do Alpine (não baixar binários separados)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Configurar npm
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-timeout 60000

# Copiar package files
COPY package*.json ./

# Instalar dependências de produção (Playwright usa o Chromium do sistema)
RUN npm install --omit=dev --legacy-peer-deps --prefer-offline --no-audit

# Copiar Prisma Client do builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

# Copiar código compilado
COPY --from=builder /app/dist ./dist

# Copiar templates HTML
COPY templates ./templates

# Criar diretórios
RUN mkdir -p uploads logs

# Expor porta
EXPOSE 9003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9003/api/v1/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Copiar script de startup
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Usar dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Startup: migrations + servidor
CMD ["/app/docker-entrypoint.sh"]
