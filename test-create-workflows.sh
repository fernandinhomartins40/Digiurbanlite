#!/bin/bash

# Script para testar criação de workflows padrão alinhados

echo "🔄 Testando criação de workflows padrão..."
echo ""

# Fazer login e obter token (ajuste as credenciais se necessário)
LOGIN_RESPONSE=$(curl -s -X POST https://digiurban.com.br/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@digiurban.com.br","password":"Admin@123"}' \
  -c /tmp/cookies.txt)

echo "Login response: $LOGIN_RESPONSE"
echo ""

# Criar workflows padrão
echo "📋 Criando workflows padrão..."
CREATE_RESPONSE=$(curl -s -X POST https://digiurban.com.br/api/workflows/seed-defaults \
  -H "Content-Type: application/json" \
  -b /tmp/cookies.txt)

echo "Create response:"
echo "$CREATE_RESPONSE" | jq '.'
echo ""

# Listar workflows criados
echo "📊 Listando workflows criados..."
LIST_RESPONSE=$(curl -s https://digiurban.com.br/api/workflows \
  -b /tmp/cookies.txt)

echo "Workflows count:"
echo "$LIST_RESPONSE" | jq '.data | length'
echo ""

# Mostrar primeiro workflow como exemplo
echo "Exemplo de workflow criado:"
echo "$LIST_RESPONSE" | jq '.data[0]'
echo ""

# Limpar cookies
rm -f /tmp/cookies.txt

echo "✅ Teste concluído!"
