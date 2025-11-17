const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const dept = await prisma.department.findFirst({
    where: { code: 'AGRICULTURA' }
  });

  console.log('Departamento Agricultura:', dept ? dept.id : 'NÃO ENCONTRADO');

  if (dept) {
    const services = await prisma.serviceSimplified.findMany({
      where: { departmentId: dept.id },
      select: { id: true, name: true, moduleType: true, serviceType: true }
    });

    console.log('\nServiços encontrados:', services.length);
    services.forEach(s => {
      console.log('  -', s.name);
      console.log('    moduleType:', s.moduleType);
      console.log('    serviceType:', s.serviceType);
    });
  }

  await prisma.$disconnect();
}

check();
