# DigiUrban - Container Único (Backend + Frontend + Nginx)
# Baseado no padrão da Advocacia Pitanga com Playwright funcionando

# ========== STAGE 1: Build Backend ==========
FROM node:18-bookworm-slim AS backend-builder
WORKDIR /app/backend

# Build timestamp para invalidar cache
ARG BUILD_TIMESTAMP
RUN echo "Build timestamp: ${BUILD_TIMESTAMP}"

# Instalar dependências do sistema necessárias para build
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# ⚡ CACHE BUSTER: Força invalidação de cache antes de copiar código
RUN echo "Backend cache buster: ${BUILD_TIMESTAMP:-$(date +%s)}"

# Copiar package files do backend
COPY digiurban/backend/package.json digiurban/backend/package-lock.json ./
RUN npm install --legacy-peer-deps

# Copiar código do backend
COPY digiurban/backend ./

# Gerar cliente Prisma
RUN npx prisma generate

# Build do backend
RUN rm -rf dist/.tsbuildinfo dist/* && npm run build

# ========== STAGE 2: Build Frontend ==========
FROM node:18-bookworm-slim AS frontend-builder
WORKDIR /app/frontend

# Build timestamp
ARG BUILD_TIMESTAMP
RUN echo "Build timestamp: ${BUILD_TIMESTAMP}"

# Instalar dependências do sistema necessárias para build
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Cache buster
RUN echo "Frontend cache buster: ${BUILD_TIMESTAMP:-$(date +%s)}"

# Copiar package files do frontend
COPY digiurban/frontend/package.json digiurban/frontend/package-lock.json ./
RUN npm install --legacy-peer-deps

# Copiar código do frontend
COPY digiurban/frontend ./

# Build arguments para Next.js
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}

# Build do frontend
RUN npm run build

# ========== STAGE 3: Runner (Backend + Frontend + Nginx) ==========
FROM node:18-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV production

# Instalar dependências necessárias para runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
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
    fonts-freefont-ttf \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Playwright usa seus próprios browsers bundled
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Criar usuários do sistema
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs backend && \
    useradd --system --uid 1002 --gid nodejs frontend

# ========== Backend Setup ==========
WORKDIR /app/backend

# Copiar build do backend
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/prisma ./prisma

# Criar diretórios do backend
RUN mkdir -p uploads/documentos uploads/documentos-gerados data logs backups && \
    chown -R backend:nodejs uploads data logs backups

# ========== Frontend Setup ==========
WORKDIR /app/frontend

# Copiar build do frontend
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder /app/frontend/public ./public

# Criar diretório .next
RUN mkdir -p .next && chown -R frontend:nodejs .next

# ========== Instalar Playwright ANTES de trocar usuário ==========
WORKDIR /app/backend
RUN npx playwright install chromium --with-deps

# ========== Nginx Configuration ==========
RUN rm -f /etc/nginx/sites-enabled/default

# Copiar configurações do nginx
COPY digiurban/docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY digiurban/docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# ========== Supervisor Configuration ==========
COPY digiurban/docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Criar diretórios de log
RUN mkdir -p /var/log/supervisor /var/log/nginx && \
    chmod -R 755 /var/log/supervisor /var/log/nginx

EXPOSE 80

# Iniciar supervisor (gerencia backend, frontend e nginx)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
