-- AlterTable: Adicionar constraint UNIQUE no campo moduleType
-- Garante que cada moduleType seja único em todo o sistema

-- PASSO 1: Resolver duplicatas existentes
-- Renomear moduleTypes duplicados adicionando sufixo baseado no ID
WITH duplicates AS (
  SELECT
    id,
    "moduleType",
    ROW_NUMBER() OVER (PARTITION BY "moduleType" ORDER BY "createdAt" ASC) as rn
  FROM "services_simplified"
  WHERE "moduleType" IS NOT NULL
)
UPDATE "services_simplified" ss
SET "moduleType" = d."moduleType" || '_' || d.rn
FROM duplicates d
WHERE ss.id = d.id
  AND d.rn > 1;

-- PASSO 2: Criar índice único (agora que não há duplicatas)
CREATE UNIQUE INDEX IF NOT EXISTS "services_simplified_moduleType_key"
ON "services_simplified"("moduleType")
WHERE "moduleType" IS NOT NULL;
