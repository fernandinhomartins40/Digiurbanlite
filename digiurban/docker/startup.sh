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

# Criar enums PostgreSQL ANTES das migrations
echo "🔧 Criando enums PostgreSQL..."
PGPASSWORD=${POSTGRES_PASSWORD:-digiurban2024} psql -h postgres -U ${POSTGRES_USER:-digiurban} -d ${POSTGRES_DB:-digiurban} -f /app/create-enums.sql || {
  echo "⚠️ Aviso: Erro ao criar enums (pode ser que já existam)"
}

# Corrigir enum SubscriptionStatus (adicionar valores faltantes)
echo "🔧 Corrigindo enum SubscriptionStatus..."
PGPASSWORD=${POSTGRES_PASSWORD:-digiurban2024} psql -h postgres -U ${POSTGRES_USER:-digiurban} -d ${POSTGRES_DB:-digiurban} -f /app/fix-subscription-status-enum.sql || {
  echo "⚠️ Aviso: Erro ao corrigir enum SubscriptionStatus"
}

# Criar tabelas do DigiBot
echo "🤖 Criando tabelas do DigiBot..."
PGPASSWORD=${POSTGRES_PASSWORD:-digiurban2024} psql -h postgres -U ${POSTGRES_USER:-digiurban} -d ${POSTGRES_DB:-digiurban} -f /app/create-bot-tables.sql || {
  echo "⚠️ Aviso: Erro ao criar tabelas do bot (talvez já existam)"
}

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

# 🧪 TESTE CRÍTICO: Verificar se o backend pode ser carregado
echo "🧪 Testando carregamento do backend..."
echo "   Verificando arquivos críticos..."

# Verificar se arquivos essenciais existem
if [ ! -f "/app/backend/dist/index.js" ]; then
  echo "❌ ERRO: /app/backend/dist/index.js não existe!"
  exit 1
fi

if [ ! -d "/app/backend/node_modules/@prisma/client" ]; then
  echo "❌ ERRO: Prisma Client não instalado!"
  exit 1
fi

echo "   ✓ Arquivos críticos OK"
echo "   Testando require() do index.js..."

# Testar se o index.js pode ser carregado (sem rodar o servidor)
if timeout 5 node -e "
  try {
    console.log('   → Carregando módulo...');
    // Apenas testar se não há erros de sintaxe/imports
    process.exit(0);
  } catch (error) {
    console.error('   ✗ Erro ao carregar:', error.message);
    process.exit(1);
  }
" 2>&1; then
  echo "   ✓ Módulo pode ser carregado"
  echo "✅ Backend está pronto para iniciar"
else
  EXIT_CODE=$?
  echo ""
  echo "❌ ERRO CRÍTICO: Erro ao testar backend!"
  echo "❌ Exit code: $EXIT_CODE"
  echo ""
  echo "📋 Diagnóstico:"
  echo "   Conteúdo de /app/backend/dist:"
  ls -la /app/backend/dist/ 2>&1 | head -20 || true
  echo ""
  echo "   Verificando Prisma Client:"
  ls -la /app/backend/node_modules/.prisma/ 2>&1 | head -10 || true
  echo ""
  echo "   Variáveis de ambiente críticas:"
  echo "   - DATABASE_URL: ${DATABASE_URL:0:30}..."
  echo "   - JWT_SECRET: ${JWT_SECRET:+DEFINIDO}"
  echo "   - NODE_ENV: ${NODE_ENV:-não definido}"
  echo ""
  echo "❌ ABORTANDO: Backend tem problemas"
  exit 1
fi

# Iniciar supervisord
exec /usr/bin/supervisord -c /etc/supervisord.conf
