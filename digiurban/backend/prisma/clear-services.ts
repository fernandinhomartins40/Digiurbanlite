import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearServices() {
  console.log('🗑️  Limpando serviços do banco de dados...');

  try {
    const result = await prisma.serviceSimplified.deleteMany({});
    console.log(`✅ ${result.count} serviços removidos com sucesso!`);
  } catch (error) {
    console.error('❌ Erro ao limpar serviços:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearServices();
