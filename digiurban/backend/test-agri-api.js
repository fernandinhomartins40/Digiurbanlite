const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDirectQuery() {
  console.log('=== TESTE DIRETO NO BANCO ===\n');

  // 1. Buscar tenant do prefeito
  const admin = await prisma.adminUser.findFirst({
    where: { email: 'prefeito@palmital.gov.br' },
    include: { tenant: true }
  });

  if (!admin) {
    console.log('❌ Admin não encontrado');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ Admin encontrado:', admin.name);
  console.log('✅ Tenant:', admin.tenant.name, '(ID:', admin.tenantId, ')');

  // 2. Buscar departamento de agricultura
  const dept = await prisma.department.findFirst({
    where: {
      tenantId: admin.tenantId,
      code: 'AGRICULTURA'
    }
  });

  if (!dept) {
    console.log('❌ Departamento AGRICULTURA não encontrado');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ Departamento AGRICULTURA:', dept.name, '(ID:', dept.id, ')');

  // 3. Buscar serviços
  const services = await prisma.serviceSimplified.findMany({
    where: {
      tenantId: admin.tenantId,
      departmentId: dept.id,
      isActive: true
    },
    orderBy: { name: 'asc' }
  });

  console.log('\n=== SERVIÇOS ENCONTRADOS:', services.length, '===\n');

  services.forEach((s, i) => {
    console.log(`${i + 1}. ${s.name}`);
    console.log(`   ID: ${s.id}`);
    console.log(`   moduleType: ${s.moduleType || 'null'}`);
    console.log(`   serviceType: ${s.serviceType}`);
    console.log(`   isActive: ${s.isActive}`);
    console.log('');
  });

  // 4. Verificar especificamente CADASTRO_PRODUTOR
  const cadastroService = services.find(s => s.moduleType === 'CADASTRO_PRODUTOR');

  if (cadastroService) {
    console.log('✅ Serviço CADASTRO_PRODUTOR encontrado!');
    console.log('   Nome:', cadastroService.name);
    console.log('   ID:', cadastroService.id);
  } else {
    console.log('❌ Serviço CADASTRO_PRODUTOR NÃO encontrado');
  }

  await prisma.$disconnect();
}

testDirectQuery().catch(console.error);
