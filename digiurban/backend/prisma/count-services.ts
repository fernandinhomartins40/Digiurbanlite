import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countServices() {
  const count = await prisma.serviceSimplified.count();
  console.log(`\n📊 Total de serviços no banco: ${count}`);

  // Contar por departamento
  const departments = await prisma.department.findMany({
    include: {
      _count: {
        select: { servicesSimplified: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log('\n📋 Serviços por departamento:\n');
  for (const dept of departments) {
    if (dept._count.servicesSimplified > 0) {
      console.log(`   ${dept.name.padEnd(30)} : ${dept._count.servicesSimplified} serviços`);
    }
  }

  await prisma.$disconnect();
}

countServices();
