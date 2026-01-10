const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeServices() {
  const services = await prisma.serviceSimplified.findMany({
    where: { isActive: true },
    include: { department: true },
    orderBy: [{ department: { name: 'asc' }}, { name: 'asc' }]
  });

  const byDepartment = {};

  services.forEach(s => {
    const dept = s.department?.name || 'Sem Departamento';
    if (!byDepartment[dept]) byDepartment[dept] = [];
    byDepartment[dept].push({
      nome: s.name,
      tipo: s.serviceType,
      modulo: s.moduleType
    });
  });

  console.log('\n📊 SERVIÇOS POR DEPARTAMENTO:\n');
  Object.entries(byDepartment).forEach(([dept, servs]) => {
    console.log(`\n📁 ${dept} (${servs.length} serviços)`);
    servs.forEach(s => {
      console.log(`   - ${s.nome} [${s.tipo || 'N/A'}] [${s.modulo || 'N/A'}]`);
    });
  });

  console.log('\n\n📈 RESUMO:');
  Object.entries(byDepartment).forEach(([dept, servs]) => {
    console.log(`   ${dept}: ${servs.length} serviços`);
  });

  await prisma.$disconnect();
}

analyzeServices().catch(console.error);
