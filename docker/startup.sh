#!/bin/sh
set -e

echo "========================================="
echo "🚀 DigiUrban - Startup"
echo "========================================="

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p /app/uploads /app/logs
chmod 777 /app/uploads /app/logs

# Ir para diretório do backend
cd /app/backend

# Aguardar PostgreSQL estar pronto
echo "⏳ Aguardando PostgreSQL..."
max_attempts=30
attempt=0
until pg_isready -h postgres -U ${POSTGRES_USER:-digiurban} > /dev/null 2>&1 || [ $attempt -eq $max_attempts ]; do
  echo "   PostgreSQL não está pronto ainda... ($attempt/$max_attempts)"
  attempt=$((attempt + 1))
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ PostgreSQL não respondeu após $max_attempts tentativas"
  exit 1
fi

echo "✅ PostgreSQL está pronto!"

# Executar migrations PRIMEIRO (antes de gerar client)
echo "📦 Executando migrations do Prisma..."
npx prisma migrate deploy || {
  echo "⚠️ Migrations falharam, tentando db push..."
  npx prisma db push --skip-generate || {
    echo "❌ db push falhou"
    exit 1
  }
}

# Gerar Prisma Client APÓS migrations (para garantir sincronização)
echo "🔧 Gerando Prisma Client..."
npx prisma generate || {
  echo "❌ Prisma generate falhou"
  exit 1
}

# Executar seed de forma simplificada
echo "🔍 Verificando se banco precisa de seed..."

# Usar node inline para verificação rápida (sem arquivos temporários)
NEEDS_SEED=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count()
  .then(count => {
    console.log(count === 0 ? 'YES' : 'NO');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    console.log('YES');
    process.exit(0);
  })
  .finally(() => prisma.\$disconnect());
" 2>&1 | tail -1)

echo "📋 Precisa seed: $NEEDS_SEED"

if [ "$NEEDS_SEED" = "YES" ]; then
  echo "🌱 Executando seed..."

  # Executar seed com timeout usando coreutils
  if timeout 180 npm run db:seed; then
    echo "✅ Seed concluído com sucesso"
  else
    SEED_EXIT=$?
    if [ $SEED_EXIT -eq 124 ]; then
      echo "⚠️ Seed timeout após 180s - continuando"
    else
      echo "⚠️ Seed falhou com código $SEED_EXIT - continuando"
    fi
  fi
else
  echo "ℹ️ Database já tem dados, seed não necessário"
fi

echo "✅ Startup concluído!"
echo "========================================="

# Iniciar supervisord
exec /usr/bin/supervisord -c /etc/supervisord.conf
