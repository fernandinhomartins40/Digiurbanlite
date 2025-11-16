-- AlterTable: Adicionar constraint UNIQUE no campo moduleType
-- Garante que cada moduleType seja único em todo o sistema

-- Criar índice único (se não existir)
CREATE UNIQUE INDEX IF NOT EXISTS "services_simplified_moduleType_key"
ON "services_simplified"("moduleType")
WHERE "moduleType" IS NOT NULL;
