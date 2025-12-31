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

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY prisma ./prisma
COPY src ./src
COPY start-server.js ./

# Compilar TypeScript
RUN npm run build

# Gerar Prisma Client
RUN npx prisma generate

# Criar diretórios necessários
RUN mkdir -p /app/data /app/logs && \
    chown -R node:node /app

# Usar usuário não-root
USER node

# Expor portas
EXPOSE 25 587

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('net').connect(587, 'localhost').on('connect', () => process.exit(0)).on('error', () => process.exit(1))"

# Iniciar servidor
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
