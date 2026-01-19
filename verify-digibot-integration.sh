#!/bin/bash

# ========================================
# Script de Verificação da Integração DigiBot
# ========================================

echo "🤖 Verificando Integração do DigiBot com UltraZend Messages"
echo "============================================================"
echo ""

ERRORS=0
WARNINGS=0

# Cores
RED='\033[0:31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ========================================
# 1. Verificar Arquivos Criados
# ========================================

echo "📁 1. Verificando arquivos criados..."

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
  else
    echo -e "${RED}✗${NC} $1 (MISSING)"
    ((ERRORS++))
  fi
}

# Backend
check_file "digiurban/backend/src/services/bot/BotIntegrationService.ts"
check_file "digiurban/backend/src/services/bot/UltraZendMessagesAdapter.ts"
check_file "digiurban/backend/src/services/bot/ConversationFlowManager.ts"
check_file "digiurban/backend/src/routes/botIntegrated.routes.ts"

# Frontend
check_file "digiurban/frontend/src/hooks/useBotEnhanced.ts"
check_file "digiurban/frontend/src/hooks/index.ts"

# UltraZend
check_file "ultrazend-messages-server/src/handlers/botWebSocketHandler.ts"
check_file "ultrazend-messages-server/prisma/migrations/20260119_add_bot_fields/migration.sql"

# Docs
check_file "DIGIBOT_INTEGRATION_COMPLETE.md"

echo ""

# ========================================
# 2. Verificar Schema Prisma
# ========================================

echo "🗄️  2. Verificando schema Prisma..."

if grep -q "isBotConversation" ultrazend-messages-server/prisma/schema.prisma; then
  echo -e "${GREEN}✓${NC} Campo 'isBotConversation' encontrado no schema"
else
  echo -e "${RED}✗${NC} Campo 'isBotConversation' NÃO encontrado no schema"
  ((ERRORS++))
fi

if grep -q "botFlowType" ultrazend-messages-server/prisma/schema.prisma; then
  echo -e "${GREEN}✓${NC} Campo 'botFlowType' encontrado no schema"
else
  echo -e "${RED}✗${NC} Campo 'botFlowType' NÃO encontrado no schema"
  ((ERRORS++))
fi

echo ""

# ========================================
# 3. Verificar Imports no Frontend
# ========================================

echo "🎨 3. Verificando imports no frontend..."

if grep -q "export { useBotEnhanced }" digiurban/frontend/src/hooks/index.ts 2>/dev/null; then
  echo -e "${GREEN}✓${NC} useBotEnhanced exportado em hooks/index.ts"
else
  echo -e "${RED}✗${NC} useBotEnhanced NÃO exportado em hooks/index.ts"
  ((ERRORS++))
fi

if grep -q "import { io, Socket } from 'socket.io-client'" digiurban/frontend/src/hooks/useBotEnhanced.ts; then
  echo -e "${GREEN}✓${NC} Socket.io importado em useBotEnhanced.ts"
else
  echo -e "${RED}✗${NC} Socket.io NÃO importado em useBotEnhanced.ts"
  ((ERRORS++))
fi

echo ""

# ========================================
# 4. Verificar Dependências
# ========================================

echo "📦 4. Verificando dependências..."

# Frontend - socket.io-client
if [ -f "digiurban/frontend/package.json" ]; then
  if grep -q "socket.io-client" digiurban/frontend/package.json; then
    echo -e "${GREEN}✓${NC} socket.io-client instalado no frontend"
  else
    echo -e "${YELLOW}⚠${NC} socket.io-client NÃO encontrado no package.json do frontend"
    echo "  Execute: cd digiurban/frontend && npm install socket.io-client"
    ((WARNINGS++))
  fi
fi

# Backend - axios
if [ -f "digiurban/backend/package.json" ]; then
  if grep -q "axios" digiurban/backend/package.json; then
    echo -e "${GREEN}✓${NC} axios instalado no backend"
  else
    echo -e "${YELLOW}⚠${NC} axios NÃO encontrado no package.json do backend"
    echo "  Execute: cd digiurban/backend && npm install axios"
    ((WARNINGS++))
  fi
fi

echo ""

# ========================================
# 5. Verificar Integrações Reais
# ========================================

echo "🔗 5. Verificando integrações reais..."

# createProtocol
if grep -q "createProtocol" digiurban/backend/src/services/bot/BotIntegrationService.ts; then
  echo -e "${GREEN}✓${NC} BotIntegrationService.createProtocol() implementado"
else
  echo -e "${RED}✗${NC} BotIntegrationService.createProtocol() NÃO encontrado"
  ((ERRORS++))
fi

# getAvailableServices
if grep -q "getAvailableServices" digiurban/backend/src/services/bot/BotIntegrationService.ts; then
  echo -e "${GREEN}✓${NC} BotIntegrationService.getAvailableServices() implementado"
else
  echo -e "${RED}✗${NC} BotIntegrationService.getAvailableServices() NÃO encontrado"
  ((ERRORS++))
fi

# updateCitizenProfile
if grep -q "updateCitizenProfile" digiurban/backend/src/services/bot/BotIntegrationService.ts; then
  echo -e "${GREEN}✓${NC} BotIntegrationService.updateCitizenProfile() implementado"
else
  echo -e "${RED}✗${NC} BotIntegrationService.updateCitizenProfile() NÃO encontrado"
  ((ERRORS++))
fi

echo ""

# ========================================
# 6. Verificar Fluxos Conversacionais
# ========================================

echo "💬 6. Verificando fluxos conversacionais..."

FLOWS=("SOLICITAR_SERVICO" "CONSULTAR_PROTOCOLO" "ENVIAR_DOCUMENTOS" "ATUALIZAR_PERFIL" "OUTRAS_DUVIDAS")

for flow in "${FLOWS[@]}"; do
  if grep -q "$flow" digiurban/backend/src/services/bot/ConversationFlowManager.ts; then
    echo -e "${GREEN}✓${NC} Fluxo $flow implementado"
  else
    echo -e "${RED}✗${NC} Fluxo $flow NÃO encontrado"
    ((ERRORS++))
  fi
done

echo ""

# ========================================
# 7. Verificar WebSocket Handlers
# ========================================

echo "🔌 7. Verificando WebSocket handlers..."

WS_EVENTS=("bot:get_conversation" "bot:send_message" "bot:files_uploaded" "bot:mark_read")

for event in "${WS_EVENTS[@]}"; do
  if grep -q "$event" ultrazend-messages-server/src/handlers/botWebSocketHandler.ts; then
    echo -e "${GREEN}✓${NC} Handler '$event' implementado"
  else
    echo -e "${RED}✗${NC} Handler '$event' NÃO encontrado"
    ((ERRORS++))
  fi
done

echo ""

# ========================================
# 8. Verificar Migration
# ========================================

echo "🗃️  8. Verificando migration..."

if [ -f "ultrazend-messages-server/prisma/migrations/20260119_add_bot_fields/migration.sql" ]; then
  if grep -q "ADD COLUMN.*isBotConversation" ultrazend-messages-server/prisma/migrations/20260119_add_bot_fields/migration.sql; then
    echo -e "${GREEN}✓${NC} Migration adiciona campo 'isBotConversation'"
  else
    echo -e "${RED}✗${NC} Migration NÃO adiciona campo 'isBotConversation'"
    ((ERRORS++))
  fi

  if grep -q "CREATE INDEX.*isBotConversation" ultrazend-messages-server/prisma/migrations/20260119_add_bot_fields/migration.sql; then
    echo -e "${GREEN}✓${NC} Migration cria índice para 'isBotConversation'"
  else
    echo -e "${YELLOW}⚠${NC} Migration NÃO cria índice para 'isBotConversation'"
    ((WARNINGS++))
  fi
else
  echo -e "${RED}✗${NC} Migration file NÃO encontrado"
  ((ERRORS++))
fi

echo ""

# ========================================
# 9. Verificar Remoção de Legado
# ========================================

echo "🗑️  9. Verificando remoção de código legado..."

# ConversationFlowManager não deve usar botConversation
if grep -q "prisma.botConversation" digiurban/backend/src/services/bot/ConversationFlowManager.ts; then
  echo -e "${RED}✗${NC} ConversationFlowManager ainda usa 'botConversation' (deveria usar 'conversation')"
  ((ERRORS++))
else
  echo -e "${GREEN}✓${NC} ConversationFlowManager NÃO usa 'botConversation' legado"
fi

# ConversationFlowManager deve usar adapter
if grep -q "adapter.updateBotFlow" digiurban/backend/src/services/bot/ConversationFlowManager.ts; then
  echo -e "${GREEN}✓${NC} ConversationFlowManager usa UltraZendMessagesAdapter"
else
  echo -e "${RED}✗${NC} ConversationFlowManager NÃO usa UltraZendMessagesAdapter"
  ((ERRORS++))
fi

echo ""

# ========================================
# 10. Resumo Final
# ========================================

echo "============================================================"
echo "📊 RESUMO DA VERIFICAÇÃO"
echo "============================================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ SUCESSO!${NC} Todos os testes passaram."
  echo ""
  echo "🎉 DigiBot está 100% integrado com UltraZend Messages!"
  echo ""
  echo "📚 Próximos passos:"
  echo "  1. Aplicar migration: cd ultrazend-messages-server && npx prisma migrate deploy"
  echo "  2. Instalar dependências: npm install em todos os projetos"
  echo "  3. Iniciar servidores: UltraZend (9001), Backend (3001), Frontend (3000)"
  echo "  4. Testar o chatbot no navegador"
  echo ""
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠ ATENÇÃO!${NC} Encontrados $WARNINGS aviso(s)."
  echo "  Revise os avisos acima antes de prosseguir."
  echo ""
  exit 1
else
  echo -e "${RED}❌ FALHOU!${NC} Encontrados $ERRORS erro(s) e $WARNINGS aviso(s)."
  echo "  Corrija os erros acima antes de prosseguir."
  echo ""
  exit 2
fi
