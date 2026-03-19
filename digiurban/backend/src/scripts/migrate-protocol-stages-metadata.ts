/**
 * ============================================================================
 * MIGRAÇÃO: Atualizar Metadados de ProtocolStages com Dados dos Workflows
 * ============================================================================
 *
 * Este script atualiza todos os ProtocolStages existentes para incluir os
 * metadados de UI (availableTabs, primaryTab, etc.) vindos dos templates
 * de workflow.
 *
 * QUANDO EXECUTAR:
 * - Após atualizar os seeds de workflows com novos metadados
 * - Para corrigir protocolos existentes sem metadados completos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LEGACY_WORKFLOW_TAB_MAP: Record<string, string> = {
  generated: 'documentos-gerados',
  'document-generation': 'documentos-gerados',
  send: 'enviar',
  documents: 'documentos',
  communication: 'comunicacao',
  involved: 'envolvidos',
  location: 'dados',
  photos: 'documentos'
};

function normalizeTabs(value: unknown, fallback: string[] = ['resumo', 'comunicacao']): string[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const seen = new Set<string>();
  const normalized = value
    .map(tab => (typeof tab === 'string' ? (LEGACY_WORKFLOW_TAB_MAP[tab.trim()] || tab.trim()) : null))
    .filter((tab): tab is string => Boolean(tab))
    .filter(tab => {
      if (seen.has(tab)) return false;
      seen.add(tab);
      return true;
    });

  return normalized.length > 0 ? normalized : [...fallback];
}

function normalizePrimaryTab(primaryTab: unknown, availableTabs: string[]): string {
  if (typeof primaryTab === 'string' && primaryTab.trim()) {
    const normalized = LEGACY_WORKFLOW_TAB_MAP[primaryTab.trim()] || primaryTab.trim();
    if (availableTabs.includes(normalized)) {
      return normalized;
    }
  }

  return availableTabs[0] || 'resumo';
}

interface WorkflowStage {
  id: string;
  name: string;
  order: number;
  description?: string;
  slaDays?: number;
  requiredInputFieldIds?: string[];
  requiredStageOutputs?: string[];
  requiredDocumentTypes?: string[];
  allowedActions?: string[];
  availableTabs?: string[];
  primaryTab?: string;
  canSkip?: boolean;
  [key: string]: any;
}

function isReceptionStage(stage: WorkflowStage | null | undefined, stageName?: string): boolean {
  const stageType = typeof stage?.stageType === 'string' ? stage.stageType.trim() : '';
  if (stageType === 'RECEPTION') {
    return true;
  }

  const normalizedStageName = typeof stageName === 'string' ? stageName.toLowerCase() : '';
  return normalizedStageName.includes('recep') || normalizedStageName.includes('receb');
}

async function migrateProtocolStagesMetadata() {
  console.log('\n🔄 Iniciando migração de metadados de ProtocolStages...\n');

  let protocolsProcessed = 0;
  let stagesUpdated = 0;
  let stagesSkipped = 0;
  let errors = 0;

  try {
    // 1. Buscar todos os protocolos ativos (não concluídos/cancelados)
    const protocols = await prisma.protocolSimplified.findMany({
      where: {
        status: {
          notIn: ['CONCLUIDO', 'CANCELADO']
        }
      },
      include: {
        service: {
          include: {
            workflow: true
          }
        },
        stages: true
      }
    });

    console.log(`📋 Encontrados ${protocols.length} protocolos para processar\n`);

    // 2. Processar cada protocolo
    for (const protocol of protocols) {
      try {
        protocolsProcessed++;

        // Verificar se serviço tem workflow
        if (!protocol.service.workflow) {
          console.log(`⚠️  Protocolo ${protocol.number}: Serviço sem workflow - pulando`);
          continue;
        }

        const workflowStages = protocol.service.workflow.stages as any as WorkflowStage[];

        if (!workflowStages || workflowStages.length === 0) {
          console.log(`⚠️  Protocolo ${protocol.number}: Workflow sem stages - pulando`);
          continue;
        }

        console.log(`\n📦 Processando protocolo ${protocol.number} (${protocol.service.name})`);
        console.log(`   Workflow: ${protocol.service.workflow.name}`);
        console.log(`   Stages no protocolo: ${protocol.stages.length}`);

        // 3. Atualizar cada stage do protocolo com metadados do template
        for (const protocolStage of protocol.stages) {
          try {
            // Encontrar stage correspondente no workflow template
            const templateStage = workflowStages.find(
              ws => ws.order === protocolStage.stageOrder || ws.name === protocolStage.stageName
            );

            if (!templateStage) {
              console.log(`   ⚠️  Stage "${protocolStage.stageName}" não encontrada no template - pulando`);
              stagesSkipped++;
              continue;
            }

            // Verificar se já tem metadados completos
            const currentMetadata = (protocolStage.metadata as any) || {};
            const hasAvailableTabs = currentMetadata.availableTabs && currentMetadata.availableTabs.length > 0;
            const hasPrimaryTab = !!currentMetadata.primaryTab;

            if (hasAvailableTabs && hasPrimaryTab) {
              console.log(`   ✓ Stage "${protocolStage.stageName}" já tem metadados completos - pulando`);
              stagesSkipped++;
              continue;
            }

            // Construir metadados atualizados
            const availableTabs = normalizeTabs(templateStage.availableTabs);
            const primaryTab = normalizePrimaryTab(templateStage.primaryTab, availableTabs);

            const isReception = isReceptionStage(templateStage, protocolStage.stageName);
            const updatedMetadata = {
              ...currentMetadata,

              // Atualizar informações básicas
              stageId: templateStage.id,
              description: templateStage.description || currentMetadata.description,

              // ✅ ADICIONAR METADADOS DE UI
              availableTabs,
              primaryTab,

              // Atualizar requisitos
              requiredDocumentTypes: isReception ? [] : templateStage.requiredDocumentTypes || [],
              requiredInputFieldIds: isReception
                ? []
                : templateStage.requiredInputFieldIds ||
                  currentMetadata.requiredInputFieldIds ||
                  [],
              requiredStageOutputs: isReception
                ? []
                : templateStage.requiredStageOutputs ||
                  currentMetadata.requiredStageOutputs ||
                  [],

              // Atualizar ações
              allowedActions: templateStage.allowedActions || currentMetadata.allowedActions || [],
              canSkip: templateStage.canSkip !== undefined ? templateStage.canSkip : currentMetadata.canSkip || false,

              // Manter outros campos existentes
              skipCondition: currentMetadata.skipCondition,
              role: templateStage.role || currentMetadata.role,
              department: templateStage.department || currentMetadata.department,
              requiresApproval: templateStage.requiresApproval !== undefined
                ? templateStage.requiresApproval
                : currentMetadata.requiresApproval
            };

            // Atualizar no banco
            await prisma.protocolStage.update({
              where: { id: protocolStage.id },
              data: {
                metadata: updatedMetadata
              }
            });

            stagesUpdated++;
            console.log(`   ✅ Stage "${protocolStage.stageName}" atualizada`);
            console.log(`      → Tabs: ${updatedMetadata.availableTabs.join(', ')}`);
            console.log(`      → Primary: ${updatedMetadata.primaryTab}`);

          } catch (stageError: any) {
            console.error(`   ❌ Erro ao atualizar stage "${protocolStage.stageName}":`, stageError.message);
            errors++;
          }
        }

      } catch (protocolError: any) {
        console.error(`❌ Erro ao processar protocolo ${protocol.number}:`, protocolError.message);
        errors++;
      }
    }

    // Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRAÇÃO CONCLUÍDA\n');
    console.log(`📊 Estatísticas:`);
    console.log(`   • Protocolos processados: ${protocolsProcessed}`);
    console.log(`   • Stages atualizadas: ${stagesUpdated}`);
    console.log(`   • Stages puladas: ${stagesSkipped}`);
    console.log(`   • Erros: ${errors}`);
    console.log('='.repeat(60) + '\n');

  } catch (error: any) {
    console.error('\n❌ ERRO CRÍTICO na migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  migrateProtocolStagesMetadata()
    .then(() => {
      console.log('✅ Script de migração executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha ao executar script de migração:', error);
      process.exit(1);
    });
}

export { migrateProtocolStagesMetadata };
