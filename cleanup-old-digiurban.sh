#!/bin/bash
set -e

echo "========================================="
echo "🧹 Limpando DigiUrban Antigo da VPS"
echo "========================================="

# Parar e remover container antigo
echo "🛑 Parando container digiurban-unified..."
docker stop digiurban-unified || echo "Container já estava parado"

echo "🗑️  Removendo container digiurban-unified..."
docker rm digiurban-unified || echo "Container já foi removido"

# Remover imagem antiga
echo "🗑️  Removendo imagem digiurban-unified..."
docker rmi digiurban-unified || echo "Imagem já foi removida"

# Verificar containers restantes
echo ""
echo "✅ Containers DigiUrban após limpeza:"
docker ps -a | grep digiurban || echo "Nenhum container DigiUrban antigo encontrado"

echo ""
echo "========================================="
echo "✅ Limpeza concluída!"
echo "🌐 Domínio www.digiurban.com.br liberado"
echo "🚀 Container ativo: digiurban-vps (porta 3060)"
echo "========================================="
