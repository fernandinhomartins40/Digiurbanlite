#!/bin/bash
# Script para rebuildar o container na VPS após mudanças no Dockerfile

echo "🔄 Iniciando rebuild do container DigiUrban na VPS..."

# 1. Navegar para o diretório
cd /root/digiurban

# 2. Pull do código
echo "📥 Fazendo pull do código..."
git pull

# 3. Parar containers
echo "⏸️  Parando containers..."
docker compose -f docker-compose.vps.yml down

# 4. Remover imagem antiga
echo "🗑️  Removendo imagem antiga..."
docker rmi digiurban-digiurban 2>/dev/null || true

# 5. Rebuild com --no-cache
echo "🏗️  Rebuilding imagem (pode demorar alguns minutos)..."
docker compose -f docker-compose.vps.yml build digiurban --no-cache

# 6. Subir containers
echo "🚀 Subindo containers..."
docker compose -f docker-compose.vps.yml up -d

# 7. Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 10

# 8. Verificar status
echo "✅ Status dos containers:"
docker compose -f docker-compose.vps.yml ps

# 9. Verificar logs
echo ""
echo "📋 Últimas linhas do log:"
docker compose -f docker-compose.vps.yml logs --tail=30 digiurban

echo ""
echo "✨ Rebuild concluído!"
echo "💡 Para ver logs em tempo real: docker compose -f docker-compose.vps.yml logs -f digiurban"
