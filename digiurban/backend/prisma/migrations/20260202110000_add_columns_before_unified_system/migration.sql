-- Migration intermediária: Adicionar colunas necessárias antes do sistema unificado
-- REPARO (Fase 0 Multi-Tenant, achado B5/B7): apesar do nome, esta migration
-- ordena DEPOIS da 20260202100000 (110000 > 100000). As tabelas de saúde
-- (unidades_saude, equipes_saude) são drift (criadas via db push) e podem não
-- existir em banco novo — tudo condicional; a baseline final converge o estado.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unidades_saude') THEN
    ALTER TABLE "unidades_saude" ADD COLUMN IF NOT EXISTS "organizationalUnitId" TEXT;
    CREATE INDEX IF NOT EXISTS "unidades_saude_organizationalUnitId_idx" ON "unidades_saude"("organizationalUnitId");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipes_saude') THEN
    ALTER TABLE "equipes_saude" ADD COLUMN IF NOT EXISTS "teamId" TEXT;
    CREATE INDEX IF NOT EXISTS "equipes_saude_teamId_idx" ON "equipes_saude"("teamId");
  END IF;
END $$;
