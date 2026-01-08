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

# Copiar package files
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.prisma.json ./

# Instalar TODAS as dependências (incluindo devDependencies para build)
RUN npm install --legacy-peer-deps

# Copiar código
COPY prisma ./prisma
COPY src ./src

# Gerar Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build:prisma
RUN npm run build

# ========== STAGE 2: Production ==========
FROM node:22-alpine

# Instalar apenas dependências de runtime
RUN apk add --no-cache dumb-init tini

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar APENAS dependências de produção
RUN npm install --omit=dev --legacy-peer-deps

# Copiar Prisma schema e gerar client de produção
COPY prisma ./prisma
RUN npx prisma generate

# Copiar código compilado do builder
COPY --from=builder /app/dist ./dist

# Criar diretórios
RUN mkdir -p uploads logs

# Expor portas
EXPOSE 9001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Usar dumb-init para gerenciar processos
ENTRYPOINT ["dumb-init", "--"]

# Comando padrão: iniciar o servidor
# Nota: Migrations são executadas pelo container principal (digiurban)
CMD ["node", "dist/index.js"]
