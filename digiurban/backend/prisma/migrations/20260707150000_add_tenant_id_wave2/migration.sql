-- ============================================================================
-- FASE 2 MULTI-TENANT — ONDA 2: tenantId na família de protocolo
-- protocol_history_simplified, protocol_evaluations_simplified, protocol_sla,
-- protocol_documents, protocol_interactions, protocol_pendings
-- ============================================================================
-- Mesmo padrão da onda 1 (coluna nullable → FK → backfill → índice).
-- Backfill herda o tenant do protocolo pai (não do default cegamente) —
-- correto mesmo se um dia houver dados de múltiplos tenants antes desta onda.

-- a) Colunas
ALTER TABLE "protocol_history_simplified" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "protocol_evaluations_simplified" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "protocol_sla" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "protocol_documents" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "protocol_interactions" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "protocol_pendings" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- b) Foreign keys (idempotentes)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'protocol_history_simplified',
    'protocol_evaluations_simplified',
    'protocol_sla',
    'protocol_documents',
    'protocol_interactions',
    'protocol_pendings'
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

-- c) Backfill herdando do protocolo pai
UPDATE "protocol_history_simplified" h SET "tenantId" = p."tenantId"
  FROM "protocols_simplified" p WHERE h."protocolId" = p."id" AND h."tenantId" IS NULL AND p."tenantId" IS NOT NULL;
UPDATE "protocol_evaluations_simplified" e SET "tenantId" = p."tenantId"
  FROM "protocols_simplified" p WHERE e."protocolId" = p."id" AND e."tenantId" IS NULL AND p."tenantId" IS NOT NULL;
UPDATE "protocol_sla" s SET "tenantId" = p."tenantId"
  FROM "protocols_simplified" p WHERE s."protocolId" = p."id" AND s."tenantId" IS NULL AND p."tenantId" IS NOT NULL;
UPDATE "protocol_documents" d SET "tenantId" = p."tenantId"
  FROM "protocols_simplified" p WHERE d."protocolId" = p."id" AND d."tenantId" IS NULL AND p."tenantId" IS NOT NULL;
UPDATE "protocol_interactions" i SET "tenantId" = p."tenantId"
  FROM "protocols_simplified" p WHERE i."protocolId" = p."id" AND i."tenantId" IS NULL AND p."tenantId" IS NOT NULL;
UPDATE "protocol_pendings" pd SET "tenantId" = p."tenantId"
  FROM "protocols_simplified" p WHERE pd."protocolId" = p."id" AND pd."tenantId" IS NULL AND p."tenantId" IS NOT NULL;

-- d) Índices
CREATE INDEX IF NOT EXISTS "protocol_history_simplified_tenantId_idx" ON "protocol_history_simplified"("tenantId");
CREATE INDEX IF NOT EXISTS "protocol_evaluations_simplified_tenantId_idx" ON "protocol_evaluations_simplified"("tenantId");
CREATE INDEX IF NOT EXISTS "protocol_sla_tenantId_idx" ON "protocol_sla"("tenantId");
CREATE INDEX IF NOT EXISTS "protocol_documents_tenantId_idx" ON "protocol_documents"("tenantId");
CREATE INDEX IF NOT EXISTS "protocol_interactions_tenantId_idx" ON "protocol_interactions"("tenantId");
CREATE INDEX IF NOT EXISTS "protocol_pendings_tenantId_idx" ON "protocol_pendings"("tenantId");
