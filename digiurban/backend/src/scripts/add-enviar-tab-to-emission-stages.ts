/**
 * Script para adicionar a aba 'enviar' aos stages de emissão
 * que já possuem 'documentos-gerados' mas não possuem 'enviar'
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addEnviarTabToEmissionStages() {
  console.log('🔄 Adicionando aba "enviar" aos stages de emissão...\n');

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

  // Filtrar stages de emissão que têm documentos-gerados mas não têm enviar
  const stages = allStages.filter(stage => {
    const metadata = stage.metadata as any || {};
    const availableTabs: string[] = metadata.availableTabs || [];

    const name = stage.stageName.toLowerCase();
    const isEmissionStage = name.includes('emissão') ||
           name.includes('emissao') ||
           name.includes('geração') ||
           name.includes('geracao') ||
           name.includes('certidão') ||
           name.includes('certidao') ||
           name.includes('alvará') ||
           name.includes('alvara') ||
           name.includes('laudo');

    const hasDocumentosGerados = availableTabs.includes('documentos-gerados');
    const hasEnviar = availableTabs.includes('enviar');

    return isEmissionStage && hasDocumentosGerados && !hasEnviar;
  });

  console.log(`📊 Encontrados ${stages.length} stages que precisam da aba "enviar" (de ${allStages.length} total)\n`);

  if (stages.length === 0) {
    console.log('✅ Todos os stages de emissão já possuem a aba "enviar".');
    return;
  }

  let updated = 0;

  for (const stage of stages) {
    try {
      const metadata = stage.metadata as any || {};
      const availableTabs: string[] = metadata.availableTabs || [];

      // Adicionar 'enviar' após 'documentos-gerados'
      let newAvailableTabs: string[];

      const docGeradosIndex = availableTabs.indexOf('documentos-gerados');
      if (docGeradosIndex !== -1) {
        // Inserir 'enviar' após 'documentos-gerados'
        newAvailableTabs = [
          ...availableTabs.slice(0, docGeradosIndex + 1),
          'enviar',
          ...availableTabs.slice(docGeradosIndex + 1)
        ];
      } else {
        // Caso não tenha documentos-gerados (não deveria acontecer com o filtro), adicionar no final
        newAvailableTabs = [...availableTabs, 'enviar'];
      }

      const newMetadata = {
        ...metadata,
        availableTabs: newAvailableTabs
      };

      // Atualizar no banco
      await prisma.protocolStage.update({
        where: { id: stage.id },
        data: {
          metadata: newMetadata
        }
      });

      console.log(`✅ Stage "${stage.stageName}" (${stage.protocolId}) - atualizado`);
      console.log(`   Abas: [${newAvailableTabs.join(', ')}]\n`);
      updated++;

    } catch (error) {
      console.error(`❌ Erro ao atualizar stage ${stage.id}:`, error);
    }
  }

  console.log(`\n📈 Resumo:`);
  console.log(`   ✅ Atualizados: ${updated}`);
  console.log(`   📊 Total: ${stages.length}`);
}

// Executar
addEnviarTabToEmissionStages()
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
