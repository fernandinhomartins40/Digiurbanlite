#!/bin/sh
set -e

echo "=== DigiUrban Flow — Starting ==="

# Esperar pelo PostgreSQL usando pg_isready via variável DATABASE_URL
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

# Executar migrations Prisma
echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "Migrations completed."

# Iniciar servidor
echo "Starting DigiUrban Flow Server..."
exec node dist/index.js
