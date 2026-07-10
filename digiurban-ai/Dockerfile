# ========== STAGE 1: Build ==========
FROM node:22-alpine AS builder

RUN apk add --no-cache \
    python3 \
    make \
    g++

WORKDIR /app

RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-timeout 60000

COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.prisma.json ./

RUN sh -c 'n=0; until npm install --legacy-peer-deps --prefer-offline --no-audit; do n=$((n+1)); if [ $n -ge 3 ]; then exit 1; fi; echo "retry npm install $n/3"; sleep 10; done'

COPY prisma ./prisma
COPY src ./src

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN ./node_modules/.bin/prisma generate

RUN npm run build

# ========== STAGE 2: Production ==========
FROM node:22-alpine

RUN apk add --no-cache \
    dumb-init \
    curl \
    netcat-openbsd

WORKDIR /app

RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-timeout 60000

COPY package*.json ./

RUN sh -c 'n=0; until npm install --omit=dev --legacy-peer-deps --prefer-offline --no-audit; do n=$((n+1)); if [ $n -ge 3 ]; then exit 1; fi; echo "retry npm install $n/3"; sleep 10; done'

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
COPY --from=builder /app/dist ./dist

RUN mkdir -p logs

EXPOSE 9004

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9004/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/docker-entrypoint.sh"]
