import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const protocol = await prisma.protocolSimplified.findFirst({
    where: { number: '2025-000001' },
    select: {
      id: true,
      number: true,
      title: true,
      documents: true
    }
  });

  console.log('Protocolo:', JSON.stringify(protocol, null, 2));

  if (protocol) {
    const docs = await prisma.protocolDocument.findMany({
      where: { protocolId: protocol.id }
    });
    console.log('\nTotal de documentos na tabela ProtocolDocument:', docs.length);
    console.log('Documentos:', JSON.stringify(docs, null, 2));
  }
}

check().finally(() => prisma.$disconnect());
