# Backend Dockerfile for DigiUrban
FROM node:18-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Instalar dependências necessárias para Playwright no Debian
RUN apt-get update && apt-get install -y \
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
    && rm -rf /var/lib/apt/lists/*

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Build stage
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Instalar dependências necessárias para Playwright no Debian
RUN apt-get update && apt-get install -y \
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

# Create app user
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs backend

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Copy Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Playwright usa seus próprios browsers bundled
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Instalar browsers do Playwright ANTES de criar usuário não-root
RUN npx playwright install chromium

# Create directory for SQLite database
RUN mkdir -p /app/data
RUN chown backend:nodejs /app/data

# ✅ Create directory for logs (Winston)
RUN mkdir -p /app/logs
RUN chown backend:nodejs /app/logs

# ✅ Create directory for backups (persistente)
RUN mkdir -p /app/backups
RUN chown backend:nodejs /app/backups

# ✅ Create directory for uploads (geração de PDFs)
RUN mkdir -p /app/uploads/generated
RUN chown -R backend:nodejs /app/uploads

USER backend

EXPOSE 3001

ENV PORT 3001
ENV DATABASE_URL "file:/app/data/dev.db"

# Start the application
CMD ["node", "dist/index.js"]