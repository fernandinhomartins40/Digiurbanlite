-- Migration: Renomear coluna teamid para teamId (corrigir case)
-- Esta migration corrige o nome da coluna para manter consistência com camelCase

-- Renomear a coluna de teamid para teamId
ALTER TABLE "equipes_saude" RENAME COLUMN "teamid" TO "teamId";
