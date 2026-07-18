-- ============================================================================
-- CARTEIRAS & GRATUIDADES — App de Mobilidade Urbana (Fase 3, carteirinha).
-- Aditivo e multi-tenant (RLS).
-- ============================================================================

CREATE TABLE "carteiras_gratuidade" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "tipo" TEXT NOT NULL,
    "titularNome" TEXT,
    "cpf" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "citizenId" TEXT,
    "telefone" TEXT,
    "instituicao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SOLICITADA',
    "numeroCarteira" TEXT,
    "codigoValidacao" TEXT,
    "validade" TIMESTAMP(3),
    "emitidaEm" TIMESTAMP(3),
    "viasEmitidas" INTEGER NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "dados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carteiras_gratuidade_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "carteiras_gratuidade_protocolId_key" ON "carteiras_gratuidade"("protocolId");
CREATE UNIQUE INDEX "carteiras_gratuidade_codigoValidacao_key" ON "carteiras_gratuidade"("codigoValidacao");
CREATE INDEX "carteiras_gratuidade_tipo_status_idx" ON "carteiras_gratuidade"("tipo", "status");
CREATE INDEX "carteiras_gratuidade_cpf_idx" ON "carteiras_gratuidade"("cpf");
CREATE INDEX "carteiras_gratuidade_citizenId_idx" ON "carteiras_gratuidade"("citizenId");
CREATE INDEX "carteiras_gratuidade_tenantId_idx" ON "carteiras_gratuidade"("tenantId");

-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['carteiras_gratuidade'] LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
      EXECUTE format($f$CREATE POLICY tenant_isolation ON %I USING (current_tenant_id() IS NULL OR current_tenant_id() = '__platform__' OR "tenantId" IS NULL OR "tenantId" = current_tenant_id()) WITH CHECK (current_tenant_id() IS NULL OR current_tenant_id() = '__platform__' OR "tenantId" IS NULL OR "tenantId" = current_tenant_id())$f$, t);
    EXCEPTION
      WHEN insufficient_privilege THEN RAISE WARNING 'RLS não aplicado em % (sem privilégio)', t;
      WHEN undefined_function THEN RAISE WARNING 'current_tenant_id() ausente ao proteger %', t;
    END;
  END LOOP;
END $OUTER$;
