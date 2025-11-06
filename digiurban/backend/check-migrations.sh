#!/bin/bash

# Script para verificar e aplicar migrações do Prisma no servidor de produção

echo "========================================="
echo "🔍 DIAGNÓSTICO DE MIGRAÇÕES - DigiUrban"
echo "========================================="
echo ""

# 1. Verificar migrações locais
echo "📁 Migrações disponíveis (local):"
ls -1 prisma/migrations/ | grep -v migration_lock.toml
echo ""

# 2. Status das migrações no banco
echo "🔍 Verificando status das migrações no banco..."
npx prisma migrate status
echo ""

# 3. Mostrar última migração aplicada
echo "📊 Última migração aplicada:"
npx prisma migrate status | grep "applied" | tail -1
echo ""

# 4. Verificar se há migrações pendentes
PENDING=$(npx prisma migrate status 2>&1 | grep -c "not yet been applied")

if [ $PENDING -gt 0 ]; then
    echo "⚠️  ATENÇÃO: Há migrações pendentes!"
    echo ""
    echo "Para aplicar as migrações pendentes, execute:"
    echo "  npx prisma migrate deploy"
    echo ""
else
    echo "✅ Todas as migrações estão aplicadas!"
    echo ""
fi

# 5. Verificar schema do Citizen
echo "🔍 Verificando constraint do CPF no banco..."
echo "SELECT sql FROM sqlite_master WHERE type='index' AND name='citizens_cpf_key';" | sqlite3 prisma/dev.db

if [ $? -eq 0 ]; then
    echo "❌ Constraint @unique do CPF AINDA EXISTE no banco!"
    echo "   Migração 20251024140335_fix_citizen_cpf_unique_constraint NÃO foi aplicada"
else
    echo "✅ Constraint @unique do CPF foi removida corretamente"
fi
