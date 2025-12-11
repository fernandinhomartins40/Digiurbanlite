const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicateDocuments() {
  try {
    // Buscar protocolos recentes com documentos
    const protocols = await prisma.protocolSimplified.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        documentFiles: {
          select: {
            id: true,
            documentType: true,
            isRequired: true,
            status: true,
            fileName: true
          }
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

    console.log('\n📋 Últimos 5 protocolos com documentos:\n');

    for (const p of protocols) {
      console.log(`Protocolo: ${p.number}`);
      console.log(`Serviço: ${p.service?.name}`);
      console.log(`Total documentos: ${p.documentFiles.length}`);

      // Agrupar por documentType
      const grouped = p.documentFiles.reduce((acc, doc) => {
        const key = doc.documentType;
        if (!acc[key]) acc[key] = [];
        acc[key].push(doc);
        return acc;
      }, {});

      // Verificar duplicatas
      for (const [type, docs] of Object.entries(grouped)) {
        if (docs.length > 1) {
          console.log(`  ⚠️  DUPLICADO: ${type} (${docs.length}x)`);
          docs.forEach(d => {
            console.log(`      - ID: ${d.id} | isRequired: ${d.isRequired} | status: ${d.status} | fileName: ${d.fileName || 'N/A'}`);
          });
        } else {
          const d = docs[0];
          console.log(`  ✓ ${type}: isRequired=${d.isRequired} | status=${d.status}`);
        }
      }
      console.log('');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
}

checkDuplicateDocuments();
