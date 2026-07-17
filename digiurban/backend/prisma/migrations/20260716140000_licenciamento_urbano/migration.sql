-- ============================================================================
-- LICENCIAMENTO URBANO — App único p/ Obras Públicas + Planejamento Urbano
-- (Fase 2 do plano de apps, blueprint B4). Aditivo e multi-tenant (RLS).
-- ============================================================================

CREATE TABLE "processos_licenciamento" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "numero" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "requerenteNome" TEXT,
    "citizenId" TEXT,
    "endereco" TEXT,
    "bairro" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "areaM2" DOUBLE PRECISION,
    "descricao" TEXT,
    "dados" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "responsavelId" TEXT,
    "licencaNumero" TEXT,
    "licencaValidade" TIMESTAMP(3),
    "licencaEmitidaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processos_licenciamento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "processos_licenciamento_protocolId_key" ON "processos_licenciamento"("protocolId");
CREATE UNIQUE INDEX "processos_licenciamento_tenantId_numero_key" ON "processos_licenciamento"("tenantId", "numero");
CREATE UNIQUE INDEX "processos_licenciamento_tenantId_licencaNumero_key" ON "processos_licenciamento"("tenantId", "licencaNumero");
CREATE INDEX "processos_licenciamento_status_idx" ON "processos_licenciamento"("status");
CREATE INDEX "processos_licenciamento_tipo_idx" ON "processos_licenciamento"("tipo");
CREATE INDEX "processos_licenciamento_citizenId_idx" ON "processos_licenciamento"("citizenId");
CREATE INDEX "processos_licenciamento_tenantId_idx" ON "processos_licenciamento"("tenantId");

CREATE TABLE "pareceres_licenciamento" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "processoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "resultado" TEXT,
    "texto" TEXT,
    "fotos" JSONB,
    "autorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pareceres_licenciamento_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pareceres_licenciamento_processoId_idx" ON "pareceres_licenciamento"("processoId");
CREATE INDEX "pareceres_licenciamento_tenantId_idx" ON "pareceres_licenciamento"("tenantId");

ALTER TABLE "pareceres_licenciamento" ADD CONSTRAINT "pareceres_licenciamento_processoId_fkey"
  FOREIGN KEY ("processoId") REFERENCES "processos_licenciamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['processos_licenciamento', 'pareceres_licenciamento'] LOOP
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
