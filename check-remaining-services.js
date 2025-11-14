const { PrismaClient } = require('./digiurban/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkServices() {
  console.log('🔍 VERIFICANDO SERVIÇOS RESTANTES NO BANCO\n');

  try {
    // Total de serviços
    const totalServices = await prisma.serviceSimplified.count();
    console.log(`📊 Total de serviços: ${totalServices}`);

    // Serviços COM_DADOS
    const comDadosServices = await prisma.serviceSimplified.count({
      where: { serviceType: 'COM_DADOS' }
    });
    console.log(`📋 Serviços COM_DADOS: ${comDadosServices}`);

    // Serviços COM_DADOS com moduleType
    const comDadosComModule = await prisma.serviceSimplified.count({
      where: {
        serviceType: 'COM_DADOS',
        moduleType: { not: null }
      }
    });
    console.log(`🎯 Serviços COM_DADOS com moduleType: ${comDadosComModule}`);

    // Listar serviços COM_DADOS com moduleType
    if (comDadosComModule > 0) {
      console.log('\n📋 Lista de serviços COM_DADOS com moduleType:\n');
      const services = await prisma.serviceSimplified.findMany({
        where: {
          serviceType: 'COM_DADOS',
          moduleType: { not: null }
        },
        select: {
          id: true,
          name: true,
          moduleType: true,
          department: {
            select: { name: true }
          }
        }
      });

      services.forEach((s, i) => {
        console.log(`${i + 1}. ${s.name}`);
        console.log(`   Departamento: ${s.department.name}`);
        console.log(`   ModuleType: ${s.moduleType}`);
        console.log('');
      });
    }

    // Serviços por departamento
    console.log('\n📊 Serviços por secretaria:');
    const byDept = await prisma.serviceSimplified.groupBy({
      by: ['departmentId'],
      _count: true,
      where: { isActive: true }
    });

    for (const dept of byDept) {
      const department = await prisma.department.findUnique({
        where: { id: dept.departmentId }
      });
      console.log(`   ${department?.name}: ${dept._count} serviços`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkServices();
