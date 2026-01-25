-- Adicionar campo visualPosition à tabela signatures
ALTER TABLE "signatures" ADD COLUMN IF NOT EXISTS "visualPosition" JSONB;

-- Criar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS "signatures_visualPosition_idx" ON "signatures" USING GIN ("visualPosition");

-- Comentário para documentação
COMMENT ON COLUMN "signatures"."visualPosition" IS 'Posição da assinatura visual no PDF (page, x, y, width, height)';
