-- Apps gerais (2026-10-09): Agenda de Atendimentos, Cursos e Capacitações, Feiras e Mercados, Cemitérios e pedidos de insumos da Agricultura

CREATE TABLE "agendamentos_atendimento" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "numero" TEXT,
    "departmentCode" TEXT NOT NULL,
    "servico" TEXT NOT NULL,
    "assunto" TEXT,
    "modalidade" TEXT NOT NULL DEFAULT 'PRESENCIAL',
    "citizenId" TEXT,
    "solicitanteNome" TEXT,
    "telefone" TEXT,
    "preferencia" TEXT,
    "endereco" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO',
    "dataHora" TIMESTAMP(3),
    "duracaoMin" INTEGER NOT NULL DEFAULT 30,
    "local" TEXT,
    "profissionalId" TEXT,
    "profissionalNome" TEXT,
    "observacoes" TEXT,
    "historico" JSONB,
    "encerradoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendamentos_atendimento_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cursos_municipais" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "departmentCode" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "publicoAlvo" TEXT,
    "local" TEXT,
    "horario" TEXT,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "vagas" INTEGER NOT NULL DEFAULT 20,
    "totalAulas" INTEGER NOT NULL DEFAULT 0,
    "frequenciaMinima" INTEGER NOT NULL DEFAULT 75,
    "instrutor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INSCRICOES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cursos_municipais_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inscricoes_cursos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "departmentCode" TEXT NOT NULL,
    "cursoId" TEXT,
    "interesse" TEXT NOT NULL,
    "citizenId" TEXT,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "escolaridade" TEXT,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO',
    "presencas" INTEGER NOT NULL DEFAULT 0,
    "historico" JSONB,
    "encerradoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscricoes_cursos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "espacos_comerciais" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "departmentCode" TEXT NOT NULL DEFAULT 'SERVICOS_PUBLICOS',
    "local" TEXT NOT NULL,
    "identificacao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'BOX',
    "diaFuncionamento" TEXT,
    "status" TEXT NOT NULL DEFAULT 'LIVRE',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "espacos_comerciais_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "permissoes_uso_espaco" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "numero" TEXT,
    "departmentCode" TEXT NOT NULL DEFAULT 'SERVICOS_PUBLICOS',
    "tipoPedido" TEXT NOT NULL DEFAULT 'PERMISSAO',
    "espacoId" TEXT,
    "localDesejado" TEXT,
    "citizenId" TEXT,
    "titularNome" TEXT NOT NULL,
    "documento" TEXT,
    "telefone" TEXT,
    "atividade" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO',
    "validade" TIMESTAMP(3),
    "historico" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissoes_uso_espaco_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "jazigos_cemiterio" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "cemiterio" TEXT NOT NULL,
    "quadra" TEXT,
    "numero" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'SEPULTURA',
    "status" TEXT NOT NULL DEFAULT 'LIVRE',
    "titularNome" TEXT,
    "titularCitizenId" TEXT,
    "titularDocumento" TEXT,
    "concessaoAte" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jazigos_cemiterio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sepultamentos_registro" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "jazigoId" TEXT NOT NULL,
    "falecidoNome" TEXT NOT NULL,
    "dataObito" TIMESTAMP(3),
    "dataSepultamento" TIMESTAMP(3) NOT NULL,
    "certidaoObito" TEXT,
    "exumadoEm" TIMESTAMP(3),
    "destinoRestos" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sepultamentos_registro_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pedidos_cemiterio" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "numero" TEXT,
    "tipo" TEXT NOT NULL,
    "jazigoId" TEXT,
    "cemiterioDesejado" TEXT,
    "localizacaoInformada" TEXT,
    "citizenId" TEXT,
    "solicitanteNome" TEXT NOT NULL,
    "telefone" TEXT,
    "falecidoNome" TEXT,
    "dataObito" TIMESTAMP(3),
    "novoTitularNome" TEXT,
    "novoTitularDocumento" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO',
    "dataAgendada" TIMESTAMP(3),
    "historico" JSONB,
    "encerradoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_cemiterio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pedidos_insumos_agricolas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "produtorId" TEXT,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'SEMENTE',
    "item" TEXT,
    "quantidade" TEXT,
    "areaHectares" DOUBLE PRECISION,
    "finalidade" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO',
    "distribuicaoId" TEXT,
    "resposta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_insumos_agricolas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agendamentos_atendimento_protocolId_key" ON "agendamentos_atendimento"("protocolId");

CREATE INDEX "agendamentos_atendimento_tenantId_idx" ON "agendamentos_atendimento"("tenantId");

CREATE INDEX "agendamentos_atendimento_departmentCode_status_idx" ON "agendamentos_atendimento"("departmentCode", "status");

CREATE INDEX "agendamentos_atendimento_dataHora_idx" ON "agendamentos_atendimento"("dataHora");

CREATE INDEX "cursos_municipais_tenantId_idx" ON "cursos_municipais"("tenantId");

CREATE INDEX "cursos_municipais_departmentCode_status_idx" ON "cursos_municipais"("departmentCode", "status");

CREATE UNIQUE INDEX "inscricoes_cursos_protocolId_key" ON "inscricoes_cursos"("protocolId");

CREATE INDEX "inscricoes_cursos_tenantId_idx" ON "inscricoes_cursos"("tenantId");

CREATE INDEX "inscricoes_cursos_departmentCode_status_idx" ON "inscricoes_cursos"("departmentCode", "status");

CREATE INDEX "inscricoes_cursos_cursoId_idx" ON "inscricoes_cursos"("cursoId");

CREATE INDEX "espacos_comerciais_tenantId_idx" ON "espacos_comerciais"("tenantId");

CREATE INDEX "espacos_comerciais_local_status_idx" ON "espacos_comerciais"("local", "status");

CREATE UNIQUE INDEX "permissoes_uso_espaco_protocolId_key" ON "permissoes_uso_espaco"("protocolId");

CREATE INDEX "permissoes_uso_espaco_tenantId_idx" ON "permissoes_uso_espaco"("tenantId");

CREATE INDEX "permissoes_uso_espaco_departmentCode_status_idx" ON "permissoes_uso_espaco"("departmentCode", "status");

CREATE INDEX "permissoes_uso_espaco_espacoId_idx" ON "permissoes_uso_espaco"("espacoId");

CREATE INDEX "jazigos_cemiterio_tenantId_idx" ON "jazigos_cemiterio"("tenantId");

CREATE INDEX "jazigos_cemiterio_cemiterio_status_idx" ON "jazigos_cemiterio"("cemiterio", "status");

CREATE INDEX "sepultamentos_registro_tenantId_idx" ON "sepultamentos_registro"("tenantId");

CREATE INDEX "sepultamentos_registro_jazigoId_idx" ON "sepultamentos_registro"("jazigoId");

CREATE UNIQUE INDEX "pedidos_cemiterio_protocolId_key" ON "pedidos_cemiterio"("protocolId");

CREATE INDEX "pedidos_cemiterio_tenantId_idx" ON "pedidos_cemiterio"("tenantId");

CREATE INDEX "pedidos_cemiterio_tipo_status_idx" ON "pedidos_cemiterio"("tipo", "status");

CREATE INDEX "pedidos_cemiterio_jazigoId_idx" ON "pedidos_cemiterio"("jazigoId");

CREATE UNIQUE INDEX "pedidos_insumos_agricolas_protocolId_key" ON "pedidos_insumos_agricolas"("protocolId");

CREATE INDEX "pedidos_insumos_agricolas_tenantId_idx" ON "pedidos_insumos_agricolas"("tenantId");

CREATE INDEX "pedidos_insumos_agricolas_status_idx" ON "pedidos_insumos_agricolas"("status");

ALTER TABLE "inscricoes_cursos" ADD CONSTRAINT "inscricoes_cursos_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos_municipais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "permissoes_uso_espaco" ADD CONSTRAINT "permissoes_uso_espaco_espacoId_fkey" FOREIGN KEY ("espacoId") REFERENCES "espacos_comerciais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sepultamentos_registro" ADD CONSTRAINT "sepultamentos_registro_jazigoId_fkey" FOREIGN KEY ("jazigoId") REFERENCES "jazigos_cemiterio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pedidos_cemiterio" ADD CONSTRAINT "pedidos_cemiterio_jazigoId_fkey" FOREIGN KEY ("jazigoId") REFERENCES "jazigos_cemiterio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['agendamentos_atendimento', 'cursos_municipais', 'inscricoes_cursos', 'espacos_comerciais', 'permissoes_uso_espaco', 'jazigos_cemiterio', 'sepultamentos_registro', 'pedidos_cemiterio', 'pedidos_insumos_agricolas'] LOOP
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
