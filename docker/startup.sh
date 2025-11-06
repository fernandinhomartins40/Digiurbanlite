#!/bin/sh
set -e

echo "========================================="
echo "🚀 DigiUrban - Startup"
echo "========================================="

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p /app/data /app/uploads /app/logs
chmod 777 /app/data /app/uploads /app/logs

# Ir para diretório do backend
cd /app/backend

# Gerar Prisma Client APENAS se não existir
# (já foi gerado durante o build do Docker, mas podemos revalidar)
echo "🔧 Validando Prisma Client..."
if [ ! -d "node_modules/.prisma/client" ]; then
    echo "   Gerando Prisma Client..."
    DATABASE_URL="file:/app/data/dev.db" npx prisma generate || echo "⚠️ Prisma generate falhou"
else
    echo "   ✅ Prisma Client já existe"
fi

# Criar banco de dados se não existir
if [ ! -f "/app/data/dev.db" ]; then
    echo "🗄️  Criando banco de dados..."
    touch /app/data/dev.db
    chmod 666 /app/data/dev.db
fi

# Backup do banco antes de migrations (segurança)
if [ -f "/app/data/dev.db" ]; then
    BACKUP_FILE="/app/data/dev.db.backup-$(date +%Y%m%d-%H%M%S)"
    echo "💾 Fazendo backup do banco: $BACKUP_FILE"
    cp /app/data/dev.db "$BACKUP_FILE"
    # Manter apenas os 3 backups mais recentes
    ls -t /app/data/dev.db.backup-* 2>/dev/null | tail -n +4 | xargs -r rm -f
fi

# Migrar banco de dados Prisma
echo "📦 Executando migrations do Prisma..."
DATABASE_URL="file:/app/data/dev.db" npx prisma migrate deploy || {
    echo "⚠️  Migrations falharam, tentando db push..."
    DATABASE_URL="file:/app/data/dev.db" npx prisma db push --skip-generate || {
        echo "❌ db push falhou. Restaurando backup..."
        if [ -f "$BACKUP_FILE" ]; then
            cp "$BACKUP_FILE" /app/data/dev.db
            echo "✅ Backup restaurado"
        fi
        exit 1
    }
}

# Função para verificar se dados essenciais existem
check_essential_data() {
    echo "🔍 Verificando dados essenciais no banco..."

    # Criar script inline para verificação (não depende de arquivos externos)
    cat > /tmp/check-db.js <<'CHECKSCRIPT'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const superAdminCount = await prisma.user.count({
      where: { role: 'SUPER_ADMIN' }
    });
    const unassignedPool = await prisma.tenant.findUnique({
      where: { id: 'clzunassigned000000000000000' }
    });
    const demoTenant = await prisma.tenant.findUnique({
      where: { id: 'demo' }
    });

    console.log(JSON.stringify({
      superAdminCount,
      hasUnassignedPool: !!unassignedPool,
      hasDemoTenant: !!demoTenant,
      ok: superAdminCount > 0 && !!unassignedPool
    }));

    await prisma.$disconnect();
    process.exit((superAdminCount > 0 && !!unassignedPool) ? 0 : 1);
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

check();
CHECKSCRIPT

    # Executar script de verificação
    INTEGRITY_RESULT=$(DATABASE_URL="file:/app/data/dev.db" node /tmp/check-db.js 2>&1)
    INTEGRITY_EXIT_CODE=$?

    # Debug: Mostrar resultado completo
    echo "📋 Resultado da verificação:"
    echo "$INTEGRITY_RESULT"
    echo "📋 Exit code: $INTEGRITY_EXIT_CODE"

    # Limpar arquivo temporário
    rm -f /tmp/check-db.js

    if [ $INTEGRITY_EXIT_CODE -eq 0 ]; then
        # Extrair e mostrar informações
        SUPER_ADMIN_COUNT=$(echo "$INTEGRITY_RESULT" | grep -o '"superAdminCount":[0-9]*' | cut -d: -f2)
        HAS_UNASSIGNED=$(echo "$INTEGRITY_RESULT" | grep -o '"hasUnassignedPool":[a-z]*' | cut -d: -f2)
        HAS_DEMO=$(echo "$INTEGRITY_RESULT" | grep -o '"hasDemoTenant":[a-z]*' | cut -d: -f2)

        echo "  - Super Admins: ${SUPER_ADMIN_COUNT:-0}"
        echo "  - UNASSIGNED_POOL: $([ "$HAS_UNASSIGNED" = "true" ] && echo 'EXISTS ✅' || echo 'MISSING ❌')"
        echo "  - Demo Tenant: $([ "$HAS_DEMO" = "true" ] && echo 'EXISTS ✅' || echo 'MISSING ❌')"
        echo "✅ Dados essenciais existem"
        return 0
    else
        echo "⚠️  Dados essenciais faltando ou erro na verificação!"
        echo "💡 Motivo: $INTEGRITY_RESULT"
        return 1
    fi
}

# Verificar se precisa executar seed
NEED_SEED=false

if [ ! -f "/app/data/.seeded" ]; then
    echo "ℹ️  Primeira execução detectada (sem arquivo .seeded)"
    NEED_SEED=true
elif ! check_essential_data; then
    echo "⚠️  Dados essenciais faltando, seed será executado"
    NEED_SEED=true
    # Remover marcador para forçar seed
    rm -f /app/data/.seeded
else
    echo "ℹ️  Database já foi inicializado e dados essenciais existem"
fi

# Executar seed se necessário
if [ "$NEED_SEED" = true ]; then
    echo "🌱 Executando seed..."
    DATABASE_URL="file:/app/data/dev.db" npm run db:seed || {
        echo "❌ Seed falhou"
        exit 1
    }
    touch /app/data/.seeded
    echo "✅ Seed concluído e marcado"
    echo "ℹ️  Seed executado com sucesso, dados essenciais foram criados"
fi

echo "✅ Startup concluído!"
echo "🔍 Verificando estrutura:"
echo "  - Backend: $(ls -la /app/backend/dist/index.js 2>/dev/null && echo 'OK' || echo 'MISSING')"
echo "  - Frontend: $(ls -la /app/frontend/server.js 2>/dev/null && echo 'OK' || echo 'MISSING')"
echo "  - Prisma: $(ls -la /app/backend/node_modules/.prisma 2>/dev/null && echo 'OK' || echo 'MISSING')"
echo "  - Database: $(ls -lh /app/data/dev.db)"
echo "========================================="

# Iniciar supervisord
exec /usr/bin/supervisord -c /etc/supervisord.conf
