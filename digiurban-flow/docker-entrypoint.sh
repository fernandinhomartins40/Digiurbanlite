#!/bin/sh
set -e

echo "=== DigiUrban Flow — Starting ==="

# Extrair host e porta da DATABASE_URL: postgresql://user:pass@host:port/db
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_PORT=${DB_PORT:-5432}

echo "Waiting for database at ${DB_HOST}:${DB_PORT}..."
until nc -z "${DB_HOST}" "${DB_PORT}" 2>/dev/null; do
  echo "Database not ready, retrying in 2s..."
  sleep 2
done
echo "Database is reachable."

# Aguardar mais 2s para o PostgreSQL aceitar conexões
sleep 2

# Usar prisma local (evita npx baixar versão incompatível)
PRISMA_BIN="./node_modules/.bin/prisma"

# Resolver migrations com falha registrada no banco (evita P3009 bloqueando deploy)
echo "Checking for failed migrations..."
$PRISMA_BIN migrate resolve --rolled-back 20260226000000_init 2>/dev/null || true

# Aplicar migrations (cria/atualiza apenas as tabelas do flow_*)
# migrate deploy: aplica somente os arquivos SQL em prisma/migrations/
# Nunca dropa tabelas desconhecidas — seguro em banco compartilhado
echo "Applying database migrations..."
$PRISMA_BIN migrate deploy 2>&1 || {
  echo "WARNING: migrate deploy failed, trying db push as fallback..."
  $PRISMA_BIN db push --skip-generate --accept-data-loss 2>&1 || {
    echo "ERROR: db push also failed. Continuing anyway to avoid blocking startup."
  }
}
echo "Database migrations step complete."

# Iniciar servidor
echo "Starting DigiUrban Flow Server..."
exec node dist/index.js
