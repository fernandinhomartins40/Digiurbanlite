-- MIGRATION VESTIGIAL (condicional — REPARO Fase 0 Multi-Tenant, achado B7):
-- Cria "profissional_especialidade" com FK para "profissional_saude", tabela
-- que NUNCA é criada por migration alguma (drift via db push) e que não existe
-- mais no schema atual (modelo legado substituído por User; ver migration
-- 20260204000000_remove_legacy_health_models). Em bancos novos, nada a fazer.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profissional_saude') THEN
    RAISE NOTICE 'Tabela legada profissional_saude não existe — migration vestigial ignorada.';
    RETURN;
  END IF;

  -- CreateTable: ProfissionalEspecialidade (N:N Profissional x Especialidade)
  CREATE TABLE IF NOT EXISTS "profissional_especialidade" (
      "id" TEXT NOT NULL,
      "profissionalId" TEXT NOT NULL,
      "especialidadeId" TEXT NOT NULL,
      "isPrincipal" BOOLEAN NOT NULL DEFAULT false,
      "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dataFim" TIMESTAMP(3),
      "ativo" BOOLEAN NOT NULL DEFAULT true,
      "observacoes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,

      CONSTRAINT "profissional_especialidade_pkey" PRIMARY KEY ("id")
  );

  -- CreateIndex
  CREATE UNIQUE INDEX IF NOT EXISTS "profissional_especialidade_profissionalId_especialidadeId_key" ON "profissional_especialidade"("profissionalId", "especialidadeId");
  CREATE INDEX IF NOT EXISTS "profissional_especialidade_profissionalId_ativo_idx" ON "profissional_especialidade"("profissionalId", "ativo");
  CREATE INDEX IF NOT EXISTS "profissional_especialidade_especialidadeId_ativo_idx" ON "profissional_especialidade"("especialidadeId", "ativo");
  CREATE INDEX IF NOT EXISTS "profissional_especialidade_isPrincipal_ativo_idx" ON "profissional_especialidade"("isPrincipal", "ativo");

  -- AddForeignKey
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'profissional_especialidade_profissionalId_fkey') THEN
    ALTER TABLE "profissional_especialidade" ADD CONSTRAINT "profissional_especialidade_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissional_saude"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'profissional_especialidade_especialidadeId_fkey') THEN
    ALTER TABLE "profissional_especialidade" ADD CONSTRAINT "profissional_especialidade_especialidadeId_fkey" FOREIGN KEY ("especialidadeId") REFERENCES "especialidade_medica"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
