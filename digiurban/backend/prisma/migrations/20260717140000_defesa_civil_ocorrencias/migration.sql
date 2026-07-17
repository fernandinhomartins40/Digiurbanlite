-- ============================================================================
-- OCORRÊNCIAS & ÁREAS DE RISCO — App da Defesa Civil (Fase 2, B2 + mapa).
-- Aditivo e multi-tenant (RLS).
-- ============================================================================

CREATE TABLE "ocorrencias_defesa_civil" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "numero" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "gravidade" TEXT NOT NULL DEFAULT 'MEDIA',
    "solicitanteNome" TEXT,
    "citizenId" TEXT,
    "endereco" TEXT,
    "bairro" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "descricao" TEXT,
    "dados" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "responsavelId" TEXT,
    "vistoriaEm" TIMESTAMP(3),
    "laudo" TEXT,
    "nivelRisco" TEXT,
    "interditadoEm" TIMESTAMP(3),
    "fotos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocorrencias_defesa_civil_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ocorrencias_defesa_civil_protocolId_key" ON "ocorrencias_defesa_civil"("protocolId");
CREATE UNIQUE INDEX "ocorrencias_defesa_civil_tenantId_numero_key" ON "ocorrencias_defesa_civil"("tenantId", "numero");
CREATE INDEX "ocorrencias_defesa_civil_status_idx" ON "ocorrencias_defesa_civil"("status");
CREATE INDEX "ocorrencias_defesa_civil_tipo_idx" ON "ocorrencias_defesa_civil"("tipo");
CREATE INDEX "ocorrencias_defesa_civil_bairro_idx" ON "ocorrencias_defesa_civil"("bairro");
CREATE INDEX "ocorrencias_defesa_civil_citizenId_idx" ON "ocorrencias_defesa_civil"("citizenId");
CREATE INDEX "ocorrencias_defesa_civil_tenantId_idx" ON "ocorrencias_defesa_civil"("tenantId");

CREATE TABLE "abrigos_defesa_civil" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "bairro" TEXT,
    "capacidade" INTEGER,
    "ocupacao" INTEGER NOT NULL DEFAULT 0,
    "responsavelNome" TEXT,
    "telefone" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abrigos_defesa_civil_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "abrigos_defesa_civil_tenantId_nome_key" ON "abrigos_defesa_civil"("tenantId", "nome");
CREATE INDEX "abrigos_defesa_civil_isActive_idx" ON "abrigos_defesa_civil"("isActive");
CREATE INDEX "abrigos_defesa_civil_tenantId_idx" ON "abrigos_defesa_civil"("tenantId");

CREATE TABLE "familias_atingidas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "ocorrenciaId" TEXT,
    "abrigoId" TEXT,
    "cadUnicoFamiliaId" TEXT,
    "responsavelNome" TEXT,
    "cpf" TEXT,
    "membros" INTEGER,
    "situacao" TEXT NOT NULL DEFAULT 'DESALOJADA',
    "necessidades" TEXT,
    "entradaAbrigoEm" TIMESTAMP(3),
    "saidaAbrigoEm" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "familias_atingidas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "familias_atingidas_ocorrenciaId_idx" ON "familias_atingidas"("ocorrenciaId");
CREATE INDEX "familias_atingidas_abrigoId_idx" ON "familias_atingidas"("abrigoId");
CREATE INDEX "familias_atingidas_situacao_idx" ON "familias_atingidas"("situacao");
CREATE INDEX "familias_atingidas_cpf_idx" ON "familias_atingidas"("cpf");
CREATE INDEX "familias_atingidas_tenantId_idx" ON "familias_atingidas"("tenantId");

ALTER TABLE "familias_atingidas" ADD CONSTRAINT "familias_atingidas_ocorrenciaId_fkey"
  FOREIGN KEY ("ocorrenciaId") REFERENCES "ocorrencias_defesa_civil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['ocorrencias_defesa_civil', 'abrigos_defesa_civil', 'familias_atingidas'] LOOP
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
