const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeServicesAndWorkflows() {
  try {
    // Buscar todos os serviços
    const services = await prisma.serviceSimplified.findMany({
      select: {
        id: true,
        name: true,
        moduleType: true,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });

    // Buscar todos os workflows
    const workflows = await prisma.moduleWorkflow.findMany({
      select: {
        id: true,
        name: true,
        moduleType: true,
        defaultSLA: true,
        stages: true
      },
      orderBy: { moduleType: 'asc' }
    });

    console.log('='.repeat(80));
    console.log('ANÁLISE: SERVIÇOS vs WORKFLOWS');
    console.log('='.repeat(80));
    console.log();

    // Agrupar serviços por moduleType
    const servicesByModule = {};
    services.forEach(s => {
      const module = s.moduleType || 'SEM_MODULO';
      if (!servicesByModule[module]) {
        servicesByModule[module] = [];
      }
      servicesByModule[module].push(s);
    });

    // Criar mapa de workflows
    const workflowsByModule = {};
    workflows.forEach(w => {
      workflowsByModule[w.moduleType] = w;
    });

    console.log('📊 RESUMO:');
    console.log(`Total de Serviços: ${services.length}`);
    console.log(`Total de Workflows: ${workflows.length}`);
    console.log();

    console.log('='.repeat(80));
    console.log('SERVIÇOS POR MÓDULO:');
    console.log('='.repeat(80));
    console.log();

    const moduleTypes = Object.keys(servicesByModule).sort();
    const missingWorkflows = [];

    for (const moduleType of moduleTypes) {
      const servicesInModule = servicesByModule[moduleType];
      const workflow = workflowsByModule[moduleType];

      const hasWorkflow = !!workflow;
      const status = hasWorkflow ? '✅ TEM WORKFLOW' : '❌ SEM WORKFLOW';

      console.log(`${status} | ${moduleType}`);
      console.log(`   Serviços (${servicesInModule.length}):`);

      servicesInModule.forEach(s => {
        const active = s.isActive ? '🟢' : '🔴';
        console.log(`      ${active} ${s.name}`);
      });

      if (hasWorkflow) {
        const stagesCount = Array.isArray(workflow.stages) ? workflow.stages.length : 0;
        console.log(`   Workflow: ${workflow.name}`);
        console.log(`   SLA Padrão: ${workflow.defaultSLA || 'N/A'} dias úteis`);
        console.log(`   Etapas: ${stagesCount}`);
      } else {
        console.log(`   ⚠️  NECESSÁRIO CRIAR WORKFLOW!`);
        missingWorkflows.push({
          moduleType,
          servicesCount: servicesInModule.length,
          services: servicesInModule.map(s => s.name)
        });
      }

      console.log();
    }

    console.log('='.repeat(80));
    console.log('WORKFLOWS DISPONÍVEIS:');
    console.log('='.repeat(80));
    console.log();

    workflows.forEach(w => {
      const servicesCount = servicesByModule[w.moduleType]?.length || 0;
      const stagesCount = Array.isArray(w.stages) ? w.stages.length : 0;
      console.log(`📋 ${w.name}`);
      console.log(`   Módulo: ${w.moduleType}`);
      console.log(`   SLA: ${w.defaultSLA || 'N/A'} dias úteis`);
      console.log(`   Etapas: ${stagesCount}`);
      console.log(`   Serviços usando: ${servicesCount}`);
      console.log();
    });

    if (missingWorkflows.length > 0) {
      console.log('='.repeat(80));
      console.log('⚠️  MÓDULOS SEM WORKFLOW (NECESSÁRIO CRIAR):');
      console.log('='.repeat(80));
      console.log();

      missingWorkflows.forEach(m => {
        console.log(`❌ ${m.moduleType}`);
        console.log(`   ${m.servicesCount} serviço(s) afetado(s)`);
        console.log();
      });
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeServicesAndWorkflows();
