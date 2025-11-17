const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanServices() {
  try {
    // Buscar tenant Palmital
    const tenant = await prisma.tenant.findFirst({
      where: { name: { contains: 'Palmital' } }
    });

    if (!tenant) {
      console.log('❌ Tenant Palmital não encontrado');
      return;
    }

    console.log('✅ Tenant encontrado:', tenant.name);
    console.log('   ID:', tenant.id);

    // Contar serviços antes
    const beforeCount = await prisma.serviceSimplified.count({
      where: { tenantId: tenant.id }
    });

    console.log(`\n📊 Serviços antes da limpeza: ${beforeCount}`);

    // Deletar TODOS os serviços do tenant
    console.log('\n🗑️  Deletando todos os serviços...');

    const deleted = await prisma.serviceSimplified.deleteMany({
      where: { tenantId: tenant.id }
    });

    console.log(`✅ ${deleted.count} serviços deletados`);

    // Verificar se está zerado
    const afterCount = await prisma.serviceSimplified.count({
      where: { tenantId: tenant.id }
    });

    console.log(`\n📊 Serviços após limpeza: ${afterCount}`);

    if (afterCount === 0) {
      console.log('\n✅ Banco de dados limpo com sucesso!');
      console.log('📝 Execute agora: npm run seed');
    } else {
      console.log('\n⚠️  Ainda há serviços no banco!');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanServices();
