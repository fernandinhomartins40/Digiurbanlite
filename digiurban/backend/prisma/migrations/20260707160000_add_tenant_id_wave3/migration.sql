-- ============================================================================
-- FASE 2 MULTI-TENANT — ONDA 3: tenantId em audit_logs e notifications
-- ============================================================================
-- Auditoria e notificações passam a ser escopadas por tenant (requisito LGPD
-- do plano: trilha de auditoria por município). Mesmo padrão das ondas 1/2.

-- a) Colunas
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- b) Foreign keys (idempotentes)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'audit_logs_tenantId_fkey') THEN
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notifications_tenantId_fkey') THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- c) Backfill para o tenant default (só se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
    UPDATE "audit_logs" SET "tenantId" = 'tenant-default' WHERE "tenantId" IS NULL;
    UPDATE "notifications" SET "tenantId" = 'tenant-default' WHERE "tenantId" IS NULL;
  END IF;
END $$;

-- d) Índices
CREATE INDEX IF NOT EXISTS "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");
CREATE INDEX IF NOT EXISTS "notifications_tenantId_idx" ON "notifications"("tenantId");
