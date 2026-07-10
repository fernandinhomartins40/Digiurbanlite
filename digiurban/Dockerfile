# DigiUrban - Container Único (Backend + Frontend + Nginx)
# Arquitetura: Multi-stage build para otimização
# MODIFICADO: Debian (node:20-bookworm-slim) ao invés de Alpine para suportar Playwright

# ========== STAGE 1: Build Backend ==========
FROM node:20-bookworm-slim AS backend-builder
WORKDIR /app/backend

# Build timestamp e cache bust para invalidar cache
ARG BUILD_TIMESTAMP
ARG CACHE_BUST
RUN echo "Build timestamp: ${BUILD_TIMESTAMP}" && \
    echo "Cache bust: ${CACHE_BUST}"

# Instalar dependências do sistema (Debian equivalentes ao Alpine)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copiar package files do backend
COPY digiurban/backend/package.json digiurban/backend/package-lock.json ./
RUN sh -c 'n=0; until npm install --legacy-peer-deps; do n=$((n+1)); if [ $n -ge 3 ]; then exit 1; fi; echo "retry npm install $n/3"; sleep 10; done'

# Copiar código do backend
COPY digiurban/backend ./

# Copiar arquivos compartilhados (shared) para dentro do src
# Isso permite imports como '@shared/*' ou '../shared/*'
COPY digiurban/shared ./src/shared

# ⚡ CACHE BUSTER pós-COPY: deve ficar DEPOIS dos COPYs de código para invalidar cache
# Sem isso, docker reutiliza camada antiga quando só o código muda (não o package.json)
RUN echo "Backend source cache bust: ${BUILD_TIMESTAMP:-unknown} / ${CACHE_BUST:-unknown}"

# Gerar Prisma Client e Build TypeScript
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL:-postgresql://digiurban:digiurban2024@postgres:5432/digiurban}
RUN ./node_modules/.bin/prisma generate && \
    rm -rf dist/.tsbuildinfo dist/* && \
    npx tsc -p tsconfig.docker.json && \
    ls -la dist && \
    if [ ! -f "dist/index.js" ]; then echo "❌ ERRO: index.js não foi compilado!"; exit 1; fi && \
    if [ ! -f "dist/routes/citizen-services.js" ]; then echo "❌ ERRO: citizen-services.js não foi compilado!"; exit 1; fi && \
    if [ ! -f "dist/routes/prices-proxy.routes.js" ]; then echo "❌ ERRO: prices-proxy.routes.js não foi compilado!"; exit 1; fi && \
    echo "✅ Build do TypeScript concluído com sucesso"

# ========== STAGE 2: Build Frontend ==========
FROM node:20-bookworm-slim AS frontend-builder
WORKDIR /app/frontend

# Build timestamp e cache bust para invalidar cache
ARG BUILD_TIMESTAMP
ARG CACHE_BUST
RUN echo "Build timestamp: ${BUILD_TIMESTAMP}" && \
    echo "Cache bust: ${CACHE_BUST}"

# Instalar dependências para jscanify/canvas (Debian)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    libpixman-1-dev \
    libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/*

# ⚡ CACHE BUSTER
RUN echo "Frontend cache buster: ${BUILD_TIMESTAMP:-$(date +%s)}" && \
    echo "Additional cache bust: ${CACHE_BUST:-none}"

# ✅ CRÍTICO: API URLs para produção
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_MESSAGES_API_URL=/messages-api
ARG NEXT_PUBLIC_MESSAGES_WS_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MESSAGES_API_URL=$NEXT_PUBLIC_MESSAGES_API_URL
ENV NEXT_PUBLIC_MESSAGES_WS_URL=$NEXT_PUBLIC_MESSAGES_WS_URL

# Copiar package files do frontend
COPY digiurban/frontend/package.json digiurban/frontend/package-lock.json ./
RUN sh -c 'n=0; until npm install --legacy-peer-deps; do n=$((n+1)); if [ $n -ge 3 ]; then exit 1; fi; echo "retry npm install $n/3"; sleep 10; done'

# Copiar código do frontend
COPY digiurban/frontend ./

# Build Next.js com validação integrada
RUN npm run build && \
    test -d .next && echo "✅ .next directory exists" || { echo "❌ ERRO: .next não existe!"; exit 1; } && \
    test -f .next/BUILD_ID && echo "✅ BUILD_ID exists" || { echo "❌ ERRO: BUILD_ID não gerado!"; exit 1; } && \
    echo "✅ Build do Next.js concluído com sucesso"

# ========== STAGE 3: Production Image ==========
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Instalar Nginx, supervisord, PostgreSQL client, curl e dependências do Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    curl \
    postgresql-client \
    coreutils \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Criar usuários (Debian syntax)
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs --shell /bin/sh backend && \
    useradd --system --uid 1002 --gid nodejs --shell /bin/sh frontend

# ===== Backend =====
WORKDIR /app/backend

# Copiar node_modules de produção do backend
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/prisma ./prisma
COPY --from=backend-builder /app/backend/package.json ./
COPY --from=backend-builder /app/backend/node_modules/.prisma ./node_modules/.prisma

# Copiar diretórios de dados e seeds do código fonte (não do builder)
COPY digiurban/backend/src/data ./src/data
COPY digiurban/backend/src/seeds ./src/seeds

# Copiar scripts diretamente do contexto
COPY digiurban/backend/scripts ./scripts

# Copiar scripts de correção de migrations
COPY digiurban/backend/fix-production-migrations.js ./fix-production-migrations.js
COPY digiurban/backend/fix-categorization-migrations.js ./fix-categorization-migrations.js
COPY digiurban/backend/apply-uniqueness-migration.js ./apply-uniqueness-migration.js
COPY digiurban/backend/update-service-uniqueness.js ./update-service-uniqueness.js

# Playwright: instalar Chromium usando binário local dos node_modules copiados acima
# IMPORTANTE: usar ./node_modules/.bin/playwright (não npx) para garantir versão correta
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN node_modules/.bin/playwright install chromium

# Criar diretórios de dados e uploads
RUN mkdir -p /app/data /app/uploads /app/logs && \
    chown -R backend:nodejs /app/data /app/uploads /app/logs && \
    ln -sf /app/uploads /app/backend/uploads

# ===== Frontend =====
# output: 'standalone' → servidor é .next/standalone/server.js (não `next start`)
# Estrutura final em /app/frontend:
#   server.js              ← ponto de entrada (copiado do standalone)
#   node_modules/          ← dependências mínimas do standalone
#   .next/static/          ← assets JS/CSS
#   public/                ← arquivos estáticos públicos
WORKDIR /app/frontend

# 1. Copiar o conteúdo do standalone (server.js + node_modules mínimos)
COPY --from=frontend-builder --chown=frontend:nodejs /app/frontend/.next/standalone ./
# 2. Copiar static assets para o lugar que o server.js espera
COPY --from=frontend-builder --chown=frontend:nodejs /app/frontend/.next/static ./.next/static
# 3. Copiar public para o lugar que o server.js espera
COPY --from=frontend-builder --chown=frontend:nodejs /app/frontend/public ./public

# ===== Nginx =====
COPY docker/nginx.conf /etc/nginx/nginx.conf
RUN mkdir -p /var/log/nginx && \
    chown -R nginx:adm /var/log/nginx /var/lib/nginx || true

# ===== Supervisord =====
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/startup.sh /app/startup.sh
COPY docker/create-enums.sql /app/create-enums.sql
COPY docker/fix-subscription-status-enum.sql /app/fix-subscription-status-enum.sql
RUN chmod +x /app/startup.sh

# Expor portas
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://127.0.0.1/health || exit 1

# Iniciar com startup script
CMD ["/app/startup.sh"]
