#!/bin/bash

# ============================================================================
# Script de Deploy Manual para DigiUrban VPS
# ============================================================================
# Este script replica EXATAMENTE o comportamento do GitHub Actions workflow
# Uso: ./deploy-vps.sh
# ============================================================================

set -e

echo "=========================================="
echo "🚀 Deploy DigiUrban VPS (Manual)"
echo "=========================================="
echo ""
echo "⚠️  Este script replica o deploy automático do GitHub Actions"
echo "📝 Todas as etapas de validação e limpeza serão executadas"
echo ""

# ============================================================================
# PRÉ-VALIDAÇÃO LOCAL
# ============================================================================

echo "🔍 Executando validação pré-deploy..."
if [ -f "scripts/pre-deploy-check.sh" ]; then
  chmod +x scripts/pre-deploy-check.sh
  if ! ./scripts/pre-deploy-check.sh; then
    echo ""
    echo "❌ Validação pré-deploy falhou!"
    echo "Corrija os erros antes de executar o deploy."
    exit 1
  fi
  echo ""
  echo "✅ Validação pré-deploy concluída"
  echo ""
else
  echo "⚠️  Script de validação não encontrado, continuando sem validação local..."
  echo ""
fi

# Configurações
VPS_HOST="digiurban.com.br"
VPS_USER="root"
VPS_DIR="/root/digiurban"

echo "📡 Conectando em ${VPS_USER}@${VPS_HOST}..."
echo ""

# Executar deploy completo no servidor via SSH
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e

echo "=== Iniciando Deploy DigiUrban ==="
echo ""

# Diretório da aplicação
APP_DIR="/root/digiurban"

# ============================================================================
# ETAPA 0: PREPARAÇÃO DO AMBIENTE GIT (COM FETCH FORÇADO)
# ============================================================================

echo "🔍 Preparando ambiente Git..."
cd $APP_DIR

# ⚡ PRIMEIRO: Sempre fazer fetch completo do origin
echo "🌐 Fazendo fetch completo do origin/main..."
git fetch origin main --prune --force || {
  echo "⚠️  Fetch falhou, tentando novamente..."
  git fetch origin --all --prune --force
}

# Verificar se estamos no branch correto
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Branch atual: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "⚠️  Não estamos no branch main, mudando..."
  git checkout main || {
    echo "❌ Falha ao mudar para main, forçando..."
    git checkout -B main origin/main
  }
fi

# Mostrar diferença entre local e origin ANTES de sincronizar
echo ""
echo "📊 Status ANTES da sincronização:"
echo "Commit local:  $(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
echo "Commit origin: $(git rev-parse origin/main 2>/dev/null || echo 'unknown')"
BEHIND_COMMITS=$(git rev-list HEAD..origin/main --count 2>/dev/null || echo "0")
AHEAD_COMMITS=$(git rev-list origin/main..HEAD --count 2>/dev/null || echo "0")
echo "Commits atrás:  $BEHIND_COMMITS"
echo "Commits à frente: $AHEAD_COMMITS"

# Listar arquivos modificados e untracked
echo ""
echo "📋 Arquivos modificados localmente:"
git status --short || true
echo ""

# ============================================================================
# ETAPA 1: PARAR CONTAINERS E LIMPAR ÓRFÃOS
# ============================================================================

echo "🛑 Parando containers existentes..."
cd $APP_DIR
docker-compose -f docker-compose.vps.yml down || true

echo "🧹 Removendo containers órfãos que possam estar em conflito..."
docker stop ultrazend-smtp 2>/dev/null || true
docker rm ultrazend-smtp 2>/dev/null || true
docker stop ultrazend-messages 2>/dev/null || true
docker rm ultrazend-messages 2>/dev/null || true
docker stop digiurban-postgres 2>/dev/null || true
docker rm digiurban-postgres 2>/dev/null || true
docker stop digiurban-redis 2>/dev/null || true
docker rm digiurban-redis 2>/dev/null || true
docker stop digiurban-flow 2>/dev/null || true
docker rm digiurban-flow 2>/dev/null || true
docker stop digiurban-ai 2>/dev/null || true
docker rm digiurban-ai 2>/dev/null || true
docker stop digiurban-prices 2>/dev/null || true
docker rm digiurban-prices 2>/dev/null || true

echo "✅ Containers órfãos removidos"
echo ""

# ============================================================================
# ETAPA 2: ATUALIZAR CÓDIGO (FORÇA SINCRONIZAÇÃO TOTAL)
# ============================================================================

echo "📥 Atualizando código do repositório..."

# Fazer backup de arquivos .env e configurações críticas
echo "💾 Fazendo backup de configurações..."
cp .env .env.backup 2>/dev/null || echo "Nenhum .env para backup"

# ⚡ MÉTODO DIRETO: Sempre forçar sincronização com origin/main
echo "🔄 Fazendo fetch de todas as mudanças do origin..."
git fetch origin main --prune

echo "📊 Verificando commits antes da sincronização:"
echo "Local atual: $(git rev-parse HEAD)"
echo "Origin/main: $(git rev-parse origin/main)"

# Fazer stash de qualquer alteração local (incluindo untracked)
echo "📦 Salvando alterações locais em stash..."
git add -A 2>/dev/null || true
git stash push -u -m "Auto-stash completo antes do deploy $(date +%Y%m%d_%H%M%S)" 2>/dev/null || true

# ⚡ FORÇA SINCRONIZAÇÃO TOTAL COM ORIGIN/MAIN
echo "🔄 FORÇANDO sincronização total com origin/main..."
git reset --hard origin/main

# Limpar TODOS os arquivos não rastreados (exceto .env)
echo "🧹 Limpando arquivos não rastreados (preservando .env)..."
git clean -fdx -e .env -e .env.backup

# Restaurar .env se foi deletado
if [ ! -f ".env" ] && [ -f ".env.backup" ]; then
  echo "🔄 Restaurando arquivo .env do backup..."
  cp .env.backup .env
fi

# VERIFICAÇÃO FINAL DO COMMIT
echo ""
echo "📊 Verificação FINAL após sincronização:"
CURRENT_COMMIT=$(git rev-parse HEAD)
ORIGIN_COMMIT=$(git rev-parse origin/main)
echo "Local:  $CURRENT_COMMIT"
echo "Origin: $ORIGIN_COMMIT"

if [ "$CURRENT_COMMIT" != "$ORIGIN_COMMIT" ]; then
  echo ""
  echo "❌ ERRO CRÍTICO: Código AINDA não está sincronizado!"
  echo "Tentando uma última vez com prune completo..."

  git fetch origin --prune --force
  git reset --hard origin/main
  git clean -fdx -e .env -e .env.backup

  CURRENT_COMMIT=$(git rev-parse HEAD)
  if [ "$CURRENT_COMMIT" != "$ORIGIN_COMMIT" ]; then
    echo "❌ FALHA FATAL: Impossível sincronizar código com origin/main!"
    echo "Execute manualmente: git fetch origin && git reset --hard origin/main"
    exit 1
  fi
fi

echo "✅ Código CONFIRMADO sincronizado com origin/main"

# Mostrar últimos 5 commits para confirmar
echo "📜 Últimos 5 commits:"
git log --oneline -5

echo "📂 Verificando código sincronizado..."
ls -la

if [ ! -f "$APP_DIR/scripts/vps-deploy-lib.sh" ]; then
  echo "ERRO: scripts/vps-deploy-lib.sh nao encontrado"
  exit 1
fi

. "$APP_DIR/scripts/vps-deploy-lib.sh"
ensure_vm_max_map_count 262144

# ============================================================================
# ETAPA 3: CRIAR ARQUIVO .ENV
# ============================================================================

echo "📝 Criando arquivo .env..."
write_vps_env_file ".env" ".env.backup"

echo "✅ Arquivo .env criado"
echo ""

# ============================================================================
# ETAPA 4: REMOVER ARQUIVOS .DB SQLITE ANTIGOS
# ============================================================================

echo "🗑️  Removendo arquivos .db do código-fonte..."
find . -name "*.db" -type f ! -path "*/node_modules/*" -delete || true
find . -name "*.db-*" -type f ! -path "*/node_modules/*" -delete || true
echo "✅ Arquivos .db removidos"
echo ""

# ============================================================================
# ETAPA 5: LIMPEZA SEGURA DE RECURSOS DOCKER
# ============================================================================

echo "=== Limpando recursos antigos de forma segura ==="
echo ""

# Listar volumes ANTES da limpeza (para garantir que não serão tocados)
echo "📦 Volumes existentes (serão preservados):"
docker volume ls | grep -E "postgres_data|digiurban_uploads|messages_uploads|smtp_data|digiurban_backups" || echo "Nenhum volume encontrado ainda"
echo ""

# Limpar containers parados (seguro - não afeta volumes)
echo "🧹 Removendo containers parados..."
docker container prune -f || true

# ============================================================================
# ETAPA 6: LIMPEZA NUCLEAR DE CACHE DOCKER
# ============================================================================

echo "=== 🔥 LIMPEZA NUCLEAR DE CACHE DOCKER ==="
echo ""

# 1. Remover TODAS as imagens relacionadas ao DigiUrban (incluindo módulos flow e prices)
echo "🗑️  Removendo TODAS as imagens do DigiUrban..."
docker images | grep -i digiurban | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
docker images | grep -i backend-builder | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
docker images | grep -i frontend-builder | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
docker images | grep -i runner | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

# Remover imagens dos módulos isolados pelo nome exato que o docker-compose gera
echo "🗑️  Removendo imagens dos módulos flow, prices e ai..."
docker rmi -f digiurban-digiurban-flow 2>/dev/null || true
docker rmi -f digiurban-digiurban-prices 2>/dev/null || true
docker rmi -f digiurban-digiurban-ai 2>/dev/null || true
docker rmi -f digiurban_digiurban-flow 2>/dev/null || true
docker rmi -f digiurban_digiurban-prices 2>/dev/null || true
docker rmi -f digiurban_digiurban-ai 2>/dev/null || true
# Remover qualquer imagem que contenha "flow", "prices" ou "ai" no nome
docker images | grep -E "flow|prices|digiurban-ai" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

# 2. Remover imagens base do Node.js (força download novo)
echo "🗑️  Removendo imagens base do Node.js..."
docker images | grep "node.*18-bookworm-slim" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
docker images | grep "node.*22-alpine" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
docker images | grep "node.*20-bookworm-slim" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

# 3. Limpar build cache do Docker
echo "🗑️  Limpando build cache do Docker..."
docker builder prune -af --filter "until=1h" || true

# 4. Remover imagens órfãs (dangling)
echo "🗑️  Removendo imagens órfãs..."
docker image prune -af || true

# 5. Verificar que volumes AINDA existem após limpeza
echo "✅ Verificando integridade dos volumes após limpeza:"
docker volume ls | grep -E "postgres_data|digiurban_uploads|messages_uploads|smtp_data|digiurban_backups" || echo "⚠️ AVISO: Alguns volumes não foram encontrados!"
echo ""

# 6. Gerar BUILD_TIMESTAMP único
export BUILD_TIMESTAMP=$(date +%s%N)
export CACHE_BUST=$(echo $RANDOM | md5sum | head -c 20)
echo "BUILD_TIMESTAMP=${BUILD_TIMESTAMP}"
echo "CACHE_BUST=${CACHE_BUST}"
echo ""

# 7. Forçar pull das imagens base usadas por todos os módulos
echo "📥 Forçando pull de imagens base..."
docker pull node:18-bookworm-slim || true
docker pull node:20-bookworm-slim || true
docker pull node:22-alpine || true
echo ""

# ============================================================================
# ETAPA 7: VALIDAÇÃO PRÉ-BUILD - COMMIT E ARQUIVOS CRÍTICOS
# ============================================================================

echo "=== Validando commit e arquivos críticos antes do build ==="
echo ""

# ⚡ VALIDAÇÃO CRÍTICA: Verificar que estamos no commit certo
echo "🔍 Verificação FINAL de sincronização do código:"
CURRENT_COMMIT=$(git rev-parse HEAD)
ORIGIN_COMMIT=$(git rev-parse origin/main)
echo "Commit local:  $CURRENT_COMMIT"
echo "Commit origin: $ORIGIN_COMMIT"

if [ "$CURRENT_COMMIT" != "$ORIGIN_COMMIT" ]; then
  echo ""
  echo "❌ ERRO CRÍTICO: Código NÃO SINCRONIZADO!"
  echo "Não podemos continuar com o build usando código desatualizado!"
  echo ""
  echo "Execute manualmente:"
  echo "  git fetch origin main"
  echo "  git reset --hard origin/main"
  exit 1
fi
echo "✅ Código CONFIRMADO no commit correto"
echo ""

# Mostrar últimos commits para confirmar visualmente
echo "📜 Últimos 5 commits (confirmar que são os mais recentes):"
git log --oneline -5
echo ""

# Verificar hash dos arquivos críticos para garantir que foram atualizados
echo "🔍 Verificando arquivos críticos..."

# Dockerfile (não deve ter comandos de debug)
if grep -q "ls -la src/" digiurban/Dockerfile; then
  echo "⚠️  AVISO: Dockerfile ainda tem comandos de debug"
else
  echo "✓ Dockerfile sem comandos de debug"
fi

# Admin-citizens.ts (deve ter a correção headId)
if grep -q "headId: id" digiurban/backend/src/routes/admin-citizens.ts; then
  echo "✓ admin-citizens.ts tem correção headId"
else
  echo "❌ ERRO: admin-citizens.ts pode estar desatualizado (não encontrou headId)"
  exit 1
fi

# Página de família do cidadão (deve ter optional chaining)
if grep -q "familyData?.head?.birthDate" digiurban/frontend/app/cidadao/familia/page.tsx 2>/dev/null; then
  echo "✓ cidadao/familia/page.tsx tem optional chaining"
else
  echo "❌ ERRO: cidadao/familia/page.tsx pode estar desatualizado"
  exit 1
fi

# FamilyTree component (deve ter optional chaining)
if grep -q "familyMember?.member?.name" digiurban/frontend/components/citizen/FamilyTree.tsx 2>/dev/null; then
  echo "✓ FamilyTree.tsx tem optional chaining"
else
  echo "❌ ERRO: FamilyTree.tsx pode estar desatualizado"
  exit 1
fi

# AddFamilyMemberDialog (deve ter debounce)
if grep -q "debouncedSearch" digiurban/frontend/components/citizen/AddFamilyMemberDialog.tsx 2>/dev/null; then
  echo "✓ AddFamilyMemberDialog.tsx tem debounce implementado"
else
  echo "❌ ERRO: AddFamilyMemberDialog.tsx pode estar desatualizado"
  exit 1
fi

# Validar estrutura de arquivos backend
if [ ! -f "digiurban/backend/src/routes/citizen-services.ts" ]; then
  echo "❌ ERRO: citizen-services.ts não encontrado!"
  exit 1
fi
echo "✓ citizen-services.ts encontrado"

if [ ! -f "digiurban/backend/src/index.ts" ]; then
  echo "❌ ERRO: index.ts não encontrado!"
  exit 1
fi
echo "✓ index.ts encontrado"

# Verificar se o index.ts registra a rota citizen-services
if ! grep -q "citizen-services" digiurban/backend/src/index.ts; then
  echo "❌ ERRO: index.ts não registra a rota citizen-services!"
  exit 1
fi
echo "✓ Rota citizen-services registrada no index.ts"

# Validar tsconfig.docker.json
if [ ! -f "digiurban/backend/tsconfig.docker.json" ]; then
  echo "❌ ERRO: tsconfig.docker.json não encontrado!"
  exit 1
fi
echo "✓ tsconfig.docker.json encontrado"

# Verificar conteúdo do tsconfig.docker.json
echo "📋 Conteúdo do tsconfig.docker.json:"
cat digiurban/backend/tsconfig.docker.json
echo ""

# Validar estrutura shared
if [ ! -d "digiurban/shared" ]; then
  echo "❌ ERRO: Diretório shared não encontrado!"
  exit 1
fi
echo "✓ Diretório shared encontrado"

echo "📁 Estrutura do diretório shared:"
ls -la digiurban/shared/
echo ""

# Validar arquivos shared críticos
if [ ! -f "digiurban/shared/types/family.types.ts" ]; then
  echo "❌ ERRO: family.types.ts não encontrado!"
  exit 1
fi
echo "✓ family.types.ts encontrado"

echo "=== ✅ Todos os arquivos críticos validados ==="
echo ""

# ============================================================================
# ETAPA 8: VALIDAÇÃO DO DOCKERFILE
# ============================================================================

echo "=== 📋 VALIDAÇÃO DO DOCKERFILE ==="
echo ""

# Gerar hash do Dockerfile para garantir que estamos usando a versão correta
DOCKERFILE_HASH=$(md5sum digiurban/Dockerfile | awk '{print $1}')
echo "Hash do Dockerfile: ${DOCKERFILE_HASH}"

echo "Verificando linhas críticas do Dockerfile:"
echo "--- Linha 37 (COPY shared):"
sed -n '37p' digiurban/Dockerfile
echo "--- Linha 50 (DATABASE_URL):"
sed -n '50p' digiurban/Dockerfile
echo "--- Linha 52 (Build command):"
sed -n '52p' digiurban/Dockerfile
echo ""

# Verificar se linha 52 contém o comando correto
if grep -q "npx tsc -p tsconfig.docker.json" digiurban/Dockerfile; then
  echo "✅ Dockerfile contém comando correto (npx tsc -p tsconfig.docker.json)"
else
  echo "❌ ERRO: Dockerfile NÃO contém comando correto!"
  echo "Conteúdo da linha 52:"
  sed -n '52p' digiurban/Dockerfile
  exit 1
fi
echo ""

# ============================================================================
# ETAPA 9: BUILD SEM CACHE COM MÚLTIPLAS GARANTIAS
# ============================================================================

echo "=== 🔨 CONSTRUINDO IMAGEM (BUILD COMPLETO SEM CACHE) ==="
echo ""

# Build com argumentos de cache busting
docker-compose -f docker-compose.vps.yml build \
  --no-cache \
  --pull \
  --progress=plain \
  --build-arg BUILD_TIMESTAMP=${BUILD_TIMESTAMP} \
  --build-arg CACHE_BUST=${CACHE_BUST} \
  --build-arg BUILDKIT_INLINE_CACHE=0

echo "✅ Build concluído"
echo ""

# ============================================================================
# ETAPA 10: INICIAR CONTAINERS
# ============================================================================

# Parar containers existentes antes de iniciar
echo "🛑 Parando containers existentes..."
docker-compose -f docker-compose.vps.yml down || true

# Iniciar containers
echo "🚀 Iniciando containers..."
echo "Iniciando infraestrutura base..."
docker-compose -f docker-compose.vps.yml up -d \
  postgres \
  redis \
  ultrazend-smtp \
  llamacpp \
  ultrazend-messages \
  digiurban-flow \
  digiurban-ai \
  digiurban-opensearch

wait_for_container_health digiurban-postgres 30 5
wait_for_container_health digiurban-redis 30 5
wait_for_container_health ultrazend-smtp 30 5
wait_for_container_health digiurban-llamacpp 60 10
wait_for_http_ready http://127.0.0.1:8080/health 60 10
wait_for_container_health ultrazend-messages 30 5
wait_for_container_health digiurban-flow 30 5
wait_for_container_health digiurban-ai 30 5
wait_for_container_health digiurban-opensearch 36 10

echo "Iniciando modulo de precos..."
docker-compose -f docker-compose.vps.yml up -d digiurban-prices
wait_for_container_health digiurban-prices 36 10

echo "Iniciando aplicacao principal..."
docker-compose -f docker-compose.vps.yml up -d digiurban
wait_for_container_health digiurban-vps 36 10

# Aguardar PostgreSQL e aplicação iniciarem
echo "⏳ Aguardando containers iniciarem (30s)..."

echo "✅ Containers iniciados"
echo ""

# ============================================================================
# ETAPA 11: EXECUTAR SEEDS DOS MICRO SISTEMAS
# ============================================================================

echo "=== Executando seeds dos Micro Sistemas ==="
docker exec digiurban-vps sh -c "cd /app/backend && npm run db:seed:deploy-safe" || echo "⚠️ Seed seguro falhou mas continuando deploy"
echo "✅ Seeds executados"
echo ""

# ============================================================================
# ETAPA 12: EXECUTAR SEED DOS FLUXOS DO BOT
# ============================================================================

echo "=== Populando fluxos do sistema de bot ==="
docker exec digiurban-vps node /app/backend/dist/scripts/seed-flows.js || echo "⚠️ Seed de fluxos falhou mas continuando deploy"
echo "✅ Fluxos do bot populados"
echo ""

# ============================================================================
# ETAPA 13: VALIDAR LLAMA.CPP (QWEN3 1.7B)
# ============================================================================

echo "=== Validando llama.cpp com Qwen3 1.7B ==="
docker logs digiurban-llamacpp --tail=80 || true
curl -fsS http://127.0.0.1:8080/health >/dev/null || curl -fsS http://127.0.0.1:8080/v1/models >/dev/null

echo "Reiniciando backend para aplicar configuracoes de IA..."
docker-compose -f docker-compose.vps.yml restart digiurban

echo "llama.cpp configurado com sucesso!"
echo ""

# ============================================================================
# ETAPA 14: VERIFICAR MIGRATIONS DO ULTRAZEND MESSAGES
# ============================================================================

echo "=== Verificando migrations do UltraZend Messages ==="
docker logs ultrazend-messages 2>&1 | grep -i "prisma" || echo "Logs do Prisma migrations"

# Verificar se as tabelas foram criadas
echo "=== Verificando tabelas do UltraZend Messages no banco ==="
docker exec digiurban-postgres psql -U digiurban -d digiurban -c "\dt message_*" || echo "⚠️ Tabelas ainda não criadas"
echo ""

# ============================================================================
# ETAPA 14b: VERIFICAR MIGRATIONS DO DIGIURBAN-FLOW, DIGIURBAN-PRICES E DIGIURBAN-AI
# ============================================================================

echo "=== Verificando migrations do digiurban-flow ==="
docker logs digiurban-flow --tail=40 2>&1 | grep -E "migration|error|Error|table|Starting" || true
echo ""

# Verificar se tabelas do flow foram criadas
echo "=== Tabelas flow_* no banco ==="
docker exec digiurban-postgres psql -U digiurban -d digiurban \
  -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'flow_%' ORDER BY tablename;" \
  || echo "⚠️ Não foi possível verificar tabelas flow"
echo ""

echo "=== Verificando migrations do digiurban-prices ==="
docker logs digiurban-prices --tail=40 2>&1 | grep -E "migration|error|Error|table|Starting" || true
echo ""

# Verificar se tabelas do prices foram criadas
echo "=== Tabelas prices_* no banco ==="
docker exec digiurban-postgres psql -U digiurban -d digiurban \
  -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'prices_%' ORDER BY tablename;" \
  || echo "⚠️ Não foi possível verificar tabelas prices"
echo ""

echo "=== Verificando migrations do digiurban-ai ==="
docker logs digiurban-ai --tail=40 2>&1 | grep -E "migration|error|Error|table|Starting" || true
echo ""

echo "=== Tabelas ai_* no banco ==="
docker exec digiurban-postgres psql -U digiurban -d digiurban \
  -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'ai_%' ORDER BY tablename;" \
  || echo "⚠️ Não foi possível verificar tabelas ai"
echo ""

# ============================================================================
# ETAPA 15: DIAGNÓSTICO DO BACKEND (SUPERVISORD)
# ============================================================================

echo "=== Verificando status do backend no supervisord ==="
docker exec digiurban-vps supervisorctl status || true
echo ""

echo "=== Logs completos do backend (stdout + stderr) ==="
docker exec digiurban-vps cat /var/log/backend.stdout.log || echo "Nenhum log stdout"
docker exec digiurban-vps cat /var/log/backend.stderr.log || echo "Nenhum log stderr"
echo ""

# ============================================================================
# ETAPA 16: VERIFICAR STATUS DOS CONTAINERS
# ============================================================================

echo "📊 Verificando status dos containers..."
docker-compose -f docker-compose.vps.yml ps
echo ""

# Verificar logs do PostgreSQL
echo "=== Logs do PostgreSQL ==="
docker logs digiurban-postgres --tail=20
echo ""

# Verificar logs da aplicação
echo "=== Logs da Aplicação ==="
docker logs digiurban-vps --tail=100
echo ""

# Verificar se container está rodando
if ! docker ps | grep -q digiurban-vps; then
  echo "❌ Container digiurban-vps não está rodando!"
  echo "=== Logs completos do container ==="
  docker logs digiurban-vps
  exit 1
fi

echo "✅ Container digiurban-vps está rodando"
echo ""

# ============================================================================
# ETAPA 17: VALIDAÇÃO PÓS-BUILD - ROTAS CRÍTICAS
# ============================================================================

echo "=== Validando rotas críticas no container ==="
echo ""

# Verificar se os arquivos compilados existem
if ! docker exec digiurban-vps test -f /app/backend/dist/routes/citizen-services.js; then
  echo "❌ ERRO: citizen-services.js não foi compilado no container!"
  echo "=== Listando arquivos em dist/routes ==="
  docker exec digiurban-vps ls -la /app/backend/dist/routes/ || true
  exit 1
fi
echo "✓ citizen-services.js compilado no container"

if ! docker exec digiurban-vps test -f /app/backend/dist/routes/prices-proxy.routes.js; then
  echo "❌ ERRO: prices-proxy.routes.js não foi compilado no container!"
  echo "=== Listando arquivos em dist/routes ==="
  docker exec digiurban-vps ls -la /app/backend/dist/routes/ || true
  exit 1
fi
echo "✓ prices-proxy.routes.js compilado no container"

# Verificar se o index.js registra as rotas críticas
if ! docker exec digiurban-vps grep -q "citizen-services" /app/backend/dist/index.js; then
  echo "❌ ERRO: Rota citizen-services não registrada no index.js compilado!"
  exit 1
fi
echo "✓ Rota citizen-services registrada no index.js compilado"

if ! docker exec digiurban-vps grep -q "prices-proxy" /app/backend/dist/index.js; then
  echo "❌ ERRO: Rota prices-proxy não registrada no index.js compilado!"
  exit 1
fi
echo "✓ Rota prices-proxy registrada no index.js compilado"

# Verificar se a rota /coverage está no prices-proxy compilado
if ! docker exec digiurban-vps grep -q "coverage" /app/backend/dist/routes/prices-proxy.routes.js; then
  echo "❌ ERRO: Rota /coverage não encontrada em prices-proxy.routes.js compilado!"
  exit 1
fi
echo "✓ Rota /coverage presente em prices-proxy.routes.js compilado"

# Aguardar backend inicializar e buscar logs de carregamento de rotas
echo "=== Aguardando backend carregar rotas (10s) ==="
sleep 10

echo "=== Logs de carregamento de rotas do backend ==="
docker logs digiurban-vps 2>&1 | grep -A 2 -B 2 "citizen-services" || echo "⚠️ Nenhum log de citizen-services encontrado"
echo ""

echo "=== Verificando se houve erro no carregamento ==="
if docker logs digiurban-vps 2>&1 | grep -q "❌ citizen-services"; then
  echo "❌ ERRO: citizen-services falhou ao carregar!"
  echo "=== Logs completos ==="
  docker logs digiurban-vps --tail=100
  exit 1
fi
echo "✓ Nenhum erro no carregamento de citizen-services"
echo ""

# ============================================================================
# ETAPA 18: HEALTH CHECK ROBUSTO
# ============================================================================

echo "🏥 Verificando health check..."
for i in {1..15}; do
  if curl -f http://localhost:3060/health 2>/dev/null; then
    echo "✅ DigiUrban está rodando na porta 3060!"
    echo ""

    # Validar rota citizen-services está acessível
    echo "=== Validando rota /api/citizen/services ==="
    if curl -f http://localhost:3060/api/citizen/services 2>/dev/null; then
      echo "✅ Rota /api/citizen/services está acessível!"
      echo ""
      echo "=========================================="
      echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
      echo "=========================================="
      echo ""
      echo "🌐 DigiUrban disponível em:"
      echo "   • https://www.digiurban.com.br"
      echo "   • http://72.60.10.108:3060"
      echo ""
      echo "📊 Health check: http://72.60.10.108:3060/health"
      echo ""
      exit 0
    else
      echo "❌ Rota /api/citizen/services retornou erro!"
      echo "=== Logs do backend ==="
      docker logs digiurban-vps --tail=50
      exit 1
    fi
  fi

  echo "Tentativa $i/15 falhou, aguardando 10s..."

  # Mostrar logs a cada 3 tentativas
  if [ $((i % 3)) -eq 0 ]; then
    echo "=== Logs recentes ==="
    docker logs digiurban-vps --tail=30
  fi

  sleep 10
done

echo "⚠️ Health check falhou após 15 tentativas"
echo "Logs completos:"
docker-compose -f docker-compose.vps.yml logs
exit 1

ENDSSH

# ============================================================================
# FINALIZAÇÃO LOCAL
# ============================================================================

echo ""
echo "=========================================="
echo "✅ Deploy finalizado!"
echo "=========================================="
echo ""
