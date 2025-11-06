import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  try {
    // Buscar tenant
    const tenant = await prisma.tenant.findFirst();
    console.log('✅ Tenant ID:', tenant?.id);
    console.log('   Nome:', tenant?.name);

    // Buscar department AGRICULTURA
    const dept = await prisma.department.findFirst({
      where: {
        tenantId: tenant?.id,
        code: 'AGRICULTURA'
      }
    });
    console.log('\n✅ Department AGRICULTURA:', dept ? 'EXISTE' : 'NÃO EXISTE');
    if (dept) {
      console.log('   ID:', dept.id);
      console.log('   Nome:', dept.name);
    }

    // Contar services
    if (dept) {
      const services = await prisma.service.findMany({
        where: {
          tenantId: tenant?.id,
          departmentId: dept.id
        },
        select: {
          id: true,
          name: true,
          moduleType: true,
          moduleEntity: true,
        }
      });
      console.log('\n✅ Services AGRICULTURA:', services.length);
      services.forEach(s => {
        console.log(`   - ${s.name} (${s.moduleType ? '✅ Motor' : '❌ Sem motor'})`);
      });
    }

    // Contar templates
    const templates = await prisma.serviceTemplate.findMany({
      where: { moduleType: 'agriculture' },
      select: {
        code: true,
        name: true,
        moduleEntity: true,
      }
    });
    console.log('\n✅ Templates AGRICULTURA:', templates.length);
    templates.forEach(t => {
      console.log(`   - ${t.code}: ${t.name} → ${t.moduleEntity}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
