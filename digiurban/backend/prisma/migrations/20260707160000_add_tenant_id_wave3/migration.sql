-- ============================================================================
-- FASE 2 MULTI-TENANT — ONDA 3: tenantId em audit_logs e notifications
-- ============================================================================
-- Auditoria e notificações passam a ser escopadas por tenant (requisito LGPD
-- do plano: trilha de auditoria por município).
--
-- ⚠️ REPARO (achado B7 — drift de db push): `audit_logs` é uma tabela que NÃO
-- é criada por nenhuma migration (a baseline drift 20260707130000 foi gerada
-- por `migrate diff` num ambiente onde ela já existia via db push, então não a
-- incluiu; em produção ela simplesmente não existe). Esta migration passa a ser
-- AUTO-SUFICIENTE: cria audit_logs se faltar, e condiciona todo ALTER à
-- existência da tabela — assim funciona em produção (sem audit_logs),
-- em bancos com drift (já existe) e em bancos novos.

-- 0) Garante que audit_logs existe (schema idêntico ao model AuditLog)
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "citizenId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "method" TEXT,
    "details" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_citizenId_idx" ON "audit_logs"("citizenId");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- FKs de audit_logs → users/citizens (podem faltar se a tabela nasceu agora)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'audit_logs_userId_fkey') THEN
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'citizens')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'audit_logs_citizenId_fkey') THEN
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- a) Colunas tenantId (condicionais: a tabela pode não existir em bancos exóticos)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
  END IF;
END $$;

-- b) Foreign keys de tenant (idempotentes + condicionais)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'audit_logs_tenantId_fkey') THEN
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notifications_tenantId_fkey') THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- c) Backfill para o tenant default (só se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
      UPDATE "audit_logs" SET "tenantId" = 'tenant-default' WHERE "tenantId" IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
      UPDATE "notifications" SET "tenantId" = 'tenant-default' WHERE "tenantId" IS NULL;
    END IF;
  END IF;
END $$;

-- d) Índices
CREATE INDEX IF NOT EXISTS "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");
CREATE INDEX IF NOT EXISTS "notifications_tenantId_idx" ON "notifications"("tenantId");
