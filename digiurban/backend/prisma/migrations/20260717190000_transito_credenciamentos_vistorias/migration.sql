-- ============================================================================
-- CREDENCIAMENTOS & VISTORIAS — App de Transportes e Trânsito (Fase 3,
-- B4-lite + carteirinha). Aditivo e multi-tenant (RLS).
-- ============================================================================

CREATE TABLE "credenciais_transporte" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "tipo" TEXT NOT NULL,
    "titularNome" TEXT,
    "cpf" TEXT,
    "citizenId" TEXT,
    "telefone" TEXT,
    "veiculoPlaca" TEXT,
    "veiculoModelo" TEXT,
    "veiculoAno" INTEGER,
    "ponto" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SOLICITADA',
    "numeroCredencial" TEXT,
    "validade" TIMESTAMP(3),
    "emitidaEm" TIMESTAMP(3),
    "observacoes" TEXT,
    "dados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credenciais_transporte_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "credenciais_transporte_protocolId_key" ON "credenciais_transporte"("protocolId");
CREATE INDEX "credenciais_transporte_tipo_status_idx" ON "credenciais_transporte"("tipo", "status");
CREATE INDEX "credenciais_transporte_cpf_idx" ON "credenciais_transporte"("cpf");
CREATE INDEX "credenciais_transporte_citizenId_idx" ON "credenciais_transporte"("citizenId");
CREATE INDEX "credenciais_transporte_tenantId_idx" ON "credenciais_transporte"("tenantId");

CREATE TABLE "vistorias_veiculo" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "credencialId" TEXT,
    "veiculoPlaca" TEXT,
    "solicitanteNome" TEXT,
    "citizenId" TEXT,
    "agendadaPara" TIMESTAMP(3),
    "realizadaEm" TIMESTAMP(3),
    "resultado" TEXT,
    "itens" TEXT,
    "vistoriador" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SOLICITADA',
    "observacoes" TEXT,
    "dados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vistorias_veiculo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vistorias_veiculo_protocolId_key" ON "vistorias_veiculo"("protocolId");
CREATE INDEX "vistorias_veiculo_credencialId_idx" ON "vistorias_veiculo"("credencialId");
CREATE INDEX "vistorias_veiculo_status_idx" ON "vistorias_veiculo"("status");
CREATE INDEX "vistorias_veiculo_tenantId_idx" ON "vistorias_veiculo"("tenantId");

CREATE TABLE "defesas_autuacao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "numeroAutuacao" TEXT,
    "requerenteNome" TEXT,
    "cpf" TEXT,
    "citizenId" TEXT,
    "veiculoPlaca" TEXT,
    "motivo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEBIDA',
    "parecerJari" TEXT,
    "julgadaEm" TIMESTAMP(3),
    "dados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "defesas_autuacao_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "defesas_autuacao_protocolId_key" ON "defesas_autuacao"("protocolId");
CREATE INDEX "defesas_autuacao_status_idx" ON "defesas_autuacao"("status");
CREATE INDEX "defesas_autuacao_citizenId_idx" ON "defesas_autuacao"("citizenId");
CREATE INDEX "defesas_autuacao_tenantId_idx" ON "defesas_autuacao"("tenantId");

ALTER TABLE "vistorias_veiculo" ADD CONSTRAINT "vistorias_veiculo_credencialId_fkey"
  FOREIGN KEY ("credencialId") REFERENCES "credenciais_transporte"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['credenciais_transporte', 'vistorias_veiculo', 'defesas_autuacao'] LOOP
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
