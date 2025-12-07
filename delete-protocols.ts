import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Deletando todos os protocolos...');

  const results = await prisma.$transaction([
    prisma.protocolDocument.deleteMany(),
    prisma.protocolInteraction.deleteMany(),
    prisma.protocolHistorySimplified.deleteMany(),
    prisma.protocolPending.deleteMany(),
    prisma.protocolStage.deleteMany(),
    prisma.protocolSimplified.deleteMany(),
  ]);

  console.log('✅ Protocolos deletados com sucesso!');
  console.log('   - ProtocolDocument:', results[0].count);
  console.log('   - ProtocolInteraction:', results[1].count);
  console.log('   - ProtocolHistorySimplified:', results[2].count);
  console.log('   - ProtocolPending:', results[3].count);
  console.log('   - ProtocolStage:', results[4].count);
  console.log('   - ProtocolSimplified:', results[5].count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
