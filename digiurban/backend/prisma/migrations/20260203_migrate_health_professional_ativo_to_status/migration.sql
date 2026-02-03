-- Migration: Migrar campo ativo (boolean) para status (enum) em health_professional_data
-- Autor: Sistema Unificado V2.0
-- Data: 2026-02-03

-- 1. Criar o enum StatusProfissionalSaude
CREATE TYPE "StatusProfissionalSaude" AS ENUM ('ATIVO', 'INATIVO', 'FERIAS', 'AFASTADO', 'LICENCA');

-- 2. Adicionar coluna status (temporariamente nullable)
ALTER TABLE "health_professional_data" ADD COLUMN "status" "StatusProfissionalSaude";

-- 3. Migrar dados: ativo=true -> ATIVO, ativo=false -> INATIVO
UPDATE "health_professional_data"
SET "status" = CASE
    WHEN "ativo" = true THEN 'ATIVO'::"StatusProfissionalSaude"
    ELSE 'INATIVO'::"StatusProfissionalSaude"
END;

-- 4. Tornar coluna status NOT NULL e adicionar default
ALTER TABLE "health_professional_data"
  ALTER COLUMN "status" SET NOT NULL,
  ALTER COLUMN "status" SET DEFAULT 'ATIVO'::"StatusProfissionalSaude";

-- 5. Dropar índices antigos que usam ativo
DROP INDEX IF EXISTS "health_professional_data_categoria_ativo_idx";

-- 6. Dropar coluna ativo
ALTER TABLE "health_professional_data" DROP COLUMN "ativo";

-- 7. Criar novos índices usando status
CREATE INDEX "health_professional_data_categoria_status_idx" ON "health_professional_data"("categoria", "status");
CREATE INDEX "health_professional_data_status_idx" ON "health_professional_data"("status");
