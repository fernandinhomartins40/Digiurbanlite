import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearServices() {
  console.log('🗑️  Deletando todos os serviços...');

  const result = await prisma.serviceSimplified.deleteMany({});

  console.log(`✅ ${result.count} serviços deletados com sucesso!`);

  await prisma.$disconnect();
}

clearServices()
  .catch((error) => {
    console.error('❌ Erro ao deletar serviços:', error);
    process.exit(1);
  });
