/**
 * ============================================================================
 * SERVICE WORKFLOW SEED SERVICE
 * ============================================================================
 *
 * Lógica de seed de workflows extraída para o código do backend
 * para funcionar em produção (build compilado)
 */

import { prisma } from '../lib/prisma';
import * as serviceWorkflowService from './service-workflow.service';
import { generateCompleteWorkflowBySubtype } from './workflow-template.service';
import {
  resolveServiceSubtype,
  shouldAutoCreateWorkflow,
} from './service-creation-policy.service';

/**
 * Criar workflows para todos os serviços sem workflow
 * ✅ SISTEMA UNIFICADO: Usa generateCompleteWorkflowBySubtype() baseado em 4 subtipos
 */
export async function seedAllServiceWorkflows() {
  console.log('🌱 [UNIFICADO] Criando workflows para serviços sem workflow...');
  console.log('   → Usando geração por SUBTIPO (🔵🟢🔴🟡)');

  let created = 0;
  let skipped = 0;
  let errors = 0;

  // Buscar todos os serviços ativos
  const services = await prisma.serviceSimplified.findMany({
    where: {
      isActive: true
    },
    include: {
      department: true
    }
  });

  console.log(`   → Encontrados ${services.length} serviços ativos`);

  // Processar cada serviço
  for (const service of services) {
    try {
      // Verificar se já tem workflow
      const existingWorkflow = await prisma.serviceWorkflow.findUnique({
        where: { serviceId: service.id }
      });

      if (existingWorkflow) {
        console.log(`   ⏭️  ${service.name} - já possui workflow`);
        skipped++;
        continue;
      }

      const resolvedSubtype =
        service.serviceType === 'SEM_DADOS'
          ? resolveServiceSubtype({
              serviceType: service.serviceType,
              serviceSubtype: service.serviceSubtype,
              name: service.name,
              description: service.description,
              category: (service as any).category,
              requiresDocuments: (service as any).requiresDocuments,
              requiredDocuments: service.requiredDocuments,
              formSchema: service.formSchema,
              moduleType: service.moduleType,
            })
          : service.serviceSubtype || 'SOLICITACAO_SIMPLES';

      if (!shouldAutoCreateWorkflow(service.serviceType, resolvedSubtype)) {
        console.log(`   ⏭️  ${service.name} - modo ${resolvedSubtype} não requer workflow`);
        skipped++;
        continue;
      }

      // ✅ SISTEMA UNIFICADO: Gerar workflow baseado no subtipo
      const workflowData = generateCompleteWorkflowBySubtype({
        ...service,
        serviceSubtype: resolvedSubtype,
      } as any);

      // Adicionar serviceId ao workflowData
      const completeWorkflowData = {
        serviceId: service.id,
        ...workflowData
      };

      // Criar o workflow usando o service
      await serviceWorkflowService.createServiceWorkflow(completeWorkflowData);

      const subtype = resolvedSubtype;
      const subtypeIcon = {
        'CAPTURA_COMPLETA': '🔵',
        'SOLICITACAO_SIMPLES': '🟢',
        'PAGAMENTO': '🔴',
        'CONSULTIVO': '🟡',
        'CONSULTA_PUBLICA': '⚪',
        'CONSULTA_AUTENTICADA': '🟣',
        'EMISSAO_AUTOMATICA': '🟠',
        'EMISSAO_ASSISTIDA': '🟤',
      }[subtype] || '⚪';

      console.log(`   ✅ ${service.name} - workflow ${subtypeIcon} ${subtype} (${workflowData.stages.length} etapas)`);
      created++;
    } catch (error) {
      console.error(`   ❌ Erro ao processar ${service.name}:`, error);
      errors++;
    }
  }

  console.log(`\n✅ ServiceWorkflows UNIFICADOS: ${created} criados, ${skipped} já existiam, ${errors} erros`);
  return { created, skipped, errors };
}
