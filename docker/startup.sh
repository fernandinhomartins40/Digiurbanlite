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

# Gerar Prisma Client se necessário
echo "🔧 Gerando Prisma Client..."
npx prisma generate || echo "⚠️ Prisma generate falhou"

# Executar migrations
echo "📦 Executando migrations do Prisma..."
npx prisma migrate deploy || {
  echo "⚠️ Migrations falharam, tentando db push..."
  npx prisma db push --skip-generate || {
    echo "❌ db push falhou"
    exit 1
  }
}

# Verificar se precisa executar seed
echo "🔍 Verificando se banco precisa de seed..."

# Criar script inline para verificação NO DIRETÓRIO DO BACKEND
cat > check-db.js <<'CHECKSCRIPT'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const userCount = await prisma.user.count();
    console.log(JSON.stringify({ userCount, needsSeed: userCount === 0 }));
    await prisma.$disconnect();
    process.exit(userCount === 0 ? 1 : 0);
  } catch (error) {
    console.error('Error checking database:', error.message);
    await prisma.$disconnect();
    // Retornar 1 para indicar que precisa de seed em caso de erro
    process.exit(1);
  }
}

check();
CHECKSCRIPT

# Executar verificação (timeout de 10s) NO DIRETÓRIO CORRETO
echo "Verificando existência de dados..."
INTEGRITY_RESULT=$(timeout 10 node check-db.js 2>&1 || echo "timeout_or_error")
INTEGRITY_EXIT_CODE=$?
rm -f check-db.js

echo "📋 Resultado: $INTEGRITY_RESULT"

# Executar seed se necessário (apenas se exit code != 0)
if [ $INTEGRITY_EXIT_CODE -ne 0 ]; then
  echo "🌱 Executando seed..."

  # Usar timeout para evitar que seed trave
  timeout 120 npm run db:seed
  SEED_EXIT=$?

  if [ $SEED_EXIT -eq 0 ]; then
    echo "✅ Seed concluído com sucesso"
  elif [ $SEED_EXIT -eq 124 ]; then
    echo "⚠️ Seed timeout após 120s - continuando mesmo assim"
  else
    echo "❌ Seed falhou com código $SEED_EXIT"
    # NÃO sair com erro - permitir que aplicação inicie mesmo sem seed
    echo "⚠️ Continuando sem seed - admin precisa popular manualmente"
  fi
else
  echo "ℹ️ Database já tem dados, seed não necessário"
fi

echo "✅ Startup concluído!"
echo "========================================="

# Iniciar supervisord
exec /usr/bin/supervisord -c /etc/supervisord.conf
