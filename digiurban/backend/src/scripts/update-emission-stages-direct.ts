/**
 * Script direto para atualizar stages de emissão
 * Usa query SQL direta
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateEmissionStagesDirect() {
  console.log('🔄 Atualizando stages de emissão...\n');

  // Buscar todos os stages
  const allStages = await prisma.protocolStage.findMany({
    select: {
      id: true,
      protocolId: true,
      stageName: true,
      stageOrder: true,
      status: true,
      metadata: true
    }
  });

  // Filtrar stages de emissão
  const stages = allStages.filter(stage => {
    const name = stage.stageName.toLowerCase();
    return name.includes('emissão') ||
           name.includes('emissao') ||
           name.includes('geração') ||
           name.includes('geracao') ||
           name.includes('certidão') ||
           name.includes('certidao') ||
           name.includes('alvará') ||
           name.includes('alvara') ||
           name.includes('laudo');
  });

  console.log(`📊 Encontrados ${stages.length} stages de emissão (de ${allStages.length} total)\n`);

  if (stages.length === 0) {
    console.log('⚠️  Nenhum stage encontrado. Verifique se há protocolos no banco.');
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const stage of stages) {
    try {
      const metadata = (stage.metadata as any) || {};
      const availableTabs: string[] = metadata.availableTabs || [];

      // Se já tem documentos-gerados, pular
      if (availableTabs.includes('documentos-gerados')) {
        console.log(`⏭️  Stage "${stage.stageName}" - já tem documentos-gerados`);
        skipped++;
        continue;
      }

      // Adicionar documentos-gerados após resumo
      let newAvailableTabs: string[];

      if (availableTabs.includes('resumo')) {
        // Inserir após resumo
        const resumoIndex = availableTabs.indexOf('resumo');
        newAvailableTabs = [
          ...availableTabs.slice(0, resumoIndex + 1),
          'documentos-gerados',
          ...availableTabs.slice(resumoIndex + 1)
        ];
      } else if (availableTabs.length === 0) {
        // Se vazio, criar com abas padrão
        newAvailableTabs = ['resumo', 'documentos-gerados', 'comunicacao'];
      } else {
        // Adicionar no início
        newAvailableTabs = ['documentos-gerados', ...availableTabs];
      }

      // Atualizar primaryTab para documentos-gerados se for resumo
      const newPrimaryTab = metadata.primaryTab === 'resumo' ? 'documentos-gerados' : metadata.primaryTab;

      const newMetadata = {
        ...metadata,
        availableTabs: newAvailableTabs,
        primaryTab: newPrimaryTab || 'documentos-gerados'
      };

      // Atualizar no banco usando Prisma ORM
      await prisma.protocolStage.update({
        where: { id: stage.id },
        data: {
          metadata: newMetadata
        }
      });

      console.log(`✅ Stage "${stage.stageName}" - atualizado`);
      console.log(`   Abas: [${newAvailableTabs.join(', ')}]`);
      console.log(`   Primary: ${newPrimaryTab || 'documentos-gerados'}\n`);
      updated++;

    } catch (error) {
      console.error(`❌ Erro ao atualizar stage ${stage.id}:`, error);
    }
  }

  console.log(`\n📈 Resumo:`);
  console.log(`   ✅ Atualizados: ${updated}`);
  console.log(`   ⏭️  Ignorados: ${skipped}`);
  console.log(`   📊 Total: ${stages.length}`);
}

// Executar
updateEmissionStagesDirect()
  .then(() => {
    console.log('\n✅ Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
