# DigiUrban - Container Único (Backend + Frontend + Nginx)
# Arquitetura: Multi-stage build para otimização

# ========== STAGE 1: Build Backend ==========
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend

# Build timestamp para invalidar cache
ARG BUILD_TIMESTAMP
RUN echo "Build timestamp: ${BUILD_TIMESTAMP}"

# Instalar dependências do sistema
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev

# Copiar package files do backend
COPY digiurban/backend/package.json digiurban/backend/package-lock.json ./
RUN npm install --legacy-peer-deps

# Copiar código do backend
COPY digiurban/backend ./

# Gerar Prisma Client (sem criar banco - apenas gerar tipos)
# ⚠️ IMPORTANTE: usar DATABASE_URL do PostgreSQL
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL:-postgresql://digiurban:digiurban2024@postgres:5432/digiurban}
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ========== STAGE 2: Build Frontend ==========
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Build timestamp para invalidar cache
ARG BUILD_TIMESTAMP
RUN echo "Build timestamp: ${BUILD_TIMESTAMP}"

# Build argument para API URL (usar caminho relativo para funcionar via Nginx)
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copiar package files do frontend
COPY digiurban/frontend/package.json digiurban/frontend/package-lock.json ./

# Instalar dependências (usar npm install ao invés de npm ci para evitar problemas)
RUN npm install --legacy-peer-deps

# Copiar código do frontend
COPY digiurban/frontend ./

# Build Next.js
RUN npm run build

# ========== STAGE 3: Production Image ==========
FROM node:18-alpine AS runner
WORKDIR /app

# Instalar Nginx, supervisord, PostgreSQL client e outras dependências
# coreutils: necessário para o comando 'timeout' usado no startup.sh
RUN apk add --no-cache nginx supervisor curl postgresql-client coreutils

# Criar usuários
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 backend && \
    adduser --system --uid 1002 frontend

# ===== Backend =====
WORKDIR /app/backend

# Copiar node_modules de produção do backend
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/prisma ./prisma
COPY --from=backend-builder /app/backend/src/data ./dist/data
COPY --from=backend-builder /app/backend/src/seeds ./src/seeds
COPY --from=backend-builder /app/backend/package.json ./
COPY --from=backend-builder /app/backend/node_modules/.prisma ./node_modules/.prisma

# Copiar scripts diretamente do contexto (não do builder)
COPY digiurban/backend/scripts ./scripts

# Criar diretórios de dados
RUN mkdir -p /app/data /app/uploads /app/logs && \
    chown -R backend:nodejs /app/data /app/uploads /app/logs

# ===== Frontend =====
WORKDIR /app/frontend

# Copiar build do Next.js
COPY --from=frontend-builder --chown=frontend:nodejs /app/frontend/.next/standalone ./
COPY --from=frontend-builder --chown=frontend:nodejs /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder --chown=frontend:nodejs /app/frontend/public ./public

# ===== Nginx =====
COPY docker/nginx.conf /etc/nginx/nginx.conf
RUN mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx /var/lib/nginx

# ===== Supervisord =====
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/startup.sh /app/startup.sh
RUN chmod +x /app/startup.sh

# Expor portas
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://127.0.0.1/health || exit 1

# Iniciar com startup script que prepara DB e depois inicia supervisord
CMD ["/app/startup.sh"]
