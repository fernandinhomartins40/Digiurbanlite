-- Migration intermediária: Adicionar colunas necessárias antes do sistema unificado
-- Esta migration prepara as tabelas de saúde para integração com o sistema unificado

-- Adicionar coluna organizationalUnitId em unidades_saude
ALTER TABLE "unidades_saude" ADD COLUMN IF NOT EXISTS "organizationalUnitId" TEXT;

-- Adicionar coluna teamId em equipes_saude
ALTER TABLE "equipes_saude" ADD COLUMN IF NOT EXISTS "teamId" TEXT;

-- Criar índices (sem unique constraint ainda, será adicionado depois)
CREATE INDEX IF NOT EXISTS "unidades_saude_organizationalUnitId_idx" ON "unidades_saude"("organizationalUnitId");
CREATE INDEX IF NOT EXISTS "equipes_saude_teamId_idx" ON "equipes_saude"("teamId");
