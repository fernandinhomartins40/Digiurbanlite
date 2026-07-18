-- ============================================================================
-- ESCOLINHAS & ESPAÇOS ESPORTIVOS — App da Secretaria de Esportes (Fase 2,
-- B5 + B6 + B3-lite). Aditivo e multi-tenant (RLS). Reaproveita
-- espacos_publicos já existente para as reservas.
-- ============================================================================

CREATE TABLE "turmas_escolinha" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "nome" TEXT NOT NULL,
    "modalidade" TEXT NOT NULL,
    "faixaEtaria" TEXT,
    "professor" TEXT,
    "espacoId" TEXT,
    "diasHorarios" TEXT,
    "vagas" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turmas_escolinha_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "turmas_escolinha_tenantId_nome_key" ON "turmas_escolinha"("tenantId", "nome");
CREATE INDEX "turmas_escolinha_modalidade_isActive_idx" ON "turmas_escolinha"("modalidade", "isActive");
CREATE INDEX "turmas_escolinha_tenantId_idx" ON "turmas_escolinha"("tenantId");

CREATE TABLE "matriculas_escolinha" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "turmaId" TEXT,
    "modalidadePretendida" TEXT,
    "nomeAluno" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "responsavelNome" TEXT,
    "telefone" TEXT,
    "citizenId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INSCRITA',
    "observacoes" TEXT,
    "dados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matriculas_escolinha_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "matriculas_escolinha_protocolId_key" ON "matriculas_escolinha"("protocolId");
CREATE INDEX "matriculas_escolinha_turmaId_idx" ON "matriculas_escolinha"("turmaId");
CREATE INDEX "matriculas_escolinha_status_idx" ON "matriculas_escolinha"("status");
CREATE INDEX "matriculas_escolinha_citizenId_idx" ON "matriculas_escolinha"("citizenId");
CREATE INDEX "matriculas_escolinha_tenantId_idx" ON "matriculas_escolinha"("tenantId");

CREATE TABLE "frequencias_escolinha" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "turmaId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "presentes" JSONB,
    "registradoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "frequencias_escolinha_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "frequencias_escolinha_turmaId_data_key" ON "frequencias_escolinha"("turmaId", "data");
CREATE INDEX "frequencias_escolinha_turmaId_idx" ON "frequencias_escolinha"("turmaId");
CREATE INDEX "frequencias_escolinha_tenantId_idx" ON "frequencias_escolinha"("tenantId");

CREATE TABLE "reservas_espaco" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "espacoId" TEXT,
    "solicitanteNome" TEXT,
    "citizenId" TEXT,
    "data" TIMESTAMP(3),
    "horaInicio" TEXT,
    "horaFim" TEXT,
    "finalidade" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SOLICITADA',
    "observacoes" TEXT,
    "dados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_espaco_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reservas_espaco_protocolId_key" ON "reservas_espaco"("protocolId");
CREATE INDEX "reservas_espaco_espacoId_data_idx" ON "reservas_espaco"("espacoId", "data");
CREATE INDEX "reservas_espaco_status_idx" ON "reservas_espaco"("status");
CREATE INDEX "reservas_espaco_citizenId_idx" ON "reservas_espaco"("citizenId");
CREATE INDEX "reservas_espaco_tenantId_idx" ON "reservas_espaco"("tenantId");

CREATE TABLE "competicoes_esportivas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "nome" TEXT NOT NULL,
    "modalidade" TEXT,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "local" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INSCRICOES_ABERTAS',
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competicoes_esportivas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "competicoes_esportivas_tenantId_nome_key" ON "competicoes_esportivas"("tenantId", "nome");
CREATE INDEX "competicoes_esportivas_status_idx" ON "competicoes_esportivas"("status");
CREATE INDEX "competicoes_esportivas_tenantId_idx" ON "competicoes_esportivas"("tenantId");

CREATE TABLE "inscricoes_competicao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "competicaoId" TEXT,
    "participante" TEXT,
    "categoria" TEXT,
    "citizenId" TEXT,
    "telefone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INSCRITA',
    "dados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscricoes_competicao_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inscricoes_competicao_protocolId_key" ON "inscricoes_competicao"("protocolId");
CREATE INDEX "inscricoes_competicao_competicaoId_idx" ON "inscricoes_competicao"("competicaoId");
CREATE INDEX "inscricoes_competicao_status_idx" ON "inscricoes_competicao"("status");
CREATE INDEX "inscricoes_competicao_tenantId_idx" ON "inscricoes_competicao"("tenantId");

CREATE TABLE "emprestimos_material_esportivo" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "item" TEXT,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "solicitanteNome" TEXT,
    "citizenId" TEXT,
    "telefone" TEXT,
    "dataEmprestimo" TIMESTAMP(3),
    "dataPrevistaDevolucao" TIMESTAMP(3),
    "dataDevolucao" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SOLICITADO',
    "observacoes" TEXT,
    "dados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emprestimos_material_esportivo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "emprestimos_material_esportivo_protocolId_key" ON "emprestimos_material_esportivo"("protocolId");
CREATE INDEX "emprestimos_material_esportivo_status_idx" ON "emprestimos_material_esportivo"("status");
CREATE INDEX "emprestimos_material_esportivo_citizenId_idx" ON "emprestimos_material_esportivo"("citizenId");
CREATE INDEX "emprestimos_material_esportivo_tenantId_idx" ON "emprestimos_material_esportivo"("tenantId");

ALTER TABLE "matriculas_escolinha" ADD CONSTRAINT "matriculas_escolinha_turmaId_fkey"
  FOREIGN KEY ("turmaId") REFERENCES "turmas_escolinha"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "frequencias_escolinha" ADD CONSTRAINT "frequencias_escolinha_turmaId_fkey"
  FOREIGN KEY ("turmaId") REFERENCES "turmas_escolinha"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inscricoes_competicao" ADD CONSTRAINT "inscricoes_competicao_competicaoId_fkey"
  FOREIGN KEY ("competicaoId") REFERENCES "competicoes_esportivas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['turmas_escolinha', 'matriculas_escolinha', 'frequencias_escolinha', 'reservas_espaco', 'competicoes_esportivas', 'inscricoes_competicao', 'emprestimos_material_esportivo'] LOOP
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
