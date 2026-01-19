-- ============================================================================
-- MIGRATION: Adicionar Campos de Validação de Documentos
-- ============================================================================
-- Criado em: 2026-01-19
-- Descrição: Adiciona sistema de validação pública de documentos gerados
-- ============================================================================

-- Adicionar colunas de validação à tabela generated_documents
ALTER TABLE "generated_documents"
ADD COLUMN IF NOT EXISTS "validationCode" TEXT,
ADD COLUMN IF NOT EXISTS "documentHash" TEXT,
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "validatedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lastValidatedAt" TIMESTAMP(3);

-- Criar índice único para validationCode
CREATE UNIQUE INDEX IF NOT EXISTS "generated_documents_validationCode_key"
ON "generated_documents"("validationCode");

-- Criar índice para documentHash
CREATE INDEX IF NOT EXISTS "generated_documents_documentHash_idx"
ON "generated_documents"("documentHash");

-- Comentários das colunas
COMMENT ON COLUMN "generated_documents"."validationCode" IS 'Código único de validação (VAL-YYYY-XXXXXX-CCCC)';
COMMENT ON COLUMN "generated_documents"."documentHash" IS 'Hash SHA-256 do documento para verificação de integridade';
COMMENT ON COLUMN "generated_documents"."expiresAt" IS 'Data de expiração do documento (opcional)';
COMMENT ON COLUMN "generated_documents"."validatedCount" IS 'Contador de validações públicas';
COMMENT ON COLUMN "generated_documents"."lastValidatedAt" IS 'Data da última validação pública';
