# DigiUrban - Container Único (Backend + Frontend + Nginx)
# Arquitetura: Multi-stage build para otimização
# MODIFICADO: Debian (node:18-bookworm-slim) ao invés de Alpine para suportar Playwright

# ========== STAGE 1: Build Backend ==========
FROM node:18-bookworm-slim AS backend-builder
WORKDIR /app/backend

# Build timestamp para invalidar cache
ARG BUILD_TIMESTAMP
RUN echo "Build timestamp: ${BUILD_TIMESTAMP}"

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

# ⚡ CACHE BUSTER: Força invalidação de cache antes de copiar código
RUN echo "Backend cache buster: ${BUILD_TIMESTAMP:-$(date +%s)}"

# Copiar package files do backend
COPY digiurban/backend/package.json digiurban/backend/package-lock.json ./
RUN npm install --legacy-peer-deps

# Copiar código do backend
COPY digiurban/backend ./

# Gerar Prisma Client (sem criar banco - apenas gerar tipos)
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL:-postgresql://digiurban:digiurban2024@postgres:5432/digiurban}
RUN npx prisma generate

# Build TypeScript (limpar cache incremental primeiro)
RUN rm -rf dist/.tsbuildinfo dist/* && npm run build

# Validar que arquivos críticos foram compilados
RUN test -f dist/index.js || (echo "❌ ERRO: index.js não foi compilado!" && exit 1)
RUN test -f dist/routes/citizen-services.js || (echo "❌ ERRO: citizen-services.js não foi compilado!" && exit 1)
RUN echo "✅ Build do TypeScript concluído com sucesso"

# ========== STAGE 2: Build Frontend ==========
FROM node:18-bookworm-slim AS frontend-builder
WORKDIR /app/frontend

# Build timestamp para invalidar cache
ARG BUILD_TIMESTAMP
RUN echo "Build timestamp: ${BUILD_TIMESTAMP}"

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
RUN echo "Frontend cache buster: ${BUILD_TIMESTAMP:-$(date +%s)}"

# ✅ CRÍTICO: API URL para produção
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copiar package files do frontend
COPY digiurban/frontend/package.json digiurban/frontend/package-lock.json ./
RUN npm install --legacy-peer-deps

# Copiar código do frontend
COPY digiurban/frontend ./

# Build Next.js
RUN npm run build

# Validar que o build do Next.js foi bem-sucedido
RUN test -d .next || (echo "❌ ERRO: Build do Next.js falhou!" && exit 1)
RUN test -f .next/BUILD_ID || (echo "❌ ERRO: BUILD_ID não foi gerado!" && exit 1)
RUN echo "✅ Build do Next.js concluído com sucesso"

# ========== STAGE 3: Production Image ==========
FROM node:18-bookworm-slim AS runner
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
COPY --from=backend-builder /app/backend/src/data ./dist/data
COPY --from=backend-builder /app/backend/src/seeds ./src/seeds
COPY --from=backend-builder /app/backend/src/services/bot/flows ./dist/services/bot/flows
COPY --from=backend-builder /app/backend/package.json ./
COPY --from=backend-builder /app/backend/node_modules/.prisma ./node_modules/.prisma

# Copiar scripts diretamente do contexto
COPY digiurban/backend/scripts ./scripts

# Copiar Playwright do builder e instalar browsers
COPY --from=backend-builder /app/backend/node_modules/playwright ./node_modules/playwright

# Playwright: definir path e instalar browsers
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright install chromium --with-deps

# Criar diretórios de dados e uploads
RUN mkdir -p /app/data /app/uploads /app/logs && \
    chown -R backend:nodejs /app/data /app/uploads /app/logs && \
    ln -sf /app/uploads /app/backend/uploads

# ===== Frontend =====
WORKDIR /app/frontend

# Copiar build do Next.js
COPY --from=frontend-builder --chown=frontend:nodejs /app/frontend/.next ./.next
COPY --from=frontend-builder --chown=frontend:nodejs /app/frontend/public ./public
COPY --from=frontend-builder --chown=frontend:nodejs /app/frontend/node_modules ./node_modules
COPY --from=frontend-builder --chown=frontend:nodejs /app/frontend/package.json ./package.json

# ===== Nginx =====
COPY docker/nginx.conf /etc/nginx/nginx.conf
RUN mkdir -p /var/log/nginx && \
    chown -R www-data:adm /var/log/nginx /var/lib/nginx || true

# ===== Supervisord =====
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/startup.sh /app/startup.sh
COPY docker/create-enums.sql /app/create-enums.sql
COPY docker/fix-subscription-status-enum.sql /app/fix-subscription-status-enum.sql
COPY digiurban/docker/create-bot-tables.sql /app/create-bot-tables.sql
RUN chmod +x /app/startup.sh

# Expor portas
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://127.0.0.1/health || exit 1

# Iniciar com startup script
CMD ["/app/startup.sh"]
