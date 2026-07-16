-- ============================================================================
-- AGRICULTURA — App da Secretaria (Fase 1C do plano de apps)
-- Produtores, propriedades, assistência técnica e sementes/mudas.
-- Aditivo e multi-tenant (RLS). Ver PLANO-IMPLEMENTACAO-APPS-SECRETARIAS.md §1C.
-- ============================================================================

CREATE TABLE "produtores_rurais" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "cpf" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "celular" TEXT,
    "email" TEXT,
    "atividadePrincipal" TEXT,
    "dap" TEXT,
    "car" TEXT,
    "numeroCarteirinha" TEXT,
    "carteirinhaEmitidaEm" TIMESTAMP(3),
    "fotoUrl" TEXT,
    "observacoes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtores_rurais_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "produtores_rurais_protocolId_key" ON "produtores_rurais"("protocolId");
CREATE UNIQUE INDEX "produtores_rurais_tenantId_cpf_key" ON "produtores_rurais"("tenantId", "cpf");
CREATE UNIQUE INDEX "produtores_rurais_tenantId_numeroCarteirinha_key" ON "produtores_rurais"("tenantId", "numeroCarteirinha");
CREATE INDEX "produtores_rurais_citizenId_idx" ON "produtores_rurais"("citizenId");
CREATE INDEX "produtores_rurais_isActive_idx" ON "produtores_rurais"("isActive");
CREATE INDEX "produtores_rurais_tenantId_idx" ON "produtores_rurais"("tenantId");

CREATE TABLE "propriedades_rurais" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "produtorId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "bairro" TEXT,
    "areaHectares" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "car" TEXT,
    "atividades" JSONB,
    "fotos" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "propriedades_rurais_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "propriedades_rurais_produtorId_idx" ON "propriedades_rurais"("produtorId");
CREATE INDEX "propriedades_rurais_isActive_idx" ON "propriedades_rurais"("isActive");
CREATE INDEX "propriedades_rurais_tenantId_idx" ON "propriedades_rurais"("tenantId");

ALTER TABLE "propriedades_rurais" ADD CONSTRAINT "propriedades_rurais_produtorId_fkey"
  FOREIGN KEY ("produtorId") REFERENCES "produtores_rurais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "tecnicos_agricolas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "nome" TEXT NOT NULL,
    "registro" TEXT,
    "especialidade" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tecnicos_agricolas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tecnicos_agricolas_isActive_idx" ON "tecnicos_agricolas"("isActive");
CREATE INDEX "tecnicos_agricolas_tenantId_idx" ON "tecnicos_agricolas"("tenantId");

CREATE TABLE "solicitacoes_assistencia_tecnica" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "produtorId" TEXT NOT NULL,
    "propriedadeId" TEXT,
    "tecnicoId" TEXT,
    "tipoAssistencia" TEXT NOT NULL,
    "descricao" TEXT,
    "prioridade" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacoes_assistencia_tecnica_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "solicitacoes_assistencia_tecnica_protocolId_key" ON "solicitacoes_assistencia_tecnica"("protocolId");
CREATE INDEX "solicitacoes_assistencia_tecnica_produtorId_idx" ON "solicitacoes_assistencia_tecnica"("produtorId");
CREATE INDEX "solicitacoes_assistencia_tecnica_status_idx" ON "solicitacoes_assistencia_tecnica"("status");
CREATE INDEX "solicitacoes_assistencia_tecnica_tenantId_idx" ON "solicitacoes_assistencia_tecnica"("tenantId");

ALTER TABLE "solicitacoes_assistencia_tecnica" ADD CONSTRAINT "solicitacoes_assistencia_tecnica_produtorId_fkey"
  FOREIGN KEY ("produtorId") REFERENCES "produtores_rurais"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "solicitacoes_assistencia_tecnica" ADD CONSTRAINT "solicitacoes_assistencia_tecnica_propriedadeId_fkey"
  FOREIGN KEY ("propriedadeId") REFERENCES "propriedades_rurais"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "solicitacoes_assistencia_tecnica" ADD CONSTRAINT "solicitacoes_assistencia_tecnica_tecnicoId_fkey"
  FOREIGN KEY ("tecnicoId") REFERENCES "tecnicos_agricolas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "visitas_assistencia_tecnica" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "solicitacaoId" TEXT NOT NULL,
    "tecnicoId" TEXT,
    "dataAgendada" TIMESTAMP(3) NOT NULL,
    "dataInicio" TIMESTAMP(3),
    "dataConclusao" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'AGENDADA',
    "diagnostico" TEXT,
    "recomendacoes" TEXT,
    "fotos" JSONB,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitas_assistencia_tecnica_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "visitas_assistencia_tecnica_solicitacaoId_idx" ON "visitas_assistencia_tecnica"("solicitacaoId");
CREATE INDEX "visitas_assistencia_tecnica_status_idx" ON "visitas_assistencia_tecnica"("status");
CREATE INDEX "visitas_assistencia_tecnica_tenantId_idx" ON "visitas_assistencia_tecnica"("tenantId");

ALTER TABLE "visitas_assistencia_tecnica" ADD CONSTRAINT "visitas_assistencia_tecnica_solicitacaoId_fkey"
  FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacoes_assistencia_tecnica"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "visitas_assistencia_tecnica" ADD CONSTRAINT "visitas_assistencia_tecnica_tecnicoId_fkey"
  FOREIGN KEY ("tecnicoId") REFERENCES "tecnicos_agricolas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "estoque_sementes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'SEMENTE',
    "cultura" TEXT NOT NULL,
    "variedade" TEXT,
    "unidadeMedida" TEXT NOT NULL DEFAULT 'kg',
    "quantidade" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estoqueMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lote" TEXT,
    "validade" TIMESTAMP(3),
    "origem" TEXT,
    "observacoes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estoque_sementes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "estoque_sementes_cultura_idx" ON "estoque_sementes"("cultura");
CREATE INDEX "estoque_sementes_isActive_idx" ON "estoque_sementes"("isActive");
CREATE INDEX "estoque_sementes_tenantId_idx" ON "estoque_sementes"("tenantId");

CREATE TABLE "distribuicoes_sementes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "estoqueId" TEXT NOT NULL,
    "produtorId" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "dataDistribuicao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "safra" TEXT,
    "responsavelId" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribuicoes_sementes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "distribuicoes_sementes_protocolId_key" ON "distribuicoes_sementes"("protocolId");
CREATE INDEX "distribuicoes_sementes_estoqueId_idx" ON "distribuicoes_sementes"("estoqueId");
CREATE INDEX "distribuicoes_sementes_produtorId_idx" ON "distribuicoes_sementes"("produtorId");
CREATE INDEX "distribuicoes_sementes_dataDistribuicao_idx" ON "distribuicoes_sementes"("dataDistribuicao");
CREATE INDEX "distribuicoes_sementes_tenantId_idx" ON "distribuicoes_sementes"("tenantId");

ALTER TABLE "distribuicoes_sementes" ADD CONSTRAINT "distribuicoes_sementes_estoqueId_fkey"
  FOREIGN KEY ("estoqueId") REFERENCES "estoque_sementes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "distribuicoes_sementes" ADD CONSTRAINT "distribuicoes_sementes_produtorId_fkey"
  FOREIGN KEY ("produtorId") REFERENCES "produtores_rurais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'produtores_rurais',
    'propriedades_rurais',
    'tecnicos_agricolas',
    'solicitacoes_assistencia_tecnica',
    'visitas_assistencia_tecnica',
    'estoque_sementes',
    'distribuicoes_sementes'
  ] LOOP
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
