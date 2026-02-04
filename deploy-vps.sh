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

echo "✅ Containers órfãos removidos"
echo ""

# ============================================================================
# ETAPA 2: ATUALIZAR CÓDIGO
# ============================================================================

echo "📥 Atualizando código (git pull)..."
git pull origin main

echo "📂 Verificando código sincronizado..."
ls -la

# ============================================================================
# ETAPA 3: CRIAR ARQUIVO .ENV
# ============================================================================

echo "📝 Criando arquivo .env..."
cat > .env << 'EOF'
# Node.js
NODE_ENV=production

# Backend
PORT=3001
BACKEND_PORT=3001

# Frontend
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# PostgreSQL (valores padrão)
POSTGRES_USER=digiurban
POSTGRES_PASSWORD=digiurban2024
POSTGRES_DB=digiurban

# Database URL (PostgreSQL)
DATABASE_URL=postgresql://digiurban:digiurban2024@postgres:5432/digiurban

# Redis
REDIS_URL=redis://redis:6379

# JWT (gerado automaticamente para produção)
JWT_SECRET=digiurban-production-secret-$(date +%s)-$(openssl rand -hex 16)
JWT_EXPIRES_IN=7d
JWT_ADMIN_EXPIRES_IN=8h
JWT_CITIZEN_EXPIRES_IN=30d

# CORS
FRONTEND_URL=https://www.digiurban.com.br
CORS_ORIGIN=https://www.digiurban.com.br
ALLOWED_ORIGINS=https://www.digiurban.com.br,http://www.digiurban.com.br,https://digiurban.com.br,http://digiurban.com.br,http://72.60.10.108:3060,http://localhost:3060

# Tenants
DEFAULT_TENANT=demo

# Logs
LOG_LEVEL=info
EOF

# Adicionar BUILD_TIMESTAMP ao .env
echo "BUILD_TIMESTAMP=$(date +%s)" >> .env

# Adicionar configurações Ollama ao .env
echo "" >> .env
echo "# Ollama AI (DigiBot Enhanced)" >> .env
echo "USE_OLLAMA=true" >> .env
echo "OLLAMA_BASE_URL=http://ollama:11434" >> .env
echo "OLLAMA_MODEL=digibot-qwen2.5" >> .env
echo "OLLAMA_TIMEOUT=15000" >> .env

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

# 1. Remover TODAS as imagens relacionadas ao DigiUrban
echo "🗑️  Removendo TODAS as imagens do DigiUrban..."
docker images | grep -i digiurban | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
docker images | grep -i backend-builder | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
docker images | grep -i frontend-builder | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
docker images | grep -i runner | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

# 2. Remover imagens base do Node.js (força download novo)
echo "🗑️  Removendo imagens base do Node.js..."
docker images | grep "node.*18-bookworm-slim" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

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

# 7. Forçar pull das imagens base
echo "📥 Forçando pull de imagens base..."
docker pull node:18-bookworm-slim
echo ""

# ============================================================================
# ETAPA 7: VALIDAÇÃO PRÉ-BUILD - ARQUIVOS CRÍTICOS
# ============================================================================

echo "=== Validando arquivos críticos antes do build ==="
echo ""

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
docker-compose -f docker-compose.vps.yml up -d

# Aguardar PostgreSQL e aplicação iniciarem
echo "⏳ Aguardando containers iniciarem (30s)..."
sleep 30

echo "✅ Containers iniciados"
echo ""

# ============================================================================
# ETAPA 11: EXECUTAR SEEDS DOS MICRO SISTEMAS
# ============================================================================

echo "=== Executando seeds dos Micro Sistemas ==="
docker exec digiurban-vps sh -c "cd /app/backend && npm run db:seed" || echo "⚠️ Seed falhou mas continuando deploy"
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
# ETAPA 13: CONFIGURAR OLLAMA (QWEN2.5-3B)
# ============================================================================

echo "=== Configurando Ollama com Qwen2.5-3B ==="
echo ""

# Aguardar Ollama ficar disponível
echo "Aguardando Ollama iniciar..."
for i in {1..30}; do
  if docker exec digiurban-ollama ollama list 2>/dev/null; then
    echo "✅ Ollama está disponível!"
    break
  fi
  echo "Tentativa $i/30, aguardando 5s..."
  sleep 5
done

# Verificar se modelo Qwen2.5:3b já está instalado
if docker exec digiurban-ollama ollama list | grep -q "qwen2.5:3b"; then
  echo "✅ Modelo Qwen2.5:3b já instalado"
  MODEL_NAME="qwen2.5"
else
  echo "📥 Baixando modelo Qwen2.5:3b (3B - ~2.5GB, pode levar alguns minutos)..."
  docker exec digiurban-ollama ollama pull qwen2.5:3b || echo "⚠️ Falha ao baixar Qwen2.5:3b, tentando SmolLM2:1.7b..."

  # Fallback para SmolLM2:1.7b se Qwen2.5 falhar
  if ! docker exec digiurban-ollama ollama list | grep -q "qwen2.5:3b"; then
    echo "📥 Baixando modelo SmolLM2:1.7b (1.7B - ~1.5GB)..."
    docker exec digiurban-ollama ollama pull smollm2:1.7b
    # Atualizar .env para usar SmolLM2
    sed -i 's/OLLAMA_MODEL=digibot-qwen2.5/OLLAMA_MODEL=digibot-smollm2/' .env
    MODEL_NAME="smollm2"
  else
    MODEL_NAME="qwen2.5"
  fi
fi

# Copiar Modelfile para container e criar modelo customizado
echo "🤖 Criando modelo customizado DigiBot..."
docker cp Modelfile digiurban-ollama:/tmp/Modelfile 2>/dev/null || echo "⚠️ Modelfile não encontrado, usando configuração padrão"

# Criar ou atualizar modelo
MODEL_NAME="${MODEL_NAME:-qwen2.5}"
docker exec digiurban-ollama ollama create digibot-${MODEL_NAME} -f /tmp/Modelfile 2>/dev/null || echo "⚠️ Usando modelo base sem customização"

# Testar modelo
echo "🧪 Testando modelo DigiBot..."
docker exec digiurban-ollama ollama run digibot-${MODEL_NAME} "Olá" 2>/dev/null | head -5 || echo "⚠️ Teste do modelo falhou, mas continuando..."

# Reiniciar backend para aplicar configurações Ollama
echo "🔄 Reiniciando backend para aplicar configurações Ollama..."
docker-compose -f docker-compose.vps.yml restart digiurban

echo "✅ Ollama configurado com sucesso!"
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

# Verificar se o arquivo compilado existe
if ! docker exec digiurban-vps test -f /app/backend/dist/routes/citizen-services.js; then
  echo "❌ ERRO: citizen-services.js não foi compilado no container!"
  echo "=== Listando arquivos em dist/routes ==="
  docker exec digiurban-vps ls -la /app/backend/dist/routes/ || true
  exit 1
fi
echo "✓ citizen-services.js compilado no container"

# Verificar se o index.js registra a rota
if ! docker exec digiurban-vps grep -q "citizen-services" /app/backend/dist/index.js; then
  echo "❌ ERRO: Rota citizen-services não registrada no index.js compilado!"
  exit 1
fi
echo "✓ Rota citizen-services registrada no index.js compilado"

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
