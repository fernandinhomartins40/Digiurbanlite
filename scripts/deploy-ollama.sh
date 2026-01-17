#!/bin/bash

# Script de deploy do Ollama em produção (VPS)
# Autor: DigiBot Enhanced Team
# Data: 2025-01-17

set -e

echo "🚀 Deploy do Ollama/Phi-4 para Produção (VPS)"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# Configuração do VPS
VPS_HOST="${VPS_HOST:-root@170.233.244.96}"
VPS_DIR="/var/www/digiurban"
VPS_USER="root"

# Verificar se SSH está configurado
info "Verificando conexão SSH com VPS..."
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$VPS_HOST" echo "ok" > /dev/null 2>&1; then
    error "Não foi possível conectar ao VPS via SSH"
    error "Configure a chave SSH antes de prosseguir"
    exit 1
fi
success "Conexão SSH estabelecida"

# Função para executar comando no VPS
ssh_exec() {
    ssh "$VPS_HOST" "$@"
}

# 1. Verificar requisitos no VPS
info "Verificando requisitos no VPS..."

if ! ssh_exec "command -v docker" > /dev/null 2>&1; then
    error "Docker não está instalado no VPS"
    info "Instalando Docker..."
    ssh_exec "curl -fsSL https://get.docker.com | sh"
    ssh_exec "systemctl start docker"
    ssh_exec "systemctl enable docker"
    success "Docker instalado"
fi

if ! ssh_exec "command -v docker-compose" > /dev/null 2>&1; then
    error "Docker Compose não está instalado no VPS"
    info "Instalando Docker Compose..."
    ssh_exec "curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    ssh_exec "chmod +x /usr/local/bin/docker-compose"
    success "Docker Compose instalado"
fi

# 2. Criar diretório no VPS se não existir
info "Preparando diretório no VPS..."
ssh_exec "mkdir -p $VPS_DIR"

# 3. Copiar arquivos necessários
info "Copiando arquivos para VPS..."

# Modelfile
scp "$(dirname "$0")/../Modelfile" "$VPS_HOST:$VPS_DIR/"
success "Modelfile copiado"

# Docker compose (apenas serviço Ollama)
cat > /tmp/docker-compose.ollama.yml <<'EOF'
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: digiurban-ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0:11434
    deploy:
      resources:
        limits:
          memory: 12G
        reservations:
          memory: 8G

volumes:
  ollama_data:
    driver: local
EOF

scp /tmp/docker-compose.ollama.yml "$VPS_HOST:$VPS_DIR/docker-compose.ollama.yml"
rm /tmp/docker-compose.ollama.yml
success "Docker Compose copiado"

# Script de setup
scp "$(dirname "$0")/setup-ollama.sh" "$VPS_HOST:$VPS_DIR/"
ssh_exec "chmod +x $VPS_DIR/setup-ollama.sh"
success "Script de setup copiado"

# 4. Verificar recursos do servidor
info "Verificando recursos do servidor..."
mem_total=$(ssh_exec "free -g | awk '/^Mem:/{print \$2}'")
info "Memória total: ${mem_total}GB"

if [ "$mem_total" -lt 12 ]; then
    warning "Memória RAM insuficiente para Phi-4 (recomendado: 12GB+)"
    warning "O modelo pode não funcionar corretamente"

    echo ""
    info "Deseja continuar mesmo assim? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        error "Deploy cancelado pelo usuário"
        exit 1
    fi

    warning "Usando modelo menor: SmolLM3 (3B) em vez de Phi-4 (14B)"
    OLLAMA_MODEL="smollm3"
else
    OLLAMA_MODEL="phi4"
fi

# 5. Iniciar container Ollama no VPS
info "Iniciando container Ollama no VPS..."
ssh_exec "cd $VPS_DIR && docker-compose -f docker-compose.ollama.yml up -d"
success "Container Ollama iniciado"

# 6. Aguardar Ollama ficar disponível
info "Aguardando Ollama ficar disponível..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if ssh_exec "curl -s http://localhost:11434/api/tags" > /dev/null 2>&1; then
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

# 7. Baixar modelo
info "Baixando modelo $OLLAMA_MODEL no VPS..."
info "Isso pode levar alguns minutos..."
ssh_exec "docker exec digiurban-ollama ollama pull $OLLAMA_MODEL"
success "Modelo $OLLAMA_MODEL baixado"

# 8. Criar modelo customizado
info "Criando modelo customizado DigiBot..."

if [ "$OLLAMA_MODEL" = "smollm3" ]; then
    # Ajustar Modelfile para SmolLM3
    ssh_exec "sed -i 's/FROM phi4/FROM smollm3/' $VPS_DIR/Modelfile"
fi

ssh_exec "docker exec digiurban-ollama ollama create digibot-$OLLAMA_MODEL -f /tmp/Modelfile" || {
    warning "Tentando via stdin..."
    ssh_exec "cat $VPS_DIR/Modelfile | docker exec -i digiurban-ollama ollama create digibot-$OLLAMA_MODEL -f -"
}
success "Modelo DigiBot criado"

# 9. Testar modelo
info "Testando modelo DigiBot no VPS..."
test_response=$(ssh_exec "docker exec digiurban-ollama ollama run digibot-$OLLAMA_MODEL 'Olá, preciso agendar uma consulta'" 2>/dev/null | head -n 10)

if echo "$test_response" | grep -q "intent"; then
    success "Modelo está respondendo corretamente!"
else
    warning "Modelo pode precisar de ajustes"
fi

# 10. Configurar firewall (se ufw estiver instalado)
if ssh_exec "command -v ufw" > /dev/null 2>&1; then
    info "Configurando firewall..."
    ssh_exec "ufw allow 11434/tcp" || true
    success "Porta 11434 liberada no firewall"
fi

# 11. Atualizar .env do backend no VPS
info "Atualizando variáveis de ambiente do backend..."

ssh_exec "cat >> $VPS_DIR/.env <<EOF

# Ollama Configuration (adicionado automaticamente em $(date))
USE_OLLAMA=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=digibot-$OLLAMA_MODEL
OLLAMA_TIMEOUT=5000
EOF"

success "Variáveis de ambiente atualizadas"

# 12. Reiniciar backend (se estiver rodando)
if ssh_exec "docker ps | grep -q digiurban-backend"; then
    info "Reiniciando backend para aplicar mudanças..."
    ssh_exec "cd $VPS_DIR && docker-compose restart backend"
    success "Backend reiniciado"
fi

# 13. Verificar status final
echo ""
info "Verificando status final..."
ssh_exec "docker ps | grep ollama"
echo ""

# 14. Informações finais
echo "=============================================="
success "Deploy concluído com sucesso!"
echo ""
info "Ollama instalado e configurado no VPS:"
echo "  - URL: http://170.233.244.96:11434"
echo "  - Modelo: digibot-$OLLAMA_MODEL"
echo "  - Container: digiurban-ollama"
echo ""
info "Para testar remotamente:"
echo "  curl http://170.233.244.96:11434/api/tags"
echo ""
info "Para acessar logs:"
echo "  ssh $VPS_HOST 'docker logs -f digiurban-ollama'"
echo ""
info "Para testar modelo interativamente:"
echo "  ssh $VPS_HOST 'docker exec -it digiurban-ollama ollama run digibot-$OLLAMA_MODEL'"
echo ""
success "DigiBot Enhanced com Phi-4 está rodando em produção! 🎉"
