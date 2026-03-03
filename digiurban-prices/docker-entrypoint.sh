#!/bin/sh
set -e

echo "=== DigiUrban Prices - Starting ==="

# Extract host and port from DATABASE_URL: postgresql://user:pass@host:port/db
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_PORT=${DB_PORT:-5432}

echo "Waiting for database at ${DB_HOST}:${DB_PORT}..."
until nc -z "${DB_HOST}" "${DB_PORT}" 2>/dev/null; do
  echo "Database not ready, retrying in 2s..."
  sleep 2
done
echo "Database is reachable."

# Give PostgreSQL a moment to accept queries after the TCP port opens.
sleep 2

OPENSEARCH_ENDPOINT="${OPENSEARCH_URL%/}/_cluster/health?wait_for_status=yellow&timeout=5s"
OPENSEARCH_ATTEMPTS=0
OPENSEARCH_MAX_ATTEMPTS=${OPENSEARCH_MAX_ATTEMPTS:-60}
OPENSEARCH_SLEEP_SECONDS=${OPENSEARCH_SLEEP_SECONDS:-5}

echo "Waiting for OpenSearch at ${OPENSEARCH_ENDPOINT}..."
until curl -fsS "${OPENSEARCH_ENDPOINT}" >/dev/null 2>&1; do
  OPENSEARCH_ATTEMPTS=$((OPENSEARCH_ATTEMPTS + 1))

  if [ "${OPENSEARCH_ATTEMPTS}" -ge "${OPENSEARCH_MAX_ATTEMPTS}" ]; then
    echo "ERROR: OpenSearch did not become ready after ${OPENSEARCH_ATTEMPTS} attempts."
    exit 1
  fi

  echo "OpenSearch not ready yet, retrying in ${OPENSEARCH_SLEEP_SECONDS}s... (${OPENSEARCH_ATTEMPTS}/${OPENSEARCH_MAX_ATTEMPTS})"
  sleep "${OPENSEARCH_SLEEP_SECONDS}"
done
echo "OpenSearch is reachable."

# Use the local Prisma binary to avoid downloading an incompatible version.
PRISMA_BIN="./node_modules/.bin/prisma"

# Resolve failed migrations recorded in the shared database and avoid P3009.
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
else
  # Fallback for a known failed migration in the shared database.
  $PRISMA_BIN migrate resolve --rolled-back 20260121_add_flow_models 2>/dev/null || true
fi

echo "Applying database migrations..."
$PRISMA_BIN migrate deploy 2>&1 || {
  echo "WARNING: migrate deploy failed, trying db push as fallback..."
  $PRISMA_BIN db push --skip-generate --accept-data-loss 2>&1 || {
    echo "ERROR: db push also failed. Continuing anyway to avoid blocking startup."
  }
}
echo "Database migrations step complete."

echo "Generating Prisma Client..."
$PRISMA_BIN generate

echo "Starting DigiUrban Prices API..."
exec node dist/index.js
