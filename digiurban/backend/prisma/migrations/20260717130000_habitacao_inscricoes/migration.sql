-- ============================================================================
-- PROGRAMAS HABITACIONAIS — App da Secretaria de Habitação (Fase 2, B6+fila).
-- Aditivo e multi-tenant (RLS). Aproveita programas_habitacionais e
-- conjuntos_habitacionais já existentes; cria só a raiz de inscrições.
-- ============================================================================

CREATE TABLE "inscricoes_habitacionais" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "protocolId" TEXT,
    "programaId" TEXT,
    "citizenId" TEXT,
    "nome" TEXT,
    "cpf" TEXT,
    "rendaFamiliar" DOUBLE PRECISION,
    "membrosFamilia" INTEGER,
    "criteriosAtendidos" JSONB,
    "pontuacao" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'INSCRITA',
    "conjuntoId" TEXT,
    "unidadeIdentificacao" TEXT,
    "contratoAssinadoEm" TIMESTAMP(3),
    "observacoes" TEXT,
    "dados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscricoes_habitacionais_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inscricoes_habitacionais_protocolId_key" ON "inscricoes_habitacionais"("protocolId");
CREATE INDEX "inscricoes_habitacionais_programaId_idx" ON "inscricoes_habitacionais"("programaId");
CREATE INDEX "inscricoes_habitacionais_status_idx" ON "inscricoes_habitacionais"("status");
CREATE INDEX "inscricoes_habitacionais_citizenId_idx" ON "inscricoes_habitacionais"("citizenId");
CREATE INDEX "inscricoes_habitacionais_cpf_idx" ON "inscricoes_habitacionais"("cpf");
CREATE INDEX "inscricoes_habitacionais_tenantId_idx" ON "inscricoes_habitacionais"("tenantId");

ALTER TABLE "inscricoes_habitacionais" ADD CONSTRAINT "inscricoes_habitacionais_programaId_fkey"
  FOREIGN KEY ("programaId") REFERENCES "programas_habitacionais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['inscricoes_habitacionais'] LOOP
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
