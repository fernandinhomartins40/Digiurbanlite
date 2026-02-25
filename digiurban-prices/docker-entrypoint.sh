#!/bin/sh
set -e

echo "[entrypoint] Generating Prisma Client..."
npx prisma generate

echo "[entrypoint] Starting digiurban-prices API..."
exec node dist/index.js
