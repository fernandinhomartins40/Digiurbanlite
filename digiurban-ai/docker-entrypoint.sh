#!/bin/sh
set -e

echo "=== DigiUrban AI - Starting ==="

DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_PORT=${DB_PORT:-5432}

echo "Waiting for database at ${DB_HOST}:${DB_PORT}..."
until nc -z "${DB_HOST}" "${DB_PORT}" 2>/dev/null; do
  echo "Database not ready, retrying in 2s..."
  sleep 2
done
echo "Database is reachable."

sleep 2

PRISMA_BIN="./node_modules/.bin/prisma"

echo "Checking for failed migrations..."
FAILED=$(node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => client.query(\"SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL AND logs IS NOT NULL\"))
  .then(r => { console.log(r.rows.map(x => x.migration_name).join('\\n')); client.end(); })
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
fi

echo "Applying database migrations..."
$PRISMA_BIN migrate deploy 2>&1 || {
  echo "WARNING: migrate deploy failed, trying db push as fallback..."
  $PRISMA_BIN db push --skip-generate --accept-data-loss 2>&1 || {
    echo "ERROR: db push also failed. Continuing startup to avoid blocking deploy."
  }
}
echo "Database migrations step complete."

echo "Generating Prisma Client..."
$PRISMA_BIN generate

echo "Starting DigiUrban AI API..."
exec node dist/index.js
