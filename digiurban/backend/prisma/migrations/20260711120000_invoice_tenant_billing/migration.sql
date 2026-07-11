-- ============================================================================
-- BILLING POR MUNICÍPIO — Invoice.tenantId (painel super-admin / plataforma)
-- ============================================================================
-- Faturas de plano por município. tenantId NULLABLE por design: Invoice é
-- entidade de PLATAFORMA (não entra na extension de tenant nem no RLS de
-- isolamento) — a listagem por município usa where explícito. Idempotente.

ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
CREATE INDEX IF NOT EXISTS "invoices_tenantId_idx" ON "invoices" ("tenantId");
