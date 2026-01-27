/**
 * Script para atualizar metadados de stages de emissão
 * Adiciona 'documentos-gerados' às abas disponíveis
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateEmissionStages() {
  console.log('🔄 Atualizando stages de emissão...\n');

  // Buscar todos os stages que contêm "Emissão" ou "Emissao" no nome
  const stages = await prisma.protocolStage.findMany({
    where: {
      OR: [
        { stageName: { contains: 'Emissão', mode: 'insensitive' } },
        { stageName: { contains: 'Emissao', mode: 'insensitive' } },
        { stageName: { contains: 'Geração', mode: 'insensitive' } },
        { stageName: { contains: 'Geracao', mode: 'insensitive' } },
        { stageName: { contains: 'Certidão', mode: 'insensitive' } },
        { stageName: { contains: 'Certidao', mode: 'insensitive' } },
        { stageName: { contains: 'Alvará', mode: 'insensitive' } },
        { stageName: { contains: 'Alvara', mode: 'insensitive' } },
        { stageName: { contains: 'Laudo', mode: 'insensitive' } },
        { stageName: { contains: 'Carteira', mode: 'insensitive' } },
        { stageName: { contains: 'Certificado', mode: 'insensitive' } },
        { stageName: { contains: 'Licença', mode: 'insensitive' } },
        { stageName: { contains: 'Licenca', mode: 'insensitive' } },
      ]
    },
    select: {
      id: true,
      protocolId: true,
      stageName: true,
      stageOrder: true,
      status: true,
      metadata: true
    }
  });

  console.log(`📊 Encontrados ${stages.length} stages de emissão\n`);

  let updated = 0;
  let skipped = 0;

  for (const stage of stages) {
    try {
      const metadata = stage.metadata as any || {};
      const availableTabs = metadata.availableTabs || [];

      // Se já tem documentos-gerados, pular
      if (availableTabs.includes('documentos-gerados')) {
        console.log(`⏭️  Stage "${stage.stageName}" (${stage.protocolId}) - já tem documentos-gerados`);
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

      // Atualizar no banco
      await prisma.protocolStage.update({
        where: { id: stage.id },
        data: {
          metadata: {
            ...metadata,
            availableTabs: newAvailableTabs,
            primaryTab: newPrimaryTab || 'documentos-gerados'
          }
        }
      });

      console.log(`✅ Stage "${stage.stageName}" (${stage.protocolId}) - atualizado`);
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
updateEmissionStages()
  .then(() => {
    console.log('\n✅ Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
