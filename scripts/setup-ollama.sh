#!/bin/bash

# Script de setup do Ollama com Phi-4 para DigiBot
# Autor: DigiBot Enhanced Team
# Data: 2025-01-17

set -e

echo "🚀 Setup do Ollama com Phi-4 para DigiBot"
echo "=========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para print colorido
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verifica se Docker está rodando
info "Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
    error "Docker não está rodando! Inicie o Docker primeiro."
    exit 1
fi
success "Docker está rodando"

# Inicia container Ollama
info "Iniciando container Ollama..."
cd "$(dirname "$0")/../digiurban"

if ! docker-compose ps | grep -q "digiurban-ollama"; then
    docker-compose up -d ollama
    success "Container Ollama iniciado"
else
    warning "Container Ollama já está rodando"
fi

# Aguarda Ollama ficar disponível
info "Aguardando Ollama ficar disponível..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        success "Ollama está disponível!"
        break
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
    error "Ollama não ficou disponível após 60 segundos"
    exit 1
fi

# Verifica se Phi-4 já está instalado
info "Verificando modelo Phi-4..."
if docker exec digiurban-ollama ollama list | grep -q "phi4"; then
    warning "Modelo Phi-4 já está instalado"
else
    info "Baixando modelo Phi-4 (14B - ~8GB)..."
    info "Isso pode levar alguns minutos dependendo da sua conexão..."
    docker exec digiurban-ollama ollama pull phi4
    success "Modelo Phi-4 baixado com sucesso!"
fi

# Cria modelo customizado DigiBot
info "Criando modelo customizado DigiBot..."

# Copia Modelfile para container
docker cp "$(dirname "$0")/../Modelfile" digiurban-ollama:/tmp/Modelfile

# Cria modelo customizado
if docker exec digiurban-ollama ollama list | grep -q "digibot-phi4"; then
    warning "Modelo digibot-phi4 já existe. Removendo versão antiga..."
    docker exec digiurban-ollama ollama rm digibot-phi4 || true
fi

docker exec digiurban-ollama ollama create digibot-phi4 -f /tmp/Modelfile
success "Modelo DigiBot criado com sucesso!"

# Testa modelo
info "Testando modelo DigiBot..."
test_message="Olá, preciso agendar uma consulta médica"
info "Enviando mensagem de teste: '$test_message'"

response=$(docker exec digiurban-ollama ollama run digibot-phi4 "$test_message" 2>/dev/null | head -n 20)

if echo "$response" | grep -q "intent"; then
    success "Modelo está respondendo corretamente!"
    echo ""
    info "Resposta do modelo:"
    echo "$response"
else
    warning "Modelo respondeu mas pode precisar de ajustes"
    echo "$response"
fi

# Lista modelos disponíveis
echo ""
info "Modelos disponíveis no Ollama:"
docker exec digiurban-ollama ollama list

# Instruções finais
echo ""
echo "=========================================="
success "Setup concluído com sucesso!"
echo ""
info "Próximos passos:"
echo "1. Configure as variáveis de ambiente no backend (.env):"
echo "   USE_OLLAMA=true"
echo "   OLLAMA_BASE_URL=http://ollama:11434"
echo "   OLLAMA_MODEL=digibot-phi4"
echo "   OLLAMA_TIMEOUT=5000"
echo ""
echo "2. Gere dataset de treinamento (opcional):"
echo "   npm run train-phi4 generate"
echo ""
echo "3. Teste o modelo:"
echo "   npm run train-phi4 test"
echo ""
echo "4. Reinicie o backend para aplicar mudanças:"
echo "   docker-compose restart backend"
echo ""
info "Para testar manualmente o Ollama:"
echo "   docker exec -it digiurban-ollama ollama run digibot-phi4"
echo ""
success "DigiBot Enhanced com Phi-4 está pronto para uso! 🎉"
