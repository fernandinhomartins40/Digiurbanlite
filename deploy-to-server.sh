#!/bin/bash

# Script de deploy para DigiUrban VPS
# Uso: ./deploy-to-server.sh

echo "🚀 Iniciando deploy para digiurban.com.br..."

# Conectar via SSH e executar comandos
ssh root@digiurban.com.br << 'ENDSSH'
cd digiurban || exit 1

echo "📥 Fazendo pull do repositório..."
git pull origin main

echo "🔨 Rebuilding container digiurban..."
docker compose -f docker-compose.vps.yml build digiurban

echo "🔄 Reiniciando container..."
docker compose -f docker-compose.vps.yml up -d digiurban

echo "✅ Deploy concluído!"
echo "📊 Status dos containers:"
docker ps --filter name=digiurban

echo ""
echo "📝 Últimos logs:"
docker logs digiurban-vps --tail 20

ENDSSH

echo ""
echo "✅ Deploy finalizado com sucesso!"
echo "🌐 Aplicação disponível em: https://digiurban.com.br"
