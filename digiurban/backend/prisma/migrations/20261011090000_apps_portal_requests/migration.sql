-- ============================================================================
-- PEDIDOS DO PORTAL NOS APPS (Fase 1 da auditoria de 2026-10-08).
-- Matrícula e programas sociais passam a guardar o pedido de origem; novas
-- filas: transporte escolar, renovação/troca de ponto de credencial, pedido
-- de consulta e pedido de remédio. Aditivo e multi-tenant (RLS).
-- ============================================================================

ALTER TABLE "inscricoes_matricula"
  ADD COLUMN "protocolId" TEXT,
  ADD COLUMN "nomeAluno" TEXT,
  ADD COLUMN "dataNascimentoAluno" TIMESTAMP(3),
  ADD COLUMN "observacoes" TEXT,
  ALTER COLUMN "alunoId" DROP NOT NULL;
CREATE UNIQUE INDEX "inscricoes_matricula_protocolId_key" ON "inscricoes_matricula"("protocolId");

ALTER TABLE "inscricoes_programas_sociais"
  ADD COLUMN "protocolId" TEXT,
  ADD COLUMN "tipoSolicitado" TEXT,
  ALTER COLUMN "programaId" DROP NOT NULL,
  ALTER COLUMN "familiaId" DROP NOT NULL;
CREATE UNIQUE INDEX "inscricoes_programas_sociais_protocolId_key" ON "inscricoes_programas_sociais"("protocolId");

CREATE TABLE "solicitacoes_transporte_escolar" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "responsavelId" TEXT,
    "alunoId" TEXT,
    "nomeAluno" TEXT NOT NULL,
    "unidadeEscolar" TEXT,
    "serie" TEXT,
    "turno" TEXT,
    "enderecoEmbarque" TEXT,
    "distanciaKm" DOUBLE PRECISION,
    "veiculoAdaptado" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "rotaId" TEXT,
    "alunoRotaId" TEXT,
    "motivo" TEXT,
    "decididoPor" TEXT,
    "decididoEm" TIMESTAMP(3),
    "dados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "solicitacoes_transporte_escolar_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "solicitacoes_transporte_escolar_protocolId_key" ON "solicitacoes_transporte_escolar"("protocolId");
CREATE INDEX "solicitacoes_transporte_escolar_tenantId_idx" ON "solicitacoes_transporte_escolar"("tenantId");
CREATE INDEX "solicitacoes_transporte_escolar_status_idx" ON "solicitacoes_transporte_escolar"("status");

CREATE TABLE "alteracoes_credencial" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "credencialId" TEXT,
    "tipo" TEXT NOT NULL,
    "numeroInformado" TEXT,
    "placa" TEXT,
    "pontoAtual" TEXT,
    "pontoDesejado" TEXT,
    "motivo" TEXT,
    "citizenId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "motivoDecisao" TEXT,
    "decididoPor" TEXT,
    "decididoEm" TIMESTAMP(3),
    "dados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "alteracoes_credencial_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "alteracoes_credencial_protocolId_key" ON "alteracoes_credencial"("protocolId");
CREATE INDEX "alteracoes_credencial_tenantId_idx" ON "alteracoes_credencial"("tenantId");
CREATE INDEX "alteracoes_credencial_status_idx" ON "alteracoes_credencial"("status");
CREATE INDEX "alteracoes_credencial_credencialId_idx" ON "alteracoes_credencial"("credencialId");

CREATE TABLE "solicitacoes_consulta" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "especialidade" TEXT NOT NULL,
    "unidadePreferida" TEXT,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "consultaAgendadaId" TEXT,
    "motivo" TEXT,
    "decididoPor" TEXT,
    "decididoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "solicitacoes_consulta_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "solicitacoes_consulta_protocolId_key" ON "solicitacoes_consulta"("protocolId");
CREATE INDEX "solicitacoes_consulta_tenantId_idx" ON "solicitacoes_consulta"("tenantId");
CREATE INDEX "solicitacoes_consulta_status_idx" ON "solicitacoes_consulta"("status");
CREATE INDEX "solicitacoes_consulta_citizenId_idx" ON "solicitacoes_consulta"("citizenId");

CREATE TABLE "solicitacoes_medicamento" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "medicamento" TEXT NOT NULL,
    "principioAtivo" TEXT,
    "dosagem" TEXT,
    "unidadePreferida" TEXT,
    "usoContinuo" BOOLEAN NOT NULL DEFAULT false,
    "altoCusto" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "motivo" TEXT,
    "decididoPor" TEXT,
    "decididoEm" TIMESTAMP(3),
    "dados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "solicitacoes_medicamento_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "solicitacoes_medicamento_protocolId_key" ON "solicitacoes_medicamento"("protocolId");
CREATE INDEX "solicitacoes_medicamento_tenantId_idx" ON "solicitacoes_medicamento"("tenantId");
CREATE INDEX "solicitacoes_medicamento_status_idx" ON "solicitacoes_medicamento"("status");
CREATE INDEX "solicitacoes_medicamento_citizenId_idx" ON "solicitacoes_medicamento"("citizenId");

-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['solicitacoes_transporte_escolar', 'alteracoes_credencial', 'solicitacoes_consulta', 'solicitacoes_medicamento'] LOOP
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
