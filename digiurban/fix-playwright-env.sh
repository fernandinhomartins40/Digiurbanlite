#!/bin/bash
# Script para adicionar PLAYWRIGHT_BROWSERS_PATH ao docker-compose.vps.yml

echo "🔧 Adicionando PLAYWRIGHT_BROWSERS_PATH ao docker-compose.vps.yml..."

cd /root/digiurban

# Fazer backup do arquivo original
cp docker-compose.vps.yml docker-compose.vps.yml.backup

# Adicionar a variável de ambiente no serviço digiurban
# Procurar pela linha "JWT_EXPIRES_IN=7d" e adicionar a nova variável depois
sed -i '/JWT_EXPIRES_IN=7d/a\      - PLAYWRIGHT_BROWSERS_PATH=/ms-playwright' docker-compose.vps.yml

echo "✅ Variável adicionada!"
echo ""
echo "📋 Verificando se foi adicionada corretamente:"
grep -A 5 "PLAYWRIGHT_BROWSERS_PATH" docker-compose.vps.yml || echo "❌ Não encontrada - verificar manualmente"

echo ""
echo "🔄 Reiniciando container..."
docker compose -f docker-compose.vps.yml up -d digiurban

echo ""
echo "✅ Pronto! Aguarde alguns segundos e teste novamente."
