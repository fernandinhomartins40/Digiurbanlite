-- ============================================================================
-- APPS NOVOS (Fase 3 da auditoria de 2026-10-08): Mecanização agrícola,
-- Balcão de Empregos, Ocorrências de Segurança e Cadastro do Turismo.
-- Aditivo e multi-tenant (RLS).
-- ============================================================================

CREATE TABLE "servicos_mecanizacao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "produtorId" TEXT,
    "solicitanteNome" TEXT,
    "telefone" TEXT,
    "tipoMaquina" TEXT NOT NULL,
    "maquinaId" TEXT,
    "operador" TEXT,
    "local" TEXT,
    "areaHectares" DOUBLE PRECISION,
    "descricao" TEXT,
    "dataDesejada" TIMESTAMP(3),
    "dataAgendada" TIMESTAMP(3),
    "horasPrevistas" DOUBLE PRECISION,
    "horasRealizadas" DOUBLE PRECISION,
    "valorCobrado" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'SOLICITADO',
    "motivo" TEXT,
    "observacoes" TEXT,
    "iniciadoEm" TIMESTAMP(3),
    "concluidoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicos_mecanizacao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "curriculos_trabalhadores" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "escolaridade" TEXT,
    "areaInteresse" TEXT,
    "experiencia" TEXT,
    "habilidades" TEXT,
    "disponibilidade" BOOLEAN NOT NULL DEFAULT true,
    "pcd" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculos_trabalhadores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vagas_emprego" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "empresa" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "area" TEXT,
    "escolaridadeMinima" TEXT,
    "salario" TEXT,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "tipoContrato" TEXT,
    "local" TEXT,
    "contato" TEXT,
    "pcd" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vagas_emprego_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "encaminhamentos_emprego" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "vagaId" TEXT NOT NULL,
    "curriculoId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ENCAMINHADO',
    "observacao" TEXT,
    "criadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encaminhamentos_emprego_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ocorrencias_seguranca" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "numero" TEXT,
    "tipo" TEXT NOT NULL,
    "natureza" TEXT,
    "anonima" BOOLEAN NOT NULL DEFAULT false,
    "citizenId" TEXT,
    "solicitanteNome" TEXT,
    "telefone" TEXT,
    "descricao" TEXT NOT NULL,
    "local" TEXT,
    "bairro" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "dataOcorrencia" TIMESTAMP(3),
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "equipe" TEXT,
    "responsavelId" TEXT,
    "providencias" TEXT,
    "historico" JSONB,
    "resolvidaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocorrencias_seguranca_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prestadores_turisticos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "numero" TEXT,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT,
    "nome" TEXT NOT NULL,
    "responsavel" TEXT,
    "cpfCnpj" TEXT,
    "citizenId" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "descricao" TEXT,
    "cadastur" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SOLICITADO',
    "motivo" TEXT,
    "emitidoEm" TIMESTAMP(3),
    "validade" TIMESTAMP(3),
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "dados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prestadores_turisticos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "eventos_turisticos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "nome" TEXT NOT NULL,
    "tipo" TEXT,
    "descricao" TEXT,
    "local" TEXT,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "organizador" TEXT,
    "contato" TEXT,
    "publicoEstimado" INTEGER,
    "apoioSolicitado" TEXT,
    "apoioConcedido" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SOLICITADO',
    "motivo" TEXT,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "dados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_turisticos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "servicos_mecanizacao_protocolId_key" ON "servicos_mecanizacao"("protocolId");

CREATE INDEX "servicos_mecanizacao_tenantId_idx" ON "servicos_mecanizacao"("tenantId");

CREATE INDEX "servicos_mecanizacao_status_idx" ON "servicos_mecanizacao"("status");

CREATE INDEX "servicos_mecanizacao_maquinaId_dataAgendada_idx" ON "servicos_mecanizacao"("maquinaId", "dataAgendada");

CREATE UNIQUE INDEX "curriculos_trabalhadores_protocolId_key" ON "curriculos_trabalhadores"("protocolId");

CREATE INDEX "curriculos_trabalhadores_tenantId_idx" ON "curriculos_trabalhadores"("tenantId");

CREATE INDEX "curriculos_trabalhadores_status_idx" ON "curriculos_trabalhadores"("status");

CREATE INDEX "curriculos_trabalhadores_citizenId_idx" ON "curriculos_trabalhadores"("citizenId");

CREATE INDEX "vagas_emprego_tenantId_idx" ON "vagas_emprego"("tenantId");

CREATE INDEX "vagas_emprego_status_idx" ON "vagas_emprego"("status");

CREATE INDEX "encaminhamentos_emprego_tenantId_idx" ON "encaminhamentos_emprego"("tenantId");

CREATE INDEX "encaminhamentos_emprego_curriculoId_idx" ON "encaminhamentos_emprego"("curriculoId");

CREATE UNIQUE INDEX "encaminhamentos_emprego_vagaId_curriculoId_key" ON "encaminhamentos_emprego"("vagaId", "curriculoId");

CREATE UNIQUE INDEX "ocorrencias_seguranca_protocolId_key" ON "ocorrencias_seguranca"("protocolId");

CREATE INDEX "ocorrencias_seguranca_tenantId_idx" ON "ocorrencias_seguranca"("tenantId");

CREATE INDEX "ocorrencias_seguranca_status_prioridade_idx" ON "ocorrencias_seguranca"("status", "prioridade");

CREATE INDEX "ocorrencias_seguranca_tipo_idx" ON "ocorrencias_seguranca"("tipo");

CREATE UNIQUE INDEX "prestadores_turisticos_protocolId_key" ON "prestadores_turisticos"("protocolId");

CREATE INDEX "prestadores_turisticos_tenantId_idx" ON "prestadores_turisticos"("tenantId");

CREATE INDEX "prestadores_turisticos_tipo_status_idx" ON "prestadores_turisticos"("tipo", "status");

CREATE UNIQUE INDEX "eventos_turisticos_protocolId_key" ON "eventos_turisticos"("protocolId");

CREATE INDEX "eventos_turisticos_tenantId_idx" ON "eventos_turisticos"("tenantId");

CREATE INDEX "eventos_turisticos_status_idx" ON "eventos_turisticos"("status");

CREATE INDEX "eventos_turisticos_dataInicio_idx" ON "eventos_turisticos"("dataInicio");

ALTER TABLE "encaminhamentos_emprego" ADD CONSTRAINT "encaminhamentos_emprego_vagaId_fkey" FOREIGN KEY ("vagaId") REFERENCES "vagas_emprego"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "encaminhamentos_emprego" ADD CONSTRAINT "encaminhamentos_emprego_curriculoId_fkey" FOREIGN KEY ("curriculoId") REFERENCES "curriculos_trabalhadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['servicos_mecanizacao', 'curriculos_trabalhadores', 'vagas_emprego', 'encaminhamentos_emprego', 'ocorrencias_seguranca', 'prestadores_turisticos', 'eventos_turisticos'] LOOP
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
