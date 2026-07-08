-- ============================================================================
-- FASE 4 + FASE 2 ONDA 4 — MULTI-TENANT
-- 1. tenants.customDomain (resolução de tenant por domínio próprio)
-- 2. tenantId em: citizen_documents, generated_documents, document_templates,
--    protocol_stages, protocol_data_fields
-- ============================================================================

-- 1) customDomain
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "customDomain" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_customDomain_key" ON "tenants"("customDomain");

-- 2a) Colunas
ALTER TABLE "citizen_documents" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "generated_documents" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "document_templates" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "protocol_stages" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "protocol_data_fields" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- 2b) Foreign keys (idempotentes)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'citizen_documents', 'generated_documents', 'document_templates',
    'protocol_stages', 'protocol_data_fields'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = t || '_tenantId_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE',
        t, t || '_tenantId_fkey'
      );
    END IF;
  END LOOP;
END $$;

-- 2c) Backfill: herdar do pai quando houver; senão tenant default
UPDATE "citizen_documents" d SET "tenantId" = c."tenantId"
  FROM "citizens" c WHERE d."citizenId" = c."id" AND d."tenantId" IS NULL AND c."tenantId" IS NOT NULL;
UPDATE "protocol_stages" st SET "tenantId" = p."tenantId"
  FROM "protocols_simplified" p WHERE st."protocolId" = p."id" AND st."tenantId" IS NULL AND p."tenantId" IS NOT NULL;
UPDATE "protocol_data_fields" df SET "tenantId" = p."tenantId"
  FROM "protocols_simplified" p WHERE df."protocolId" = p."id" AND df."tenantId" IS NULL AND p."tenantId" IS NOT NULL;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
    UPDATE "citizen_documents" SET "tenantId" = 'tenant-default' WHERE "tenantId" IS NULL;
    UPDATE "generated_documents" SET "tenantId" = 'tenant-default' WHERE "tenantId" IS NULL;
    UPDATE "document_templates" SET "tenantId" = 'tenant-default' WHERE "tenantId" IS NULL;
    UPDATE "protocol_stages" SET "tenantId" = 'tenant-default' WHERE "tenantId" IS NULL;
    UPDATE "protocol_data_fields" SET "tenantId" = 'tenant-default' WHERE "tenantId" IS NULL;
  END IF;
END $$;

-- 2d) Índices
CREATE INDEX IF NOT EXISTS "citizen_documents_tenantId_idx" ON "citizen_documents"("tenantId");
CREATE INDEX IF NOT EXISTS "generated_documents_tenantId_idx" ON "generated_documents"("tenantId");
CREATE INDEX IF NOT EXISTS "document_templates_tenantId_idx" ON "document_templates"("tenantId");
CREATE INDEX IF NOT EXISTS "protocol_stages_tenantId_idx" ON "protocol_stages"("tenantId");
CREATE INDEX IF NOT EXISTS "protocol_data_fields_tenantId_idx" ON "protocol_data_fields"("tenantId");
