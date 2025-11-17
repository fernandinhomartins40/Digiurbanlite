/**
 * SEED MODULAR DE SERVIÇOS
 * Importa todos os seeds individuais por secretaria
 */

import { PrismaClient } from '@prisma/client';
import { ServiceDefinition } from './types';
import { generateDefaultWorkflow } from '../../src/services/workflow-template.service';

import { healthServices } from './health.seed';
import { educationServices } from './education.seed';
import { socialServices } from './social.seed';
import { agricultureServices } from './agriculture.seed';
import { cultureServices } from './culture.seed';
import { sportsServices } from './sports.seed';
import { housingServices } from './housing.seed';
import { environmentServices } from './environment.seed';
import { publicWorksServices } from './public-works.seed';
import { urbanPlanningServices } from './urban-planning.seed';
import { publicSafetyServices } from './public-safety.seed';
import { publicServices } from './public-services.seed';
import { tourismServices } from './tourism.seed';

const prisma = new PrismaClient();

/**
 * Todos os serviços consolidados
 */
export const allServices: ServiceDefinition[] = [
  ...healthServices,
  ...educationServices,
  ...socialServices,
  ...agricultureServices,
  ...cultureServices,
  ...sportsServices,
  ...housingServices,
  ...environmentServices,
  ...publicWorksServices,
  ...urbanPlanningServices,
  ...publicSafetyServices,
  ...publicServices,
  ...tourismServices,
];

/**
 * Função principal de seed de serviços
 */
export async function seedServices() {
  console.log('\n📦 Iniciando seed de serviços simplificados...');

  // Buscar departamentos
  const departments = await prisma.department.findMany();

  const departmentMap = new Map(
    departments.map(dept => [dept.code, dept.id])
  );

  let totalCreated = 0;

  for (const serviceDef of allServices) {
    const departmentId = departmentMap.get(serviceDef.departmentCode);

    if (!departmentId) {
      console.warn(`   ⚠️  Departamento ${serviceDef.departmentCode} não encontrado, pulando serviço: ${serviceDef.name}`);
      continue;
    }

    try {
      // Verificar se serviço já existe
      const existing = await prisma.serviceSimplified.findFirst({
        where: {
          name: serviceDef.name,
          departmentId: departmentId
        }
      });

      if (existing) {
        // Atualizar serviço existente
        await prisma.serviceSimplified.update({
          where: { id: existing.id },
          data: {
            description: serviceDef.description,
            serviceType: serviceDef.serviceType,
            moduleType: serviceDef.moduleType,
            formSchema: serviceDef.formSchema || undefined,
            linkedCitizensConfig: serviceDef.linkedCitizensConfig || undefined,
            requiresDocuments: serviceDef.requiresDocuments,
            requiredDocuments: serviceDef.requiredDocuments
              ? JSON.stringify(serviceDef.requiredDocuments)
              : undefined,
            estimatedDays: serviceDef.estimatedDays,
            priority: serviceDef.priority,
            category: serviceDef.category,
            icon: serviceDef.icon,
            color: serviceDef.color,
            isActive: true,
          }
        });
        console.log(`   🔄 ${serviceDef.name} (atualizado)`);
      } else {
        // Criar novo serviço
        await prisma.serviceSimplified.create({
          data: {
            name: serviceDef.name,
            description: serviceDef.description,
            departmentId,
            serviceType: serviceDef.serviceType,
            moduleType: serviceDef.moduleType,
            formSchema: serviceDef.formSchema || undefined,
            linkedCitizensConfig: serviceDef.linkedCitizensConfig || undefined,
            requiresDocuments: serviceDef.requiresDocuments,
            requiredDocuments: serviceDef.requiredDocuments
              ? JSON.stringify(serviceDef.requiredDocuments)
              : undefined,
            estimatedDays: serviceDef.estimatedDays,
            priority: serviceDef.priority,
            category: serviceDef.category,
            icon: serviceDef.icon,
            color: serviceDef.color,
            isActive: true,
          }
        });
        totalCreated++;
        console.log(`   ✅ ${serviceDef.name}`);
      }
    } catch (error: any) {
      console.error(`   ❌ Erro ao processar serviço ${serviceDef.name}:`, error.message);
    }
  }

  console.log(`\n✅ Seed de serviços concluído: ${totalCreated} serviços criados`);
  return totalCreated;
}

// Executar seed se chamado diretamente
if (require.main === module) {
  seedServices()
    .then(() => {
      console.log('✅ Seed executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar seed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
