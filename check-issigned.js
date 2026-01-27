const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    console.log('🔍 Verificando coluna isSigned...\n');

    // Verificar se a coluna existe
    const columnCheck = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'generated_documents'
      AND column_name = 'isSigned'
    `;

    console.log('📊 Resultado da verificação de coluna:');
    console.log(JSON.stringify(columnCheck, null, 2));

    if (columnCheck.length === 0) {
      console.log('\n❌ PROBLEMA: Coluna isSigned NÃO existe no banco de produção!');
      console.log('   Solução: Execute a migration manualmente no servidor.');
      process.exit(1);
    } else {
      console.log('\n✅ Coluna isSigned existe no banco de produção');
    }

    // Verificar documentos gerados recentemente
    const recentDocs = await prisma.generatedDocument.findMany({
      take: 5,
      orderBy: { generatedAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        isSigned: true,
        generatedAt: true,
        _count: {
          select: { signatures: true }
        }
      }
    });

    console.log('\n📄 Últimos 5 documentos gerados:');
    recentDocs.forEach(doc => {
      const status = doc.isSigned ? '✅ Assinado' : '❌ Não assinado';
      const sigCount = doc._count.signatures;
      console.log(`   ${status} - ${doc.fileName} (${sigCount} assinaturas registradas)`);
    });

    // Verificar inconsistências
    const docsWithSignatureButNotMarked = await prisma.generatedDocument.findMany({
      where: {
        isSigned: false,
        signatures: {
          some: {}
        }
      },
      select: {
        id: true,
        fileName: true,
        _count: {
          select: { signatures: true }
        }
      }
    });

    if (docsWithSignatureButNotMarked.length > 0) {
      console.log(`\n⚠️  INCONSISTÊNCIA: ${docsWithSignatureButNotMarked.length} documentos têm assinatura mas isSigned=false`);
      console.log('   Isso indica que o código de atualização não está funcionando após assinatura.');
      docsWithSignatureButNotMarked.forEach(doc => {
        console.log(`   - ${doc.fileName} (${doc._count.signatures} assinaturas)`);
      });
    } else {
      console.log('\n✅ Não há inconsistências entre assinaturas e o flag isSigned');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

check();
