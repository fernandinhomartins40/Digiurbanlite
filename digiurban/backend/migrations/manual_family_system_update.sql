-- MIGRATION: Family System Update
-- Adiciona suporte a convites familiares e status de vínculos
-- Data: 2026-02-03

-- ============================================================================
-- 1. CRIAR NOVOS ENUMS
-- ============================================================================

-- Enum para status de vínculos familiares
DO $$ BEGIN
    CREATE TYPE "FamilyLinkStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para status de convites
DO $$ BEGIN
    CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. ATUALIZAR TABELA family_compositions
-- ============================================================================

-- Adicionar coluna status (default ACTIVE para vínculos existentes)
ALTER TABLE "family_compositions"
ADD COLUMN IF NOT EXISTS "status" "FamilyLinkStatus" NOT NULL DEFAULT 'ACTIVE';

-- Criar índice na coluna status
CREATE INDEX IF NOT EXISTS "family_compositions_status_idx" ON "family_compositions"("status");

-- ============================================================================
-- 3. CRIAR TABELA family_invites
-- ============================================================================

CREATE TABLE IF NOT EXISTS "family_invites" (
    "id" TEXT NOT NULL,
    "headId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT,
    "phone" TEXT,
    "name" TEXT,
    "relationship" "FamilyRelationship" NOT NULL,
    "isDependent" BOOLEAN NOT NULL DEFAULT false,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "message" TEXT,
    "monthlyIncome" DECIMAL(65,30),
    "occupation" TEXT,
    "education" TEXT,
    "hasDisability" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_invites_pkey" PRIMARY KEY ("id")
);

-- Criar constraints e índices
ALTER TABLE "family_invites"
ADD CONSTRAINT "family_invites_token_key" UNIQUE ("token");

ALTER TABLE "family_invites"
ADD CONSTRAINT "family_invites_headId_fkey"
FOREIGN KEY ("headId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "family_invites_token_idx" ON "family_invites"("token");
CREATE INDEX IF NOT EXISTS "family_invites_email_idx" ON "family_invites"("email");
CREATE INDEX IF NOT EXISTS "family_invites_status_idx" ON "family_invites"("status");
CREATE INDEX IF NOT EXISTS "family_invites_expiresAt_idx" ON "family_invites"("expiresAt");

-- ============================================================================
-- 4. ATUALIZAR VÍNCULOS EXISTENTES
-- ============================================================================

-- Definir todos os vínculos existentes como ACTIVE
UPDATE "family_compositions"
SET "status" = 'ACTIVE'
WHERE "status" IS NULL OR "status" = 'PENDING';

-- ============================================================================
-- FINALIZADO
-- ============================================================================

-- Verificar resultado
SELECT
    'family_compositions' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as ativos,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pendentes
FROM "family_compositions"
UNION ALL
SELECT
    'family_invites' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'ACCEPTED' THEN 1 END) as aceitos
FROM "family_invites";
