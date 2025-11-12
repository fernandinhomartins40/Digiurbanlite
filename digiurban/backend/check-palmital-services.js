const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Buscar tenant Palmital
    const tenant = await prisma.tenant.findFirst({
      where: {
        name: { contains: 'Palmital' }
      }
    });

    if (!tenant) {
      console.log('❌ Tenant Palmital não encontrado');
      return;
    }

    console.log('✅ Tenant:', tenant.name);
    console.log('   ID:', tenant.id);

    // Contar serviços
    const total = await prisma.serviceSimplified.count({
      where: { tenantId: tenant.id }
    });

    console.log('\n📊 Total de serviços:', total);

    // Buscar serviços por departamento
    const services = await prisma.serviceSimplified.findMany({
      where: { tenantId: tenant.id },
      select: {
        name: true,
        departmentId: true,
        department: {
          select: { name: true }
        }
      }
    });

    // Agrupar por departamento
    const byDept = {};
    services.forEach(s => {
      const deptName = s.department?.name || 'SEM_DEPARTAMENTO';
      if (!byDept[deptName]) byDept[deptName] = [];
      byDept[deptName].push(s.name);
    });

    console.log('\n📋 Serviços por departamento:');
    Object.entries(byDept).sort().forEach(([dept, svcs]) => {
      console.log(`   ${dept}: ${svcs.length}`);
    });

    // Verificar duplicatas
    const nameCount = {};
    services.forEach(s => {
      nameCount[s.name] = (nameCount[s.name] || 0) + 1;
    });

    const duplicates = Object.entries(nameCount).filter(([_, count]) => count > 1);

    if (duplicates.length > 0) {
      console.log('\n❌ DUPLICATAS ENCONTRADAS:');
      duplicates.forEach(([name, count]) => {
        console.log(`   - ${name}: ${count} vezes`);
      });
    } else {
      console.log('\n✅ Nenhuma duplicata encontrada');
    }

    // Status final
    console.log('\n📈 Status:');
    if (total === 114) {
      console.log('✅ Total correto: 114 serviços');
    } else if (total > 114) {
      console.log(`⚠️  Mais serviços que esperado: ${total} (esperado: 114)`);
      console.log(`   Diferença: +${total - 114} serviços`);
    } else {
      console.log(`⚠️  Menos serviços que esperado: ${total} (esperado: 114)`);
      console.log(`   Diferença: -${114 - total} serviços`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
