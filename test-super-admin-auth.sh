#!/bin/bash

echo "=== Testando Autenticação Super Admin e Lista de Planos ==="

# Login
echo "1. Fazendo login como Super Admin..."
LOGIN_RESPONSE=$(curl -s -c cookies.txt -X POST http://72.60.10.108:3060/api/super-admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@digiurban.com",
    "password": "DigiUrban@2024!"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

# Extrair token se houver
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -n "$TOKEN" ]; then
  echo "✅ Token obtido: ${TOKEN:0:20}..."
else
  echo "❌ Nenhum token no response"
fi

echo ""
echo "2. Testando rota de planos COM cookie..."
curl -s -b cookies.txt http://72.60.10.108:3060/api/super-admin/email/plans | jq '.'

echo ""
echo "3. Verificando cookies salvos..."
cat cookies.txt

rm -f cookies.txt
