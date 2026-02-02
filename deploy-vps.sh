#!/bin/bash

# Script de Deploy Manual para DigiUrban VPS
# Uso: ./deploy-vps.sh

set -e

echo "=================================="
echo "🚀 Deploy DigiUrban VPS"
echo "=================================="
echo ""

# Configurações
VPS_HOST="digiurban.com.br"
VPS_USER="root"
VPS_DIR="/root/digiurban"

echo "📡 Conectando em ${VPS_USER}@${VPS_HOST}..."
echo ""

# Executar deploy no servidor via SSH
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e

echo "📂 Navegando para diretório do projeto..."
cd /root/digiurban

echo "📥 Atualizando código (git pull)..."
git pull origin main

echo "🛑 Parando containers..."
docker-compose -f docker-compose.vps.yml down

echo "🔨 Reconstruindo imagens (pode demorar alguns minutos)..."
docker-compose -f docker-compose.vps.yml build --no-cache --pull

echo "🚀 Iniciando containers..."
docker-compose -f docker-compose.vps.yml up -d

echo "⏳ Aguardando containers iniciarem (30s)..."
sleep 30

# ===== EXECUTAR SEEDS DOS MICRO SISTEMAS =====
echo "=== Executando seeds dos Micro Sistemas ==="
docker exec digiurban-vps sh -c "cd /app/backend && npm run db:seed" || echo "⚠️ Seed falhou mas continuando deploy"
echo "✅ Seeds executados"

# ===== EXECUTAR SEED DOS FLUXOS DO BOT =====
echo "=== Populando fluxos do sistema de bot ==="
docker exec digiurban-vps node /app/backend/dist/scripts/seed-flows.js || echo "⚠️ Seed de fluxos falhou mas continuando deploy"
echo "✅ Fluxos do bot populados"

# ===== CONFIGURAR OLLAMA (QWEN2.5-3B) =====
echo "=== Configurando Ollama com Qwen2.5-3B ==="

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
  docker exec digiurban-ollama ollama pull qwen2.5:3b || echo "⚠️ Falha ao baixar Qwen2.5:3b"

  # Fallback para SmolLM2:1.7b se Qwen2.5 falhar
  if ! docker exec digiurban-ollama ollama list | grep -q "qwen2.5:3b"; then
    echo "📥 Baixando modelo SmolLM2:1.7b (1.7B - ~1.5GB)..."
    docker exec digiurban-ollama ollama pull smollm2:1.7b
    MODEL_NAME="smollm2"
  else
    MODEL_NAME="qwen2.5"
  fi
fi

# Copiar Modelfile para container e criar modelo customizado
echo "🤖 Criando modelo customizado DigiBot..."
docker cp Modelfile digiurban-ollama:/tmp/Modelfile 2>/dev/null || echo "⚠️ Modelfile não encontrado"

# Criar ou atualizar modelo
MODEL_NAME="${MODEL_NAME:-qwen2.5}"
docker exec digiurban-ollama ollama create digibot-${MODEL_NAME} -f /tmp/Modelfile 2>/dev/null || echo "⚠️ Usando modelo base"

# Testar modelo
echo "🧪 Testando modelo DigiBot..."
docker exec digiurban-ollama ollama run digibot-${MODEL_NAME} "Olá" 2>/dev/null | head -5 || echo "⚠️ Teste falhou"

# Reiniciar backend para aplicar configurações Ollama
echo "🔄 Reiniciando backend..."
docker-compose -f docker-compose.vps.yml restart digiurban

echo "✅ Ollama configurado!"

# ===== VERIFICAR STATUS FINAL =====
echo "✅ Verificando status dos containers..."
docker-compose -f docker-compose.vps.yml ps

echo ""
echo "🎉 Deploy concluído com sucesso!"
echo "🌐 Aplicação disponível em: https://www.digiurban.com.br"
echo ""

ENDSSH

echo ""
echo "=================================="
echo "✅ Deploy finalizado!"
echo "=================================="
