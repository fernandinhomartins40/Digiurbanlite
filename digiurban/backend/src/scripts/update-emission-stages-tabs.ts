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

      const normalizedTabs = availableTabs.map((tab: string) => {
        if (tab === 'generated' || tab === 'document-generation') return 'documentos-gerados';
        if (tab === 'send') return 'enviar';
        if (tab === 'documents') return 'documentos';
        if (tab === 'communication') return 'comunicacao';
        if (tab === 'location') return 'dados';
        if (tab === 'photos') return 'documentos';
        return tab;
      });

      const dedupedTabs = normalizedTabs.filter((tab: string, index: number) => normalizedTabs.indexOf(tab) === index);

      // Se já tem o conjunto atualizado, pular
      if (dedupedTabs.includes('documentos-gerados') && dedupedTabs.includes('enviar')) {
        console.log(`⏭️  Stage "${stage.stageName}" (${stage.protocolId}) - já está com abas de emissão atualizadas`);
        skipped++;
        continue;
      }

      // Adicionar documentos-gerados após resumo
      let newAvailableTabs: string[];

      if (dedupedTabs.includes('resumo')) {
        // Inserir após resumo
        const resumoIndex = dedupedTabs.indexOf('resumo');
        newAvailableTabs = [
          ...dedupedTabs.slice(0, resumoIndex + 1),
          'documentos-gerados',
          'enviar',
          ...dedupedTabs
            .slice(resumoIndex + 1)
            .filter((tab: string) => tab !== 'documentos-gerados' && tab !== 'enviar')
        ];
      } else if (dedupedTabs.length === 0) {
        // Se vazio, criar com abas padrão
        newAvailableTabs = ['resumo', 'documentos-gerados', 'enviar', 'comunicacao'];
      } else {
        // Adicionar no início
        newAvailableTabs = [
          'documentos-gerados',
          'enviar',
          ...dedupedTabs.filter((tab: string) => tab !== 'documentos-gerados' && tab !== 'enviar')
        ];
      }

      const rawPrimaryTab = typeof metadata.primaryTab === 'string' ? metadata.primaryTab : '';
      const normalizedPrimaryTab =
        rawPrimaryTab === 'generated' || rawPrimaryTab === 'document-generation'
          ? 'documentos-gerados'
          : rawPrimaryTab === 'send'
            ? 'enviar'
            : rawPrimaryTab === 'location'
              ? 'dados'
              : rawPrimaryTab || 'documentos-gerados';
      const newPrimaryTab =
        normalizedPrimaryTab === 'resumo' || !newAvailableTabs.includes(normalizedPrimaryTab)
          ? 'documentos-gerados'
          : normalizedPrimaryTab;

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
