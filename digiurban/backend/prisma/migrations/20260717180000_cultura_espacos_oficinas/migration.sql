-- ============================================================================
-- ESPAÇOS & OFICINAS CULTURAIS — App da Secretaria de Cultura (Fase 3,
-- B5 + B6 + B4-lite). Aditivo e multi-tenant (RLS). Reservas de espaço
-- compartilham reservas_espaco com o app de Esportes via coluna "area".
-- ============================================================================

ALTER TABLE "reservas_espaco" ADD COLUMN "area" TEXT NOT NULL DEFAULT 'ESPORTES';
CREATE INDEX "reservas_espaco_area_status_idx" ON "reservas_espaco"("area", "status");

CREATE TABLE "oficinas_culturais" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "atividade" TEXT,
    "instrutor" TEXT,
    "espacoId" TEXT,
    "diasHorarios" TEXT,
    "vagas" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oficinas_culturais_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "oficinas_culturais_tenantId_nome_key" ON "oficinas_culturais"("tenantId", "nome");
CREATE INDEX "oficinas_culturais_categoria_isActive_idx" ON "oficinas_culturais"("categoria", "isActive");
CREATE INDEX "oficinas_culturais_tenantId_idx" ON "oficinas_culturais"("tenantId");

CREATE TABLE "matriculas_oficina" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "oficinaId" TEXT,
    "atividadePretendida" TEXT,
    "nome" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "responsavelNome" TEXT,
    "telefone" TEXT,
    "citizenId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INSCRITA',
    "observacoes" TEXT,
    "dados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matriculas_oficina_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "matriculas_oficina_protocolId_key" ON "matriculas_oficina"("protocolId");
CREATE INDEX "matriculas_oficina_oficinaId_idx" ON "matriculas_oficina"("oficinaId");
CREATE INDEX "matriculas_oficina_status_idx" ON "matriculas_oficina"("status");
CREATE INDEX "matriculas_oficina_citizenId_idx" ON "matriculas_oficina"("citizenId");
CREATE INDEX "matriculas_oficina_tenantId_idx" ON "matriculas_oficina"("tenantId");

CREATE TABLE "frequencias_oficina" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "oficinaId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "presentes" JSONB,
    "registradoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "frequencias_oficina_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "frequencias_oficina_oficinaId_data_key" ON "frequencias_oficina"("oficinaId", "data");
CREATE INDEX "frequencias_oficina_oficinaId_idx" ON "frequencias_oficina"("oficinaId");
CREATE INDEX "frequencias_oficina_tenantId_idx" ON "frequencias_oficina"("tenantId");

CREATE TABLE "editais_culturais" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "descricao" TEXT,
    "dataInicioInscricoes" TIMESTAMP(3),
    "dataFimInscricoes" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'INSCRICOES_ABERTAS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editais_culturais_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "editais_culturais_tenantId_nome_key" ON "editais_culturais"("tenantId", "nome");
CREATE INDEX "editais_culturais_status_idx" ON "editais_culturais"("status");
CREATE INDEX "editais_culturais_tenantId_idx" ON "editais_culturais"("tenantId");

CREATE TABLE "projetos_culturais" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "editalId" TEXT,
    "titulo" TEXT,
    "proponente" TEXT,
    "citizenId" TEXT,
    "telefone" TEXT,
    "categoria" TEXT,
    "descricao" TEXT,
    "valorSolicitado" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'RECEBIDO',
    "dados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projetos_culturais_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "projetos_culturais_protocolId_key" ON "projetos_culturais"("protocolId");
CREATE INDEX "projetos_culturais_editalId_idx" ON "projetos_culturais"("editalId");
CREATE INDEX "projetos_culturais_status_idx" ON "projetos_culturais"("status");
CREATE INDEX "projetos_culturais_citizenId_idx" ON "projetos_culturais"("citizenId");
CREATE INDEX "projetos_culturais_tenantId_idx" ON "projetos_culturais"("tenantId");

CREATE TABLE "pareceres_projeto_cultural" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "projetoId" TEXT NOT NULL,
    "autorId" TEXT,
    "autorNome" TEXT,
    "recomendacao" TEXT,
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pareceres_projeto_cultural_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pareceres_projeto_cultural_projetoId_idx" ON "pareceres_projeto_cultural"("projetoId");
CREATE INDEX "pareceres_projeto_cultural_tenantId_idx" ON "pareceres_projeto_cultural"("tenantId");

CREATE TABLE "emprestimos_equipamento_cultural" (
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

    CONSTRAINT "emprestimos_equipamento_cultural_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "emprestimos_equipamento_cultural_protocolId_key" ON "emprestimos_equipamento_cultural"("protocolId");
CREATE INDEX "emprestimos_equipamento_cultural_status_idx" ON "emprestimos_equipamento_cultural"("status");
CREATE INDEX "emprestimos_equipamento_cultural_citizenId_idx" ON "emprestimos_equipamento_cultural"("citizenId");
CREATE INDEX "emprestimos_equipamento_cultural_tenantId_idx" ON "emprestimos_equipamento_cultural"("tenantId");

ALTER TABLE "matriculas_oficina" ADD CONSTRAINT "matriculas_oficina_oficinaId_fkey"
  FOREIGN KEY ("oficinaId") REFERENCES "oficinas_culturais"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "frequencias_oficina" ADD CONSTRAINT "frequencias_oficina_oficinaId_fkey"
  FOREIGN KEY ("oficinaId") REFERENCES "oficinas_culturais"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "projetos_culturais" ADD CONSTRAINT "projetos_culturais_editalId_fkey"
  FOREIGN KEY ("editalId") REFERENCES "editais_culturais"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pareceres_projeto_cultural" ADD CONSTRAINT "pareceres_projeto_cultural_projetoId_fkey"
  FOREIGN KEY ("projetoId") REFERENCES "projetos_culturais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['oficinas_culturais', 'matriculas_oficina', 'frequencias_oficina', 'editais_culturais', 'projetos_culturais', 'pareceres_projeto_cultural', 'emprestimos_equipamento_cultural'] LOOP
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
