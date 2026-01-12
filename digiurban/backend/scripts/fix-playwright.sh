#!/bin/bash

echo "🎭 Instalando browsers do Playwright..."

# Instalar browsers do Playwright com dependências do sistema
npx playwright install --with-deps chromium

# Se falhar, tentar sem dependências do sistema (modo fallback)
if [ $? -ne 0 ]; then
  echo "⚠️ Falha ao instalar com dependências. Tentando sem dependências..."
  npx playwright install chromium
fi

echo "✅ Playwright configurado!"
