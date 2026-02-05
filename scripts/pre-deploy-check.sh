#!/bin/bash

# ============================================================================
# Script de Validação Pré-Deploy
# ============================================================================
# Valida que o código local está pronto para deploy
# Uso: ./scripts/pre-deploy-check.sh
# ============================================================================

set -e

echo "=========================================="
echo "🔍 Validação Pré-Deploy"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# ============================================================================
# 1. VALIDAR GIT STATUS
# ============================================================================

echo "📋 Validando status do Git..."

# Verificar branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${RED}❌ ERRO: Não está no branch main (branch atual: $CURRENT_BRANCH)${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓${NC} Branch: main"
fi

# Verificar se há alterações não comitadas
if ! git diff-index --quiet HEAD --; then
  echo -e "${YELLOW}⚠️  AVISO: Há alterações não comitadas${NC}"
  git status --short
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}✓${NC} Sem alterações não comitadas"
fi

# Verificar se está sincronizado com origin
git fetch origin main --quiet
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)

if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
  BEHIND=$(git rev-list HEAD..origin/main --count)
  AHEAD=$(git rev-list origin/main..HEAD --count)

  if [ "$BEHIND" -gt 0 ]; then
    echo -e "${RED}❌ ERRO: Local está $BEHIND commits ATRÁS de origin/main${NC}"
    ERRORS=$((ERRORS + 1))
  fi

  if [ "$AHEAD" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  AVISO: Local está $AHEAD commits À FRENTE de origin/main${NC}"
    echo "Execute: git push origin main"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "${GREEN}✓${NC} Sincronizado com origin/main"
fi

echo ""

# ============================================================================
# 2. VALIDAR ARQUIVOS CRÍTICOS
# ============================================================================

echo "📁 Validando arquivos críticos..."

# Backend - admin-citizens.ts
if [ ! -f "digiurban/backend/src/routes/admin-citizens.ts" ]; then
  echo -e "${RED}❌ ERRO: admin-citizens.ts não encontrado${NC}"
  ERRORS=$((ERRORS + 1))
elif grep -q "headId: id" digiurban/backend/src/routes/admin-citizens.ts; then
  echo -e "${GREEN}✓${NC} admin-citizens.ts (com correção headId)"
else
  echo -e "${YELLOW}⚠️  AVISO: admin-citizens.ts pode estar desatualizado${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# Frontend - página de família
if [ -f "digiurban/frontend/app/cidadao/familia/page.tsx" ]; then
  if grep -q "familyData?.head?.birthDate" digiurban/frontend/app/cidadao/familia/page.tsx; then
    echo -e "${GREEN}✓${NC} cidadao/familia/page.tsx (com optional chaining)"
  else
    echo -e "${YELLOW}⚠️  AVISO: cidadao/familia/page.tsx pode estar desatualizado${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# Frontend - AddFamilyMemberDialog
if [ -f "digiurban/frontend/components/citizen/AddFamilyMemberDialog.tsx" ]; then
  if grep -q "debouncedSearch" digiurban/frontend/components/citizen/AddFamilyMemberDialog.tsx; then
    echo -e "${GREEN}✓${NC} AddFamilyMemberDialog.tsx (com debounce)"
  else
    echo -e "${YELLOW}⚠️  AVISO: AddFamilyMemberDialog.tsx pode estar desatualizado${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# Frontend - CitizenFamilyCompositionEnhanced
if [ -f "digiurban/frontend/components/admin/CitizenFamilyCompositionEnhanced.tsx" ]; then
  if grep -q "debouncedSearch" digiurban/frontend/components/admin/CitizenFamilyCompositionEnhanced.tsx; then
    echo -e "${GREEN}✓${NC} CitizenFamilyCompositionEnhanced.tsx (com debounce)"
  else
    echo -e "${YELLOW}⚠️  AVISO: CitizenFamilyCompositionEnhanced.tsx pode estar desatualizado${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# AdminSidebar - não deve ter link de equipe
if [ -f "digiurban/frontend/components/admin/AdminSidebar.tsx" ]; then
  if grep -q "/admin/equipe" digiurban/frontend/components/admin/AdminSidebar.tsx; then
    echo -e "${YELLOW}⚠️  AVISO: AdminSidebar ainda tem link /admin/equipe${NC}"
    WARNINGS=$((WARNINGS + 1))
  else
    echo -e "${GREEN}✓${NC} AdminSidebar.tsx (sem link de equipe)"
  fi
fi

echo ""

# ============================================================================
# 3. VALIDAR DOCKER
# ============================================================================

echo "🐳 Validando arquivos Docker..."

if [ ! -f "digiurban/Dockerfile" ]; then
  echo -e "${RED}❌ ERRO: Dockerfile não encontrado${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓${NC} Dockerfile encontrado"
fi

if [ ! -f "docker-compose.vps.yml" ]; then
  echo -e "${RED}❌ ERRO: docker-compose.vps.yml não encontrado${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓${NC} docker-compose.vps.yml encontrado"
fi

echo ""

# ============================================================================
# 4. RESUMO
# ============================================================================

echo "=========================================="
echo "📊 Resumo da Validação"
echo "=========================================="
echo ""

if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}❌ ERROS: $ERRORS${NC}"
  echo ""
  echo "⛔ NÃO EXECUTE O DEPLOY até resolver os erros acima!"
  exit 1
fi

if [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  AVISOS: $WARNINGS${NC}"
  echo ""
  echo "⚠️  Você pode prosseguir com o deploy, mas revise os avisos acima."
  echo ""
  read -p "Deseja continuar com o deploy? (s/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Deploy cancelado pelo usuário."
    exit 1
  fi
fi

echo -e "${GREEN}✅ Validação concluída com sucesso!${NC}"
echo ""
echo "✓ Código está pronto para deploy"
echo ""
echo "Execute o deploy com:"
echo "  ./deploy-vps.sh"
echo ""
