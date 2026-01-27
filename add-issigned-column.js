const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addColumn() {
  try {
    console.log('🔄 Adicionando coluna isSigned...\n');

    // Adicionar coluna em generated_documents
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "generated_documents" ADD COLUMN IF NOT EXISTS "isSigned" BOOLEAN NOT NULL DEFAULT false'
    );
    console.log('✅ Coluna isSigned adicionada a generated_documents');

    // Adicionar coluna em external_documents
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "external_documents" ADD COLUMN IF NOT EXISTS "isSigned" BOOLEAN NOT NULL DEFAULT false'
    );
    console.log('✅ Coluna isSigned adicionada a external_documents');

    // Atualizar documentos que já têm assinaturas
    const updatedGenerated = await prisma.$executeRaw`
      UPDATE generated_documents gd
      SET "isSigned" = true
      WHERE EXISTS (
        SELECT 1 FROM signatures s
        WHERE s."documentId" = gd.id
      )
    `;
    console.log(`✅ ${updatedGenerated} documentos gerados atualizados com assinaturas existentes`);

    const updatedExternal = await prisma.$executeRaw`
      UPDATE external_documents ed
      SET "isSigned" = true
      WHERE EXISTS (
        SELECT 1 FROM signatures s
        WHERE s."externalDocumentId" = ed.id
      )
    `;
    console.log(`✅ ${updatedExternal} documentos externos atualizados com assinaturas existentes`);

    await prisma.$disconnect();
    console.log('\n✅ Migration concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

addColumn();
