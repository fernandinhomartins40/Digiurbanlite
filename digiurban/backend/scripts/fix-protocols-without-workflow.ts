/**
 * ============================================================================
 * SCRIPT: Corrigir Protocolos Sem Workflow
 * ============================================================================
 *
 * Este script identifica e corrige protocolos antigos que foram criados
 * SEM workflow/stages devido a falhas na criação.
 *
 * Uso: npx tsx scripts/fix-protocols-without-workflow.ts
 */

import { PrismaClient } from '@prisma/client';
import * as ServiceWorkflowService from '../src/services/service-workflow.service';
import * as SLAService from '../src/services/protocol-sla.service';

const prisma = new PrismaClient();

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🔧 CORRIGIR PROTOCOLOS SEM WORKFLOW                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Buscar TODOS os protocolos
    console.log('1️⃣  Buscando protocolos...');
    const protocols = await prisma.protocolSimplified.findMany({
      include: {
        stages: true,
        sla: true,
        service: true
      }
    });

    console.log(`   ✅ Encontrados ${protocols.length} protocolos no total\n`);

    // 2. Identificar protocolos SEM stages
    const protocolsWithoutStages = protocols.filter(p => p.stages.length === 0);

    if (protocolsWithoutStages.length === 0) {
      console.log('✅ Todos os protocolos têm workflow! Nada a fazer.\n');
      return;
    }

    console.log(`2️⃣  Identificados ${protocolsWithoutStages.length} protocolos SEM stages:\n`);
    protocolsWithoutStages.forEach(p => {
      console.log(`   📋 ${p.number} - ${p.service.name} (ID: ${p.id})`);
    });

    console.log('\n3️⃣  Iniciando correção...\n');

    let fixed = 0;
    let failed = 0;

    for (const protocol of protocolsWithoutStages) {
      try {
        console.log(`   🔧 Corrigindo protocolo ${protocol.number}...`);

        // Tentar aplicar workflow
        const stages = await ServiceWorkflowService.applyWorkflowToProtocol(protocol.id);

        if (!stages || stages.length === 0) {
          console.error(`   ❌ Serviço "${protocol.service.name}" não tem workflow configurado`);
          failed++;
          continue;
        }

        console.log(`   ✓ Workflow aplicado: ${stages.length} stage(s)`);

        // Se não tem SLA, criar
        if (!protocol.sla) {
          const sla = await SLAService.createProtocolSLA(protocol.id);
          console.log(`   ✓ SLA criado`);
        }

        fixed++;
        console.log(`   ✅ Protocolo ${protocol.number} corrigido!\n`);

      } catch (error) {
        console.error(`   ❌ Erro ao corrigir protocolo ${protocol.number}:`, error instanceof Error ? error.message : error);
        failed++;
      }
    }

    // 4. Resumo final
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  📊 RESUMO DA CORREÇÃO                                ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log(`   Total de protocolos analisados: ${protocols.length}`);
    console.log(`   Protocolos sem workflow: ${protocolsWithoutStages.length}`);
    console.log(`   ✅ Corrigidos com sucesso: ${fixed}`);
    console.log(`   ❌ Falharam: ${failed}`);
    console.log('');

    if (failed > 0) {
      console.log('⚠️  Alguns protocolos não puderam ser corrigidos.');
      console.log('   Verifique se os serviços têm workflows configurados.\n');
    }

  } catch (error) {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
