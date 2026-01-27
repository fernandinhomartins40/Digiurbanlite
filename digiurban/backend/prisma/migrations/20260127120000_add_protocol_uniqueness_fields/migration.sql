-- Migration: Add Protocol Uniqueness Validation Fields
-- Description: Add fields to services_simplified table to control protocol duplicate prevention

-- Add fields to services_simplified table
ALTER TABLE "services_simplified"
ADD COLUMN "allowMultipleActiveProtocols" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "uniquenessScope" TEXT,
ADD COLUMN "uniquenessRules" JSONB;

-- Add comment for documentation
COMMENT ON COLUMN "services_simplified"."allowMultipleActiveProtocols" IS
'Permite múltiplos protocolos ativos do mesmo serviço por cidadão. Default: true (backward compatible)';

COMMENT ON COLUMN "services_simplified"."uniquenessScope" IS
'Escopo de validação de unicidade: CITIZEN (simples), CUSTOM (módulo específico), CITIZEN_PER_FIELD (por campo do formulário)';

COMMENT ON COLUMN "services_simplified"."uniquenessRules" IS
'Regras JSON para validação de unicidade. Estrutura varia conforme uniquenessScope';

-- Create index for faster queries on uniqueness validation
CREATE INDEX "idx_services_uniqueness_scope" ON "services_simplified"("uniquenessScope")
WHERE "allowMultipleActiveProtocols" = false;
