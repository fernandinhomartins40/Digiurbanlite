-- ============================================================================
-- FASE 2 MULTI-TENANT — ONDA 1 (piloto): tenantId nas 5 tabelas núcleo
-- users, citizens, departments, services_simplified, protocols_simplified
-- ============================================================================
-- Padrão da fase (4 passos, sem NOT NULL ainda — transição segura):
--   a) ADD COLUMN nullable (metadata-only no PG15, sem rewrite de tabela)
--   b) FK para tenants
--   c) backfill para o tenant default (idempotente, só se ele existir)
--   d) índices (tenant_id e compostos de acesso mais frequente)
-- NOT NULL + uniques compostas ([tenantId, cpf] etc.) chegam em onda posterior,
-- após a extensão Prisma garantir preenchimento em toda escrita nova.

-- a) Colunas
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "citizens" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "services_simplified" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "protocols_simplified" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- b) Foreign keys (idempotentes)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_tenantId_fkey') THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'citizens_tenantId_fkey') THEN
    ALTER TABLE "citizens" ADD CONSTRAINT "citizens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'departments_tenantId_fkey') THEN
    ALTER TABLE "departments" ADD CONSTRAINT "departments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'services_simplified_tenantId_fkey') THEN
    ALTER TABLE "services_simplified" ADD CONSTRAINT "services_simplified_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'protocols_simplified_tenantId_fkey') THEN
    ALTER TABLE "protocols_simplified" ADD CONSTRAINT "protocols_simplified_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- c) Backfill para o tenant default (só se existir; em banco novo não há dados)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
    UPDATE "users" SET "tenantId" = 'tenant-default' WHERE "tenantId" IS NULL;
    UPDATE "citizens" SET "tenantId" = 'tenant-default' WHERE "tenantId" IS NULL;
    UPDATE "departments" SET "tenantId" = 'tenant-default' WHERE "tenantId" IS NULL;
    UPDATE "services_simplified" SET "tenantId" = 'tenant-default' WHERE "tenantId" IS NULL;
    UPDATE "protocols_simplified" SET "tenantId" = 'tenant-default' WHERE "tenantId" IS NULL;
  END IF;
END $$;

-- d) Índices
CREATE INDEX IF NOT EXISTS "users_tenantId_idx" ON "users"("tenantId");
CREATE INDEX IF NOT EXISTS "citizens_tenantId_idx" ON "citizens"("tenantId");
CREATE INDEX IF NOT EXISTS "departments_tenantId_idx" ON "departments"("tenantId");
CREATE INDEX IF NOT EXISTS "services_simplified_tenantId_idx" ON "services_simplified"("tenantId");
CREATE INDEX IF NOT EXISTS "protocols_simplified_tenantId_idx" ON "protocols_simplified"("tenantId");
CREATE INDEX IF NOT EXISTS "protocols_simplified_tenantId_status_idx" ON "protocols_simplified"("tenantId", "status");
