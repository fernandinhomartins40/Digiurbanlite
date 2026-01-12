/**
 * Script para aplicar migration de documentos no servidor
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyMigration() {
  console.log('📦 Aplicando migration de documentos...');

  try {
    // Criar enums
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "DocumentTemplateType" AS ENUM (
          'PROTOCOL_CERTIFICATE',
          'COMPLETION_REPORT',
          'RECEIPT',
          'AUTHORIZATION',
          'NOTIFICATION',
          'CUSTOM'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "OutputFormat" AS ENUM (
          'PDF',
          'DOCX',
          'HTML'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('✓ Enums criados');

    // Criar tabela de templates
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "document_templates" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "description" TEXT,
        "documentType" "DocumentTemplateType" NOT NULL,
        "outputFormat" "OutputFormat" NOT NULL,
        "serviceIds" JSONB NOT NULL DEFAULT '[]',
        "isGlobal" BOOLEAN NOT NULL DEFAULT false,
        "htmlTemplate" TEXT NOT NULL,
        "headerHtml" TEXT,
        "footerHtml" TEXT,
        "cssStyles" TEXT,
        "availableVariables" JSONB DEFAULT '[]',
        "pageSize" TEXT NOT NULL DEFAULT 'A4',
        "orientation" TEXT NOT NULL DEFAULT 'portrait',
        "margins" JSONB,
        "requiresSignature" BOOLEAN NOT NULL DEFAULT false,
        "signatureFields" JSONB DEFAULT '[]',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "version" INTEGER NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "createdBy" TEXT NOT NULL,
        CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
      );
    `);

    console.log('✓ Tabela document_templates criada');

    // Criar tabela de documentos gerados
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "generated_documents" (
        "id" TEXT NOT NULL,
        "protocolId" TEXT NOT NULL,
        "templateId" TEXT NOT NULL,
        "fileName" TEXT NOT NULL,
        "filePath" TEXT NOT NULL,
        "fileUrl" TEXT,
        "fileSize" INTEGER NOT NULL,
        "mimeType" TEXT NOT NULL,
        "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "generatedBy" TEXT NOT NULL,
        "templateVersion" INTEGER NOT NULL,
        "variablesUsed" JSONB NOT NULL,
        "wasSent" BOOLEAN NOT NULL DEFAULT false,
        "sentAt" TIMESTAMP(3),
        "sentBy" TEXT,
        "sentTo" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "deletedAt" TIMESTAMP(3),
        CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id")
      );
    `);

    console.log('✓ Tabela generated_documents criada');

    // Criar índices
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "document_templates_code_key" ON "document_templates"("code");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "document_templates_isActive_idx" ON "document_templates"("isActive");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "document_templates_documentType_idx" ON "document_templates"("documentType");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "generated_documents_protocolId_idx" ON "generated_documents"("protocolId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "generated_documents_templateId_idx" ON "generated_documents"("templateId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "generated_documents_generatedAt_idx" ON "generated_documents"("generatedAt");
    `);

    console.log('✓ Índices criados');

    // Criar foreign keys
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_protocolId_fkey"
          FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_templateId_fkey"
          FOREIGN KEY ("templateId") REFERENCES "document_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('✓ Foreign keys criadas');

    console.log('✅ Migration aplicada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error);
    throw error;
  }
}

applyMigration()
  .catch((error) => {
    console.error('❌ Falha:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
