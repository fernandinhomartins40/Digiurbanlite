const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 VERIFICAÇÃO FINAL: Departamentos Globais\n');
  
  // 1. Contar departamentos
  const depts = await prisma.department.findMany();
  console.log('✅ Total de departamentos no banco:', depts.length);
  
  if (depts.length !== 14) {
    console.log('⚠️  Esperado: 14 departamentos globais');
  }
  
  // 2. Verificar que nenhum tem tenantId
  const withTenant = depts.filter(d => d.tenantId);
  if (withTenant.length > 0) {
    console.log('❌ ERRO: Departamentos com tenantId encontrados:', withTenant.length);
    withTenant.forEach(d => console.log('  -', d.name, '(tenantId:', d.tenantId + ')'));
  } else {
    console.log('✅ Nenhum departamento tem tenantId (todos globais)');
  }
  
  // 3. Listar departamentos
  console.log('\n📋 Departamentos globais:');
  depts.forEach(d => console.log(`  - ${d.code}: ${d.name}`));
  
  // 4. Verificar serviços
  const services = await prisma.serviceSimplified.findMany({
    select: { tenantId: true, departmentId: true }
  });
  
  const uniqueTenants = [...new Set(services.map(s => s.tenantId))];
  console.log('\n📦 Serviços:');
  console.log('  Total:', services.length);
  console.log('  Tenants únicos:', uniqueTenants.length);
  
  // 5. Verificar se todos os serviços têm departmentId válido
  const invalidDepts = [];
  for (const svc of services) {
    const exists = depts.find(d => d.id === svc.departmentId);
    if (!exists) {
      invalidDepts.push(svc);
    }
  }
  
  if (invalidDepts.length > 0) {
    console.log('❌ Serviços com departmentId inválido:', invalidDepts.length);
  } else {
    console.log('✅ Todos os serviços têm departmentId válido');
  }
  
  console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!\n');
  
  await prisma.$disconnect();
}

verify();
