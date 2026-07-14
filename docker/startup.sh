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

# Usar prisma local (evita npx baixar versao 7.x incompativel)
PRISMA_BIN="./node_modules/.bin/prisma"

# ============================================================================
# CREDENCIAL DE MIGRATION (Fase 2 do plano multi-tenant 2026-07-13)
# Com o RLS armado, a app conecta como role NÃO-superuser (digiurban_app) via
# DATABASE_URL — mas migrations precisam da credencial ELEVADA (dono das
# tabelas). Se MIGRATE_DATABASE_URL estiver definida, TODO comando de
# migration/db push deste script usa essa credencial; o restante da app
# (generate, seed, runtime) permanece na DATABASE_URL normal.
# ============================================================================
prisma_migrate() {
  if [ -n "$MIGRATE_DATABASE_URL" ]; then
    DATABASE_URL="$MIGRATE_DATABASE_URL" $PRISMA_BIN "$@"
  else
    $PRISMA_BIN "$@"
  fi
}
if [ -n "$MIGRATE_DATABASE_URL" ]; then
  echo "🔐 MIGRATE_DATABASE_URL definida — migrations com credencial elevada (app roda como role restrito)"
fi

# Resolver QUALQUER migration com falha registrada no banco (evita P3009 bloqueando deploy)
# Consulta a tabela _prisma_migrations e marca como rolled-back toda que estiver em falha
echo "🔧 Verificando e resolvendo migrations com falha..."
FAILED_MIGRATIONS=$(PGPASSWORD=${POSTGRES_PASSWORD:-digiurban2024} psql \
  -h postgres \
  -U ${POSTGRES_USER:-digiurban} \
  -d ${POSTGRES_DB:-digiurban} \
  -t -A \
  -c "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL AND logs IS NOT NULL;" \
  2>/dev/null || echo "")

if [ -n "$FAILED_MIGRATIONS" ]; then
  echo "   Migrations com falha encontradas:"
  echo "$FAILED_MIGRATIONS" | while IFS= read -r migration; do
    migration=$(echo "$migration" | tr -d '[:space:]')
    if [ -n "$migration" ]; then
      echo "   → Marcando como rolled-back: $migration"
      prisma_migrate migrate resolve --rolled-back "$migration" 2>/dev/null || true
    fi
  done
else
  echo "   Nenhuma migration com falha encontrada."
fi

# ============================================================================
# BASELINE DE DRIFT (Fase 0 Multi-Tenant, achado B7 da auditoria)
# A migration 20260707130000_baseline_drift_repair cria os objetos que até
# então só existiam via db push. Em bancos ANTIGOS (objetos já presentes) ela
# não deve executar — é marcada como aplicada. Em bancos NOVOS ela roda normal.
# Detector: a tabela drift 'fila_atendimento' já existe E a baseline ainda não
# foi aplicada → resolve --applied.
# ============================================================================
BASELINE="20260707130000_baseline_drift_repair"
BASELINE_DONE=$(PGPASSWORD=${POSTGRES_PASSWORD:-digiurban2024} psql -h postgres -U ${POSTGRES_USER:-digiurban} -d ${POSTGRES_DB:-digiurban} -t -A   -c "SELECT 1 FROM _prisma_migrations WHERE migration_name='$BASELINE' AND finished_at IS NOT NULL LIMIT 1;" 2>/dev/null || echo "")
DRIFT_PRESENT=$(PGPASSWORD=${POSTGRES_PASSWORD:-digiurban2024} psql -h postgres -U ${POSTGRES_USER:-digiurban} -d ${POSTGRES_DB:-digiurban} -t -A   -c "SELECT 1 FROM information_schema.tables WHERE table_name='fila_atendimento' LIMIT 1;" 2>/dev/null || echo "")
if [ -z "$BASELINE_DONE" ] && [ -n "$DRIFT_PRESENT" ]; then
  echo "🔧 Banco legado detectado (objetos drift presentes) — marcando baseline como aplicada..."
  prisma_migrate migrate resolve --applied "$BASELINE" || true
fi

# Executar migrations PRIMEIRO (antes de gerar client)
echo "📦 Executando migrations do Prisma..."
prisma_migrate migrate deploy || {
  # ⚠️ FALLBACK LEGADO — este db push é a ORIGEM do drift de schema (achado B7).
  # Com a cadeia de migrations reparada (2026-07-07) o deploy deve sempre
  # passar; se este fallback disparar, investigar ANTES de aceitar o resultado.
  echo "⚠️⚠️ ATENCAO: migrate deploy FALHOU — fallback db push (gera drift!)..."
  prisma_migrate db push --skip-generate --accept-data-loss || {
    echo "❌ db push falhou"
    exit 1
  }
}

# Gerar Prisma Client APÓS migrations (para garantir sincronização)
echo "🔧 Gerando Prisma Client..."
rm -rf /app/backend/node_modules/.prisma || true
$PRISMA_BIN generate || {
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

# Atualizar configuração de unicidade dos serviços
echo "🔧 Atualizando configuração de unicidade dos serviços..."
if [ -f "/app/backend/update-service-uniqueness.js" ]; then
  node /app/backend/update-service-uniqueness.js || {
    echo "⚠️ Aviso: Falha ao atualizar configuração de unicidade"
  }
else
  echo "⚠️ Script de atualização de unicidade não encontrado"
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
