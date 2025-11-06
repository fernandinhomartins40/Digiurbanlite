const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDepartments() {
  try {
    // Buscar todos os tenants
    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true }
    });

    console.log('=== ANÁLISE DE DEPARTAMENTOS ===\n');
    console.log(`Total de tenants: ${tenants.length}\n`);

    for (const tenant of tenants) {
      const depts = await prisma.department.findMany({
        where: { tenantId: tenant.id },
        select: { name: true }
      });

      console.log(`📁 ${tenant.name}:`);
      console.log(`   Total de departamentos: ${depts.length}`);

      if (depts.length > 0) {
        console.log('   Departamentos:');
        depts.forEach(d => console.log(`     - ${d.name}`));
      }
      console.log('');
    }

    // Verificar total de departamentos únicos
    const allDepts = await prisma.department.findMany({
      select: { name: true, tenantId: true }
    });

    const uniqueNames = [...new Set(allDepts.map(d => d.name))];
    const totalDepts = allDepts.length;

    console.log('=== RESUMO ===');
    console.log(`Total de registros de departamentos: ${totalDepts}`);
    console.log(`Nomes únicos de departamentos: ${uniqueNames.length}`);
    console.log('');

    if (totalDepts > uniqueNames.length) {
      console.log('⚠️  PROBLEMA DETECTADO:');
      console.log(`   Os mesmos departamentos estão duplicados entre tenants!`);
      console.log(`   Isso está ERRADO para um sistema SaaS.`);
      console.log('');
      console.log('📋 Departamentos únicos encontrados:');
      uniqueNames.sort().forEach(name => console.log(`   - ${name}`));
      console.log('');
      console.log('💡 SOLUÇÃO:');
      console.log('   Os departamentos devem ser GLOBAIS (sem tenantId)');
      console.log('   OU cada tenant deve referenciar os mesmos departamentos');
    } else {
      console.log('✅ Estrutura correta: Departamentos únicos por tenant');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDepartments();
