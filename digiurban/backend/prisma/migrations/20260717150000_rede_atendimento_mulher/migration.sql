-- ============================================================================
-- REDE DE ATENDIMENTO À MULHER — App de Políticas p/ Mulheres (Fase 2, B7
-- sigilo máximo). Aditivo e multi-tenant (RLS).
-- ============================================================================

CREATE TABLE "casos_mulher" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "numero" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "risco" TEXT NOT NULL DEFAULT 'MEDIO',
    "nomeAtendida" TEXT,
    "citizenId" TEXT,
    "telefoneSeguro" TEXT,
    "equipeIds" JSONB,
    "planoAcompanhamento" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "dados" JSONB,
    "createdById" TEXT,
    "encerradoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casos_mulher_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "casos_mulher_protocolId_key" ON "casos_mulher"("protocolId");
CREATE UNIQUE INDEX "casos_mulher_tenantId_numero_key" ON "casos_mulher"("tenantId", "numero");
CREATE INDEX "casos_mulher_status_idx" ON "casos_mulher"("status");
CREATE INDEX "casos_mulher_tipo_idx" ON "casos_mulher"("tipo");
CREATE INDEX "casos_mulher_citizenId_idx" ON "casos_mulher"("citizenId");
CREATE INDEX "casos_mulher_tenantId_idx" ON "casos_mulher"("tenantId");

CREATE TABLE "atendimentos_caso_mulher" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "casoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "relato" TEXT,
    "autorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atendimentos_caso_mulher_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "atendimentos_caso_mulher_casoId_idx" ON "atendimentos_caso_mulher"("casoId");
CREATE INDEX "atendimentos_caso_mulher_tenantId_idx" ON "atendimentos_caso_mulher"("tenantId");

CREATE TABLE "encaminhamentos_caso_mulher" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "casoId" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "detalhes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ENCAMINHADO',
    "autorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encaminhamentos_caso_mulher_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "encaminhamentos_caso_mulher_casoId_idx" ON "encaminhamentos_caso_mulher"("casoId");
CREATE INDEX "encaminhamentos_caso_mulher_tenantId_idx" ON "encaminhamentos_caso_mulher"("tenantId");

ALTER TABLE "atendimentos_caso_mulher" ADD CONSTRAINT "atendimentos_caso_mulher_casoId_fkey"
  FOREIGN KEY ("casoId") REFERENCES "casos_mulher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "encaminhamentos_caso_mulher" ADD CONSTRAINT "encaminhamentos_caso_mulher_casoId_fkey"
  FOREIGN KEY ("casoId") REFERENCES "casos_mulher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['casos_mulher', 'atendimentos_caso_mulher', 'encaminhamentos_caso_mulher'] LOOP
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
