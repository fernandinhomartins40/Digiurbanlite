#!/bin/sh
set -e

echo "========================================="
echo "UltraZend Face Server - Startup"
echo "========================================="

cd /app

PRISMA_BIN="./node_modules/.bin/prisma"

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

# Otimização VPS (docs/PLANO-OTIMIZACAO-VPS.md, M3): `prisma generate` era executado
# A CADA BOOT do container — trabalho de BUILD sendo feito em produção, gastando CPU
# numa VPS compartilhada a cada restart. O Dockerfile já roda `prisma generate` no
# estágio builder e copia node_modules/.prisma + node_modules/@prisma para a imagem
# final, então esta chamada era redundante.
echo "Iniciando servidor..."
exec node dist/index.js
