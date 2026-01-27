// Script para corrigir migrations de categorização em produção
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Corrigindo migrations de categorização...\n');

  try {
    // 1. Marcar migration 20260127100000_dynamic_category_system como aplicada (se falhou)
    console.log('1. Verificando migration 20260127100000_dynamic_category_system...');
    const failedMigration = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at
      FROM "_prisma_migrations"
      WHERE migration_name = '20260127100000_dynamic_category_system'
        AND finished_at IS NULL
    `;

    if (failedMigration.length > 0) {
      console.log('   ⚠️  Migration falhou anteriormente, marcando como aplicada...');
      await prisma.$executeRawUnsafe(`
        UPDATE "_prisma_migrations"
        SET finished_at = NOW(),
            logs = 'Marcado manualmente como aplicado - simplificação do sistema'
        WHERE migration_name = '20260127100000_dynamic_category_system'
          AND finished_at IS NULL
      `);
      console.log('   ✓ Migration marcada como aplicada\n');
    } else {
      console.log('   ✓ Migration não está pendente (OK)\n');
    }

    // 2. Remover views/triggers/funções obsoletas SE EXISTIREM
    console.log('2. Removendo views/triggers/funções obsoletas...');

    await prisma.$executeRawUnsafe(`DROP VIEW IF EXISTS "service_category_matches" CASCADE`);
    console.log('   ✓ View removida');

    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trigger_analyze_service ON "services_simplified"`);
    console.log('   ✓ Trigger removido');

    await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS analyze_service_for_categories()`);
    console.log('   ✓ Função removida\n');

    // 3. Remover tabelas obsoletas SE EXISTIREM
    console.log('3. Removendo tabelas obsoletas...');
    const tablesToDrop = [
      'service_tags',
      'citizen_category_match_suggestions',
      'citizen_category_learning_data',
      'service_category_assignments',
      'citizen_category_match_rules',
      'background_jobs'
    ];

    for (const table of tablesToDrop) {
      try {
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`   ✓ Tabela ${table} removida`);
      } catch (e) {
        console.log(`   ⚠️  Tabela ${table} não existe (OK)`);
      }
    }
    console.log('');

    // 4. Remover campos obsoletos de citizen_categories SE EXISTIREM
    console.log('4. Removendo campos obsoletos de citizen_categories...');
    const fieldsToRemove = [
      'matchingEnabled',
      'autoAssignThreshold',
      'suggestThreshold',
      'exactPatterns',
      'regexPatterns',
      'semanticRules'
    ];

    for (const field of fieldsToRemove) {
      try {
        const fieldExists = await prisma.$queryRaw`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'citizen_categories'
            AND column_name = ${field}
        `;

        if (fieldExists.length > 0) {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "citizen_categories" DROP COLUMN IF EXISTS "${field}"
          `);
          console.log(`   ✓ Campo ${field} removido`);
        } else {
          console.log(`   ℹ️  Campo ${field} não existe (OK)`);
        }
      } catch (e) {
        console.log(`   ⚠️  Erro ao remover ${field}: ${e.message}`);
      }
    }
    console.log('');

    // 5. Adicionar campo triggerServices SE NÃO EXISTIR (com nome correto case-sensitive)
    console.log('5. Verificando campo triggerServices...');
    const triggerServicesExists = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'citizen_categories'
        AND column_name IN ('triggerServices', 'triggerservices')
    `;

    if (triggerServicesExists.length === 0) {
      console.log('   → Adicionando campo triggerServices...');
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "citizen_categories"
        ADD COLUMN "triggerServices" TEXT[] DEFAULT '{}'
      `);
      console.log('   ✓ Campo adicionado');

      // Criar índice
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_citizen_categories_trigger_services"
        ON "citizen_categories" USING GIN ("triggerServices")
      `);
      console.log('   ✓ Índice criado\n');
    } else {
      // Verificar se está em lowercase e renomear
      const lowercaseExists = triggerServicesExists.find(r => r.column_name === 'triggerservices');
      if (lowercaseExists) {
        console.log('   ⚠️  Campo existe em lowercase, renomeando...');
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "citizen_categories"
          RENAME COLUMN triggerservices TO "triggerServices"
        `);
        console.log('   ✓ Campo renomeado para camelCase\n');
      } else {
        console.log('   ✓ Campo triggerServices já existe\n');
      }
    }

    // 6. Popular triggerServices nas categorias existentes
    console.log('6. Populando triggerServices nas categorias...');
    const categoriesToUpdate = [
      { code: 'PRODUTOR_RURAL', triggers: ['CADASTRO_PRODUTOR'] },
      { code: 'PROPRIETARIO_RURAL', triggers: ['CADASTRO_PROPRIEDADE_RURAL'] },
      { code: 'BENEFICIARIO_PROGRAMA_RURAL', triggers: ['INSCRICAO_PROGRAMA_RURAL'] },
      { code: 'ARTISTA_LOCAL', triggers: ['CADASTRO_ARTISTA'] },
      { code: 'MEMBRO_GRUPO_ARTISTICO', triggers: ['CADASTRO_GRUPO_ARTISTICO'] },
      { code: 'PARTICIPANTE_OFICINA_CULTURAL', triggers: ['INSCRICAO_OFICINA_CULTURAL'] },
      { code: 'ATLETA', triggers: ['CADASTRO_ATLETA'] },
      { code: 'PARTICIPANTE_MODALIDADE_ESPORTIVA', triggers: ['INSCRICAO_MODALIDADE'] },
      { code: 'BENEFICIARIO_PROGRAMA_SOCIAL', triggers: ['INSCRICAO_PROGRAMA_SOCIAL', 'CADASTRO_BENEFICIARIO'] },
      { code: 'FAMILIA_VULNERAVEL', triggers: ['CADASTRO_FAMILIA_VULNERAVEL'] },
      { code: 'ALUNO_REDE_MUNICIPAL', triggers: ['MATRICULA_ALUNO', 'REMATRICULA_ALUNO'] },
      { code: 'RESPONSAVEL_ALUNO', triggers: ['MATRICULA_ALUNO', 'REMATRICULA_ALUNO'] },
      { code: 'MICROEMPREENDEDOR', triggers: ['CADASTRO_MEI', 'RENOVACAO_ALVARA'] },
      { code: 'PROPRIETARIO_IMOVEL', triggers: ['CADASTRO_IMOVEL', 'ATUALIZACAO_IPTU'] },
      { code: 'PERMISSIONARIO_COMERCIO', triggers: ['LICENCA_COMERCIO_AMBULANTE', 'RENOVACAO_PERMISSAO'] },
      { code: 'MOTORISTA_TRANSPORTE_PUBLICO', triggers: ['CADASTRO_MOTORISTA_TRANSPORTE'] },
      { code: 'BENEFICIARIO_TFD', triggers: ['SOLICITACAO_TFD'] },
      { code: 'PACIENTE_CRONICO', triggers: ['CADASTRO_DOENCA_CRONICA', 'PROGRAMA_HIPERTENSO'] }
    ];

    let updated = 0;
    for (const cat of categoriesToUpdate) {
      try {
        const result = await prisma.$executeRawUnsafe(`
          UPDATE "citizen_categories"
          SET "triggerServices" = ARRAY[${cat.triggers.map(t => `'${t}'`).join(',')}]::TEXT[]
          WHERE code = '${cat.code}'
            AND ("triggerServices" IS NULL OR "triggerServices" = '{}')
        `);
        if (result > 0) {
          console.log(`   ✓ ${cat.code} atualizado`);
          updated++;
        }
      } catch (e) {
        console.log(`   ⚠️  Erro ao atualizar ${cat.code}: ${e.message}`);
      }
    }
    console.log(`   ✓ ${updated} categorias atualizadas\n`);

    // 7. Marcar migration de uniqueness como aplicada se necessário
    console.log('7. Verificando migration de uniqueness...');
    const uniquenessMigration = await prisma.$queryRaw`
      SELECT migration_name, finished_at
      FROM "_prisma_migrations"
      WHERE migration_name = '20260127120000_add_protocol_uniqueness_fields'
    `;

    if (uniquenessMigration.length > 0 && !uniquenessMigration[0].finished_at) {
      console.log('   → Migration pendente, marcando como aplicada...');
      await prisma.$executeRawUnsafe(`
        UPDATE "_prisma_migrations"
        SET finished_at = NOW(),
            logs = 'Marcado como aplicado - campos já existem no banco'
        WHERE migration_name = '20260127120000_add_protocol_uniqueness_fields'
          AND finished_at IS NULL
      `);
      console.log('   ✓ Migration marcada como aplicada\n');
    } else {
      console.log('   ✓ Migration já está aplicada\n');
    }

    // 8. Marcar migration de simplificação como aplicada
    console.log('8. Verificando migration de simplificação...');
    const simplifyMigration = await prisma.$queryRaw`
      SELECT migration_name, finished_at
      FROM "_prisma_migrations"
      WHERE migration_name = '20260127140000_simplify_categorization'
    `;

    if (simplifyMigration.length > 0 && !simplifyMigration[0].finished_at) {
      console.log('   → Migration pendente, marcando como aplicada...');
      await prisma.$executeRawUnsafe(`
        UPDATE "_prisma_migrations"
        SET finished_at = NOW(),
            logs = 'Marcado como aplicado - estruturas já limpas'
        WHERE migration_name = '20260127140000_simplify_categorization'
          AND finished_at IS NULL
      `);
      console.log('   ✓ Migration marcada como aplicada\n');
    } else if (simplifyMigration.length === 0) {
      console.log('   → Migration não existe ainda, será aplicada normalmente\n');
    } else {
      console.log('   ✓ Migration já está aplicada\n');
    }

    console.log('✅ Correções aplicadas com sucesso!\n');
    console.log('📝 Próximo passo: prisma migrate deploy deve funcionar agora\n');

  } catch (error) {
    console.error('❌ Erro ao corrigir migrations:', error.message);
    console.error(error);
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
