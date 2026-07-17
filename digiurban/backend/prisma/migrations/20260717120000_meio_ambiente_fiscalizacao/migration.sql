-- ============================================================================
-- LICENCIAMENTO & FISCALIZAÇÃO AMBIENTAL — App da Secretaria de Meio Ambiente
-- (Fase 2 do plano de apps, blueprint B4 + mapa). Aditivo e multi-tenant (RLS).
-- ============================================================================

CREATE TABLE "processos_ambientais" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "numero" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "requerenteNome" TEXT,
    "citizenId" TEXT,
    "atividade" TEXT,
    "endereco" TEXT,
    "bairro" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "descricao" TEXT,
    "dados" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "responsavelId" TEXT,
    "condicionantes" JSONB,
    "licencaNumero" TEXT,
    "licencaValidade" TIMESTAMP(3),
    "licencaEmitidaEm" TIMESTAMP(3),
    "renovacaoDeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processos_ambientais_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "processos_ambientais_protocolId_key" ON "processos_ambientais"("protocolId");
CREATE UNIQUE INDEX "processos_ambientais_tenantId_numero_key" ON "processos_ambientais"("tenantId", "numero");
CREATE UNIQUE INDEX "processos_ambientais_tenantId_licencaNumero_key" ON "processos_ambientais"("tenantId", "licencaNumero");
CREATE INDEX "processos_ambientais_status_idx" ON "processos_ambientais"("status");
CREATE INDEX "processos_ambientais_tipo_idx" ON "processos_ambientais"("tipo");
CREATE INDEX "processos_ambientais_citizenId_idx" ON "processos_ambientais"("citizenId");
CREATE INDEX "processos_ambientais_tenantId_idx" ON "processos_ambientais"("tenantId");

CREATE TABLE "pareceres_ambientais" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "processoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "resultado" TEXT,
    "texto" TEXT,
    "fotos" JSONB,
    "autorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pareceres_ambientais_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pareceres_ambientais_processoId_idx" ON "pareceres_ambientais"("processoId");
CREATE INDEX "pareceres_ambientais_tenantId_idx" ON "pareceres_ambientais"("tenantId");

CREATE TABLE "vistorias_ambientais" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "processoId" TEXT NOT NULL,
    "dataAgendada" TIMESTAMP(3),
    "dataRealizada" TIMESTAMP(3),
    "fiscalId" TEXT,
    "resultado" TEXT,
    "constatacoes" TEXT,
    "fotos" JSONB,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vistorias_ambientais_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vistorias_ambientais_processoId_idx" ON "vistorias_ambientais"("processoId");
CREATE INDEX "vistorias_ambientais_fiscalId_idx" ON "vistorias_ambientais"("fiscalId");
CREATE INDEX "vistorias_ambientais_tenantId_idx" ON "vistorias_ambientais"("tenantId");

CREATE TABLE "autos_infracao_ambiental" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "processoId" TEXT NOT NULL,
    "vistoriaId" TEXT,
    "numero" TEXT NOT NULL,
    "infratorNome" TEXT,
    "infratorDocumento" TEXT,
    "descricao" TEXT,
    "enquadramento" TEXT,
    "gravidade" TEXT,
    "valorMulta" DOUBLE PRECISION,
    "prazoDefesa" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'LAVRADO',
    "fiscalId" TEXT,
    "fotos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autos_infracao_ambiental_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "autos_infracao_ambiental_tenantId_numero_key" ON "autos_infracao_ambiental"("tenantId", "numero");
CREATE INDEX "autos_infracao_ambiental_processoId_idx" ON "autos_infracao_ambiental"("processoId");
CREATE INDEX "autos_infracao_ambiental_status_idx" ON "autos_infracao_ambiental"("status");
CREATE INDEX "autos_infracao_ambiental_tenantId_idx" ON "autos_infracao_ambiental"("tenantId");

ALTER TABLE "pareceres_ambientais" ADD CONSTRAINT "pareceres_ambientais_processoId_fkey"
  FOREIGN KEY ("processoId") REFERENCES "processos_ambientais"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vistorias_ambientais" ADD CONSTRAINT "vistorias_ambientais_processoId_fkey"
  FOREIGN KEY ("processoId") REFERENCES "processos_ambientais"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "autos_infracao_ambiental" ADD CONSTRAINT "autos_infracao_ambiental_processoId_fkey"
  FOREIGN KEY ("processoId") REFERENCES "processos_ambientais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['processos_ambientais', 'pareceres_ambientais', 'vistorias_ambientais', 'autos_infracao_ambiental'] LOOP
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
