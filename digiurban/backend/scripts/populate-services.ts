#!/usr/bin/env tsx
/**
 * SCRIPT: Popular serviços em tenants existentes
 *
 * Uso:
 *   npm run populate-services <tenantId>
 *   npm run populate-services all
 */

import { PrismaClient } from '@prisma/client';
import { seedServices } from '../src/seeds/services-simplified-complete';

const prisma = new PrismaClient();

async function main() {
  const tenantIdArg = process.argv[2];

  if (!tenantIdArg) {
    console.error('❌ Erro: Forneça um tenantId ou "all"');
    console.log('\nUso:');
    console.log('  npm run populate-services <tenantId>');
    console.log('  npm run populate-services all');
    console.log('\nExemplo:');
    console.log('  npm run populate-services demo');
    console.log('  npm run populate-services all');
    process.exit(1);
  }

  try {
    if (tenantIdArg === 'all') {
      // Popular serviços para TODOS os tenants
      const tenants = await prisma.tenant.findMany({
        where: {
          id: {
            not: 'clzunassigned000000000000000', // Pular pool global
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      console.log(`\n📋 Populando serviços para ${tenants.length} tenants...\n`);

      for (const tenant of tenants) {
        console.log(`\n🏢 Tenant: ${tenant.name} (${tenant.id})`);

        // Verificar se já tem serviços
        const servicesCount = await prisma.serviceSimplified.count({
          where: { tenantId: tenant.id },
        });

        if (servicesCount > 0) {
          console.log(`   ⏭️  Já possui ${servicesCount} serviços. Pulando...`);
          continue;
        }

        // Popular serviços
        const created = await seedServices(tenant.id);

        console.log(`   ✅ ${created} serviços criados com sucesso`);
      }

      console.log('\n✅ Processo concluído!\n');
    } else {
      // Popular serviços para um tenant específico
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantIdArg },
        select: { id: true, name: true },
      });

      if (!tenant) {
        console.error(`❌ Tenant não encontrado: ${tenantIdArg}`);
        process.exit(1);
      }

      console.log(`\n🏢 Populando serviços para: ${tenant.name} (${tenant.id})\n`);

      // Verificar departamentos
      const departmentsCount = await prisma.department.count({
        where: { tenantId: tenant.id, isActive: true },
      });

      if (departmentsCount === 0) {
        console.error('❌ Erro: Este tenant não possui departamentos ativos.');
        console.log('   Crie departamentos primeiro antes de popular serviços.');
        process.exit(1);
      }

      console.log(`   📁 ${departmentsCount} departamentos encontrados`);

      // Popular serviços
      const created = await seedServices(tenant.id);

      console.log(`\n✅ ${created} serviços criados com sucesso\n`);
    }
  } catch (error) {
    console.error('❌ Erro ao popular serviços:', error);
    process.exit(1);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
