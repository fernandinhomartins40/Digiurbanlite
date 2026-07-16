-- ============================================================================
-- SERVIÇOS PÚBLICOS — App Ordens de Serviço (Fase 1D do plano de apps)
-- Aditivo e multi-tenant (RLS). Ver PLANO-IMPLEMENTACAO-APPS-SECRETARIAS.md §1D.
-- ============================================================================

CREATE TABLE "ordens_servico" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "numero" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT,
    "prioridade" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "endereco" TEXT,
    "bairro" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "fotos" JSONB,
    "equipeId" TEXT,
    "responsavelId" TEXT,
    "slaPrazo" TIMESTAMP(3),
    "dataDespacho" TIMESTAMP(3),
    "dataInicio" TIMESTAMP(3),
    "dataConclusao" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ordens_servico_protocolId_key" ON "ordens_servico"("protocolId");
CREATE UNIQUE INDEX "ordens_servico_tenantId_numero_key" ON "ordens_servico"("tenantId", "numero");
CREATE INDEX "ordens_servico_status_idx" ON "ordens_servico"("status");
CREATE INDEX "ordens_servico_tipo_idx" ON "ordens_servico"("tipo");
CREATE INDEX "ordens_servico_bairro_idx" ON "ordens_servico"("bairro");
CREATE INDEX "ordens_servico_equipeId_idx" ON "ordens_servico"("equipeId");
CREATE INDEX "ordens_servico_tenantId_idx" ON "ordens_servico"("tenantId");

CREATE TABLE "apontamentos_os" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "ordemServicoId" TEXT NOT NULL,
    "userId" TEXT,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT,
    "horas" DOUBLE PRECISION,
    "materiais" JSONB,
    "fotosAntes" JSONB,
    "fotosDepois" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apontamentos_os_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "apontamentos_os_ordemServicoId_idx" ON "apontamentos_os"("ordemServicoId");
CREATE INDEX "apontamentos_os_tenantId_idx" ON "apontamentos_os"("tenantId");

ALTER TABLE "apontamentos_os" ADD CONSTRAINT "apontamentos_os_ordemServicoId_fkey"
  FOREIGN KEY ("ordemServicoId") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['ordens_servico', 'apontamentos_os'] LOOP
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
