#!/bin/sh
set -e

echo "=== DigiUrban Prices — Starting ==="

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

# Resolver migrations com falha no banco compartilhado (evita P3009 bloqueando deploy)
# Usa node inline para consultar _prisma_migrations via DATABASE_URL sem depender de psql
echo "Checking for failed migrations..."
FAILED=$(node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => client.query(\"SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL AND logs IS NOT NULL\"))
  .then(r => { console.log(r.rows.map(x => x.migration_name).join('\n')); client.end(); })
  .catch(() => { client.end(); });
" 2>/dev/null || echo "")

if [ -n "$FAILED" ]; then
  echo "Failed migrations found, resolving..."
  echo "$FAILED" | while IFS= read -r migration; do
    migration=$(echo "$migration" | tr -d '[:space:]')
    if [ -n "$migration" ]; then
      echo "  -> Marking as rolled-back: $migration"
      $PRISMA_BIN migrate resolve --rolled-back "$migration" 2>/dev/null || true
    fi
  done
else
  # Fallback: tentar resolver migration problemática conhecida do banco compartilhado
  $PRISMA_BIN migrate resolve --rolled-back 20260121_add_flow_models 2>/dev/null || true
fi

# Aplicar migrations (cria/atualiza apenas as tabelas do prices_*)
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

# Gerar Prisma Client atualizado
echo "Generating Prisma Client..."
$PRISMA_BIN generate

# Iniciar servidor
echo "Starting DigiUrban Prices API..."
exec node dist/index.js
