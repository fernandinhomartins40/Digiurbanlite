FROM node:22-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    dumb-init \
    tini \
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

# Instalar dependências
RUN npm install --legacy-peer-deps

# Copiar código
COPY prisma ./prisma
COPY src ./src

# Gerar Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build:prisma
RUN npm run build

# Remover devDependencies
RUN npm prune --omit=dev

# Criar diretórios
RUN mkdir -p uploads logs

# Expor portas
EXPOSE 9001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Usar dumb-init para gerenciar processos
ENTRYPOINT ["dumb-init", "--"]

# Comando padrão: executar migrations e depois iniciar o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
