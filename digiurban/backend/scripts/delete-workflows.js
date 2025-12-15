/**
 * Script para deletar todos os workflows do banco de dados
 * Execute: node scripts/delete-workflows.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllWorkflows() {
  try {
    console.log('🗑️  Iniciando deleção de workflows...\n');

    // Contar workflows antes de deletar
    const countBefore = await prisma.moduleWorkflow.count();
    console.log(`📊 Total de workflows no banco: ${countBefore}\n`);

    if (countBefore === 0) {
      console.log('✅ Não há workflows para deletar!');
      return;
    }

    // Deletar todos os workflows
    const result = await prisma.moduleWorkflow.deleteMany({});

    console.log(`✅ ${result.count} workflows deletados com sucesso!\n`);

    // Verificar se foi tudo deletado
    const countAfter = await prisma.moduleWorkflow.count();
    console.log(`📊 Total de workflows restantes: ${countAfter}\n`);

    if (countAfter === 0) {
      console.log('🎉 Todos os workflows foram deletados do banco de dados!');
      console.log('💡 Agora você pode rodar o seed para criar os 93 workflows corretos.');
    } else {
      console.warn(`⚠️  Ainda restam ${countAfter} workflows no banco!`);
    }

  } catch (error) {
    console.error('❌ Erro ao deletar workflows:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
deleteAllWorkflows()
  .then(() => {
    console.log('\n✅ Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
