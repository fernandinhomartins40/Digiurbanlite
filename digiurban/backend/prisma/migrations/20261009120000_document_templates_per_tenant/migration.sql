-- Modelos de documento por município: código único POR MUNICÍPIO (antes era
-- único no banco inteiro e só um município podia ter cada modelo), catálogo da
-- plataforma com a regra "só acrescenta" e escopo (protocolo ou processo interno).
ALTER TABLE "document_templates" ADD COLUMN IF NOT EXISTS "scope" TEXT NOT NULL DEFAULT 'PROTOCOL';
ALTER TABLE "document_templates" ADD COLUMN IF NOT EXISTS "catalogKey" TEXT;
ALTER TABLE "document_templates" ADD COLUMN IF NOT EXISTS "catalogHash" TEXT;

DROP INDEX IF EXISTS "document_templates_code_key";
CREATE UNIQUE INDEX IF NOT EXISTS "document_templates_tenantId_code_key" ON "document_templates"("tenantId", "code");
CREATE INDEX IF NOT EXISTS "document_templates_scope_idx" ON "document_templates"("scope");

-- modelos que já existem com código do catálogo: ficam como "editados" (o catálogo não mexe)
UPDATE "document_templates" SET "catalogKey" = "code"
WHERE "catalogKey" IS NULL AND "code" IN ('CERTIDAO_PROTOCOLO','RELATORIO_CONCLUSAO','RECIBO_ATENDIMENTO','AUTORIZACAO_ALVARA','NOTIFICACAO_OFICIAL','PARECER_TECNICO');
