const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listComDados() {
  const services = await prisma.serviceSimplified.findMany({
    where: {
      isActive: true,
      serviceType: 'COM_DADOS'
    },
    include: { department: true },
    orderBy: [{ department: { name: 'asc' }}, { name: 'asc' }]
  });

  const byDept = {};
  services.forEach(s => {
    const dept = s.department?.name || 'Sem Departamento';
    if (!byDept[dept]) byDept[dept] = [];
    byDept[dept].push({ nome: s.name, modulo: s.moduleType });
  });

  console.log('\n📊 SERVIÇOS COM_DADOS POR DEPARTAMENTO:\n');
  let total = 0;
  Object.entries(byDept).forEach(([dept, servs]) => {
    console.log(`\n${dept} (${servs.length} serviços):`);
    servs.forEach(s => console.log(`   - ${s.nome} [${s.modulo || 'SEM moduleType'}]`));
    total += servs.length;
  });

  console.log(`\n\n📈 TOTAL DE SERVIÇOS COM_DADOS: ${total}`);

  await prisma.$disconnect();
}

listComDados().catch(console.error);
