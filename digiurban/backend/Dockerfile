# Backend Dockerfile for DigiUrban
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

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

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Copy Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create directory for SQLite database
RUN mkdir -p /app/data
RUN chown backend:nodejs /app/data

USER backend

EXPOSE 3001

ENV PORT 3001
ENV DATABASE_URL "file:/app/data/dev.db"

# Start the application
CMD ["node", "dist/index.js"]