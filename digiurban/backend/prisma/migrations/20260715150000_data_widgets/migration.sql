-- ============================================================================
-- DATA WIDGETS — workspace configurável do módulo de Gestão de Dados (W0)
-- Aditivo e multi-tenant (RLS). Ver PLANO-MODULO-GESTAO-DADOS-WIDGETS.md.
-- ============================================================================

CREATE TABLE "data_widgets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "entityTypeId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'SHARED',
    "ownerUserId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "config" JSONB,
    "layout" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_widgets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "data_widgets_tenantId_entityTypeId_idx" ON "data_widgets"("tenantId", "entityTypeId");
CREATE INDEX "data_widgets_tenantId_entityTypeId_scope_idx" ON "data_widgets"("tenantId", "entityTypeId", "scope");
CREATE INDEX "data_widgets_ownerUserId_idx" ON "data_widgets"("ownerUserId");

ALTER TABLE "data_widgets" ADD CONSTRAINT "data_widgets_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
DO $OUTER$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_widgets' AND table_schema='public') THEN
    BEGIN
      ALTER TABLE "data_widgets" ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS tenant_isolation ON "data_widgets";
      CREATE POLICY tenant_isolation ON "data_widgets"
        USING (current_tenant_id() IS NULL OR current_tenant_id() = '__platform__' OR "tenantId" IS NULL OR "tenantId" = current_tenant_id())
        WITH CHECK (current_tenant_id() IS NULL OR current_tenant_id() = '__platform__' OR "tenantId" IS NULL OR "tenantId" = current_tenant_id());
    EXCEPTION
      WHEN insufficient_privilege THEN RAISE WARNING 'RLS não aplicado em data_widgets (sem privilégio)';
      WHEN undefined_function THEN RAISE WARNING 'current_tenant_id() ausente ao proteger data_widgets';
    END;
  END IF;
END $OUTER$;
