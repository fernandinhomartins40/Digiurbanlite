-- ============================================================================
-- MIGRATION: Sistema de Geração de Documentos
-- ============================================================================
-- Criado em: 2026-01-12
-- Descrição: Adiciona suporte para templates de documentos e geração de PDFs
-- ============================================================================

-- Criar enums
CREATE TYPE "DocumentTemplateType" AS ENUM (
  'PROTOCOL_CERTIFICATE',
  'COMPLETION_REPORT',
  'RECEIPT',
  'AUTHORIZATION',
  'NOTIFICATION',
  'CUSTOM'
);

CREATE TYPE "OutputFormat" AS ENUM (
  'PDF',
  'DOCX',
  'HTML'
);

-- Criar tabela de templates
CREATE TABLE "document_templates" (
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

-- Criar tabela de documentos gerados
CREATE TABLE "generated_documents" (
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

-- Criar índices
CREATE UNIQUE INDEX "document_templates_code_key" ON "document_templates"("code");
CREATE INDEX "document_templates_isActive_idx" ON "document_templates"("isActive");
CREATE INDEX "document_templates_documentType_idx" ON "document_templates"("documentType");

CREATE INDEX "generated_documents_protocolId_idx" ON "generated_documents"("protocolId");
CREATE INDEX "generated_documents_templateId_idx" ON "generated_documents"("templateId");
CREATE INDEX "generated_documents_generatedAt_idx" ON "generated_documents"("generatedAt");

-- Criar foreign keys
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_protocolId_fkey"
  FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "document_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
