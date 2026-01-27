// Script temporário para aplicar migration de unicidade
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔧 Aplicando migration de unicidade...\n');

    // Verificar se campos já existem
    const result = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'services_simplified'
        AND column_name IN ('allowMultipleActiveProtocols', 'uniquenessScope', 'uniquenessRules')
    `;

    if (result.length > 0) {
      console.log('✅ Campos de unicidade já existem no banco:');
      result.forEach(r => console.log(`   - ${r.column_name}`));
      console.log('\n✅ Migration já foi aplicada!');
      return;
    }

    console.log('⚙️  Executando comandos SQL...\n');

    // Comando 1: Adicionar colunas
    console.log('1. Adicionando colunas...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "services_simplified"
      ADD COLUMN "allowMultipleActiveProtocols" BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN "uniquenessScope" TEXT,
      ADD COLUMN "uniquenessRules" JSONB
    `);
    console.log('   ✓ Colunas adicionadas');

    // Comando 2: Comentários (opcional, pode falhar)
    try {
      console.log('2. Adicionando comentários...');
      await prisma.$executeRawUnsafe(`
        COMMENT ON COLUMN "services_simplified"."allowMultipleActiveProtocols" IS 'Permite múltiplos protocolos ativos do mesmo serviço por cidadão. Default: true (backward compatible)'
      `);
      await prisma.$executeRawUnsafe(`
        COMMENT ON COLUMN "services_simplified"."uniquenessScope" IS 'Escopo de validação de unicidade: CITIZEN (simples), CUSTOM (módulo específico), CITIZEN_PER_FIELD (por campo do formulário)'
      `);
      await prisma.$executeRawUnsafe(`
        COMMENT ON COLUMN "services_simplified"."uniquenessRules" IS 'Regras JSON para validação de unicidade. Estrutura varia conforme uniquenessScope'
      `);
      console.log('   ✓ Comentários adicionados');
    } catch (e) {
      console.log('   ⚠️  Comentários ignorados (opcional)');
    }

    // Comando 3: Criar índice
    console.log('3. Criando índice...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX "idx_services_uniqueness_scope" ON "services_simplified"("uniquenessScope")
      WHERE "allowMultipleActiveProtocols" = false
    `);
    console.log('   ✓ Índice criado');

    console.log('✅ Migration aplicada com sucesso!\n');

    // Verificar resultado
    const check = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'services_simplified'
        AND column_name IN ('allowMultipleActiveProtocols', 'uniquenessScope', 'uniquenessRules')
      ORDER BY column_name
    `;

    console.log('📊 Campos criados:');
    check.forEach(c => {
      console.log(`   ✓ ${c.column_name} (${c.data_type}) - Default: ${c.column_default || 'NULL'}`);
    });

  } catch (error) {
    if (error.message && error.message.includes('already exists')) {
      console.log('✅ Campos já existem - Migration já foi aplicada anteriormente!');
    } else {
      console.error('❌ Erro ao aplicar migration:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
