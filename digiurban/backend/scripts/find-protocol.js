const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Buscar protocolo pela string do número
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        number: {
          contains: 'dcofncfnnfjncdjfjnclksf'
        }
      },
      include: {
        documentFiles: {
          select: {
            id: true,
            documentType: true,
            isRequired: true,
            status: true,
            fileName: true,
            createdAt: true
          },
          orderBy: { createdAt: 'asc' }
        },
        service: {
          select: {
            name: true,
            requiresDocuments: true,
            requiredDocuments: true
          }
        }
      }
    });

    if (!protocol) {
      console.log('Protocolo não encontrado');
      return;
    }

    console.log('Protocolo:', protocol.number);
    console.log('Serviço:', protocol.service?.name);
    console.log('RequiredDocuments do serviço:', JSON.stringify(protocol.service?.requiredDocuments, null, 2));
    console.log('\nDocumentos do protocolo:');

    protocol.documentFiles.forEach(doc => {
      console.log(`  - ${doc.documentType}`);
      console.log(`    isRequired: ${doc.isRequired}`);
      console.log(`    status: ${doc.status}`);
      console.log(`    fileName: ${doc.fileName || 'N/A'}`);
      console.log(`    createdAt: ${doc.createdAt}`);
      console.log('');
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

main();
