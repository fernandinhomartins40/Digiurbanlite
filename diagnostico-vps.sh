#!/bin/bash

##############################################
# 🔍 DIAGNÓSTICO TFD - VPS PRODUÇÃO
##############################################

echo ""
echo "=========================================="
echo "  🔍 DIAGNÓSTICO TFD - PRODUÇÃO"
echo "=========================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório do projeto (ajuste se necessário)
PROJECT_DIR="/var/www/digiurban/backend"

# Verificar se está no diretório correto
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Diretório não encontrado: $PROJECT_DIR${NC}"
    echo "Por favor, ajuste a variável PROJECT_DIR no script"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1

echo -e "${GREEN}✅ Diretório: $PROJECT_DIR${NC}\n"

##############################################
# 1. Verificar Protocolos TFD
##############################################

echo "📋 1. PROTOCOLOS TFD..."
echo ""

npx prisma db execute --stdin <<'EOF'
SELECT
  number,
  title,
  "moduleType",
  status,
  "createdAt"::date as criado,
  CASE
    WHEN "customData"::text LIKE '%tfdSolicitacaoId%' THEN 'SIM'
    ELSE 'NÃO'
  END as convertido
FROM "ProtocolSimplified"
WHERE
  "moduleType" LIKE '%TFD%'
  OR title ILIKE '%TFD%'
ORDER BY "createdAt" DESC
LIMIT 10;
EOF

echo ""

##############################################
# 2. Verificar Solicitações TFD
##############################################

echo "🏥 2. SOLICITAÇÕES TFD..."
echo ""

npx prisma db execute --stdin <<'EOF'
SELECT
  LEFT(id, 12) as id_short,
  LEFT("protocolId", 12) as protocolo_short,
  especialidade,
  "cidadeDestino" as destino,
  status,
  prioridade,
  "createdAt"::date as criado
FROM "SolicitacaoTFD"
ORDER BY "createdAt" DESC
LIMIT 10;
EOF

echo ""

##############################################
# 3. Contar Registros
##############################################

echo "📊 3. CONTADORES..."
echo ""

PROTOCOLOS_COUNT=$(npx prisma db execute --stdin <<'EOF' | tail -n 1
SELECT COUNT(*) FROM "ProtocolSimplified"
WHERE "moduleType" LIKE '%TFD%' OR title ILIKE '%TFD%';
EOF
)

SOLICITACOES_COUNT=$(npx prisma db execute --stdin <<'EOF' | tail -n 1
SELECT COUNT(*) FROM "SolicitacaoTFD";
EOF
)

echo "   Total Protocolos TFD: $PROTOCOLOS_COUNT"
echo "   Total Solicitações TFD: $SOLICITACOES_COUNT"
echo ""

##############################################
# 4. Verificar Protocolos NÃO Convertidos
##############################################

echo "⚠️  4. PROTOCOLOS NÃO CONVERTIDOS..."
echo ""

npx prisma db execute --stdin <<'EOF'
SELECT
  id,
  number,
  "moduleType",
  status,
  "createdAt"::date
FROM "ProtocolSimplified"
WHERE
  ("moduleType" LIKE '%TFD%' OR title ILIKE '%TFD%')
  AND NOT ("customData"::text LIKE '%tfdSolicitacaoId%')
LIMIT 5;
EOF

echo ""

##############################################
# 5. Verificar Serviço TFD
##############################################

echo "🎯 5. SERVIÇO TFD CADASTRADO..."
echo ""

npx prisma db execute --stdin <<'EOF'
SELECT
  name,
  "moduleType",
  "serviceType",
  "isActive"
FROM "ServiceSimplified"
WHERE
  name ILIKE '%TFD%'
  OR "moduleType" LIKE '%TFD%';
EOF

echo ""

##############################################
# 6. Status do Backend
##############################################

echo "🔧 6. STATUS DO BACKEND..."
echo ""

if command -v pm2 &> /dev/null; then
    pm2 status | grep -i backend || echo "   Backend não encontrado no PM2"
else
    echo "   PM2 não instalado"
fi

echo ""

##############################################
# 7. Teste da API
##############################################

echo "🌐 7. TESTE DA API..."
echo ""

# Testar endpoint de stats
echo "   Testando /api/tfd/dashboard/stats..."
STATS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/tfd/dashboard/stats)

if [ "$STATS_RESPONSE" = "200" ]; then
    echo -e "   ${GREEN}✅ API respondendo (HTTP $STATS_RESPONSE)${NC}"
else
    echo -e "   ${RED}❌ API não respondeu (HTTP $STATS_RESPONSE)${NC}"
fi

# Testar endpoint de solicitações
echo "   Testando /api/tfd/solicitacoes..."
SOL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/tfd/solicitacoes)

if [ "$SOL_RESPONSE" = "200" ]; then
    echo -e "   ${GREEN}✅ API respondendo (HTTP $SOL_RESPONSE)${NC}"
else
    echo -e "   ${RED}❌ API não respondeu (HTTP $SOL_RESPONSE)${NC}"
fi

echo ""

##############################################
# 8. Logs Recentes (erros TFD)
##############################################

echo "📝 8. LOGS RECENTES (erros relacionados a TFD)..."
echo ""

if command -v pm2 &> /dev/null; then
    echo "   Últimos erros TFD no PM2:"
    pm2 logs backend --lines 50 --nostream 2>/dev/null | grep -i "tfd\|erro\|error" | tail -n 10 || echo "   Nenhum erro TFD encontrado"
else
    echo "   PM2 não disponível para verificar logs"
fi

echo ""

##############################################
# RESUMO
##############################################

echo "=========================================="
echo "  📊 RESUMO"
echo "=========================================="
echo ""
echo "Protocolos TFD: $PROTOCOLOS_COUNT"
echo "Solicitações TFD: $SOLICITACOES_COUNT"
echo ""

if [ "$STATS_RESPONSE" = "200" ] && [ "$SOL_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ API TFD funcionando${NC}"
else
    echo -e "${RED}❌ Problema na API TFD${NC}"
fi

echo ""
echo "=========================================="
echo ""

# Perguntar se deseja executar diagnóstico detalhado
read -p "Deseja executar diagnóstico TypeScript detalhado? (s/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "Executando diagnóstico detalhado..."
    echo ""

    if [ -f "scripts/diagnostico-tfd.ts" ]; then
        npx ts-node scripts/diagnostico-tfd.ts
    else
        echo "Script diagnostico-tfd.ts não encontrado em scripts/"
        echo "Faça upload do script antes de executar esta opção."
    fi
fi

echo ""
echo "=========================================="
echo "  ✅ DIAGNÓSTICO CONCLUÍDO"
echo "=========================================="
echo ""
