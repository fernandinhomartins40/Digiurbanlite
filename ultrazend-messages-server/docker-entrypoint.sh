#!/bin/sh
set -e

echo "========================================="
echo "UltraZend Messages Server - Startup"
echo "========================================="

cd /app

# Aguardar PostgreSQL estar pronto
echo "Aguardando PostgreSQL..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.\$queryRaw\`SELECT 1\`
      .then(() => { prisma.\$disconnect(); process.exit(0); })
      .catch(() => { prisma.\$disconnect(); process.exit(1); });
  " 2>/dev/null; then
    echo "PostgreSQL pronto!"
    break
  fi
  attempt=$((attempt + 1))
  echo "  PostgreSQL nao esta pronto... ($attempt/$max_attempts)"
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "ERRO: PostgreSQL nao respondeu"
  exit 1
fi

# Executar migrations
echo "Executando migrations..."
npx prisma migrate deploy 2>&1 || {
  echo "AVISO: prisma migrate deploy falhou, tentando aplicar SQL manualmente..."
  # Fallback: aplicar migrations SQL diretamente
  for migration_dir in prisma/migrations/*/; do
    if [ -f "$migration_dir/migration.sql" ]; then
      echo "  Aplicando: $migration_dir"
      node -e "
        const { PrismaClient } = require('@prisma/client');
        const fs = require('fs');
        const prisma = new PrismaClient();
        const sql = fs.readFileSync('$migration_dir/migration.sql', 'utf8');
        const statements = sql.split(';').filter(s => s.trim());
        (async () => {
          for (const stmt of statements) {
            try { await prisma.\$executeRawUnsafe(stmt); } catch(e) { /* ignore duplicate */ }
          }
          await prisma.\$disconnect();
        })();
      " 2>/dev/null || true
    fi
  done
}

echo "Startup concluido! Iniciando servidor..."
exec node dist/index.js
