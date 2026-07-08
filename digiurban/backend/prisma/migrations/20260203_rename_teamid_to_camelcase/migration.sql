-- Migration: Renomear coluna teamid para teamId (corrigir case)
-- REPARO (Fase 0 Multi-Tenant, achado B7): equipes_saude é drift (db push);
-- condicional para não abortar deploy em banco novo.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipes_saude' AND column_name = 'teamid') THEN
    ALTER TABLE "equipes_saude" RENAME COLUMN "teamid" TO "teamId";
  END IF;
END $$;
