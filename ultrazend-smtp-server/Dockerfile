# UltraZend SMTP Server - Production Dockerfile
FROM node:22-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    openssl \
    ca-certificates \
    dumb-init

# Criar diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.prisma.json ./

# Instalar todas as dependências (incluindo devDependencies para build)
# Nota: Usando npm install porque package-lock.json não está versionado
RUN npm install --legacy-peer-deps

# Copiar código fonte
COPY prisma ./prisma
COPY src ./src
COPY start-server-production.js ./

# Gerar Prisma Client
RUN npx prisma generate

# Compilar TypeScript (apenas arquivos Prisma)
RUN npm run build:prisma

# Criar diretórios necessários (antes do npm prune para garantir que sh existe)
RUN mkdir -p /app/data /app/logs && \
    chown -R node:node /app

# Remover devDependencies após build (movido para depois de criar diretórios)
RUN npm prune --omit=dev || true

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
