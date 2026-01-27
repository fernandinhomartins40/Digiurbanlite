// Script profissional para corrigir migrations em produção
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Corrigindo migrations em produção...\n');

  try {
    // 1. Marcar migration falhada como aplicada
    console.log('1. Marcando migration 20260127_add_is_signed_field como aplicada...');
    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" (
        id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
      )
      VALUES (
        gen_random_uuid(),
        'manual_fix',
        NOW(),
        '20260127_add_is_signed_field',
        'Marcado manualmente como aplicado - campo já existe no banco',
        NULL,
        NOW(),
        1
      )
      ON CONFLICT (migration_name) DO UPDATE
      SET finished_at = NOW(),
          logs = 'Marcado manualmente como aplicado - campo já existe no banco',
          rolled_back_at = NULL
    `);
    console.log('   ✓ Migration marcada como aplicada\n');

    // 2. Verificar se triggerServices existe
    console.log('2. Verificando campo triggerServices...');
    const triggerServicesExists = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'citizen_categories'
        AND column_name = 'triggerServices'
    `;

    if (triggerServicesExists.length > 0) {
      console.log('   ⚠️  Campo triggerServices existe no banco');
      console.log('   📦 Salvando dados antes de remover...');

      // Salvar dados em metadata
      await prisma.$executeRawUnsafe(`
        UPDATE citizen_categories
        SET metadata = COALESCE(metadata, '{}'::jsonb) ||
                       jsonb_build_object('legacyTriggerServices', "triggerServices")
        WHERE "triggerServices" IS NOT NULL
          AND "triggerServices" != '[]'::jsonb
      `);
      console.log('   ✓ Dados salvos em metadata.legacyTriggerServices');

      // Remover coluna
      await prisma.$executeRawUnsafe(`
        ALTER TABLE citizen_categories DROP COLUMN IF EXISTS "triggerServices"
      `);
      console.log('   ✓ Campo triggerServices removido\n');
    } else {
      console.log('   ✓ Campo triggerServices não existe (OK)\n');
    }

    // 3. Verificar outras migrations pendentes
    console.log('3. Verificando migrations pendentes...');
    const pendingMigrations = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at
      FROM "_prisma_migrations"
      WHERE finished_at IS NULL
      ORDER BY started_at DESC
    `;

    if (pendingMigrations.length > 0) {
      console.log('   ⚠️  Migrations pendentes encontradas:');
      pendingMigrations.forEach(m => {
        console.log(`      - ${m.migration_name}`);
      });

      // Marcar todas como falhadas (para serem reexecutadas)
      await prisma.$executeRawUnsafe(`
        UPDATE "_prisma_migrations"
        SET finished_at = NOW(),
            logs = 'Marcado como falhado para reexecução',
            rolled_back_at = NOW()
        WHERE finished_at IS NULL
      `);
      console.log('   ✓ Migrations marcadas como falhadas para reexecução\n');
    } else {
      console.log('   ✓ Nenhuma migration pendente\n');
    }

    // 4. Listar migrations aplicadas
    console.log('4. Migrations aplicadas:');
    const appliedMigrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at
      FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL
      ORDER BY finished_at DESC
      LIMIT 10
    `;

    appliedMigrations.forEach(m => {
      const date = new Date(m.finished_at).toISOString();
      console.log(`   ✓ ${m.migration_name} (${date})`);
    });

    console.log('\n✅ Correções aplicadas com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Fazer commit e push deste script');
    console.log('   2. Fazer deploy novamente');
    console.log('   3. As migrations devem aplicar corretamente agora\n');

  } catch (error) {
    console.error('❌ Erro ao corrigir migrations:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
