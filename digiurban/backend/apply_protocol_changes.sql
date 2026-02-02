-- Script para aplicar mudanças do Sistema de Atribuição de Protocolos
-- Executar manualmente no banco de dados

-- 1. Criar enums
DO $$ BEGIN
    CREATE TYPE "TipoAtribuicaoProtocolo" AS ENUM ('PRINCIPAL', 'DELEGADO', 'ENCAMINHADO', 'CONSULTA', 'APOIO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SituacaoAtribuicao" AS ENUM ('ATIVA', 'CONCLUIDA', 'CANCELADA', 'SUBSTITUIDA', 'PENDENTE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Adicionar colunas em protocols_simplified
ALTER TABLE "protocols_simplified"
ADD COLUMN IF NOT EXISTS "currentAssignedUserId" TEXT,
ADD COLUMN IF NOT EXISTS "organizationalUnitId" TEXT,
ADD COLUMN IF NOT EXISTS "teamId" TEXT;

-- 3. Criar tabela protocol_server_assignments
CREATE TABLE IF NOT EXISTS "protocol_server_assignments" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "TipoAtribuicaoProtocolo" NOT NULL,
    "situacao" "SituacaoAtribuicao" NOT NULL DEFAULT 'ATIVA',
    "assignedById" TEXT,
    "assignedByName" TEXT,
    "motivo" TEXT,
    "prioridade" INTEGER,
    "percentualCarga" INTEGER,
    "prazoResposta" TIMESTAMP(3),
    "isDelegacao" BOOLEAN NOT NULL DEFAULT false,
    "delegadoPor" TEXT,
    "ativaAte" TIMESTAMP(3),
    "motivoDelegacao" TEXT,
    "departmentOrigemId" TEXT,
    "departmentOrigemName" TEXT,
    "departmentDestinoId" TEXT,
    "departmentDestinoName" TEXT,
    "isInterdepartamental" BOOLEAN NOT NULL DEFAULT false,
    "employeeAssignmentId" TEXT,
    "organizationalUnitId" TEXT,
    "comentario" TEXT,
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "lidoEm" TIMESTAMP(3),
    "respondeEm" TIMESTAMP(3),
    "respostaTexto" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocol_server_assignments_pkey" PRIMARY KEY ("id")
);

-- 4. Criar índices
CREATE INDEX IF NOT EXISTS "protocol_server_assignments_protocolId_situacao_idx" ON "protocol_server_assignments"("protocolId", "situacao");
CREATE INDEX IF NOT EXISTS "protocol_server_assignments_userId_situacao_idx" ON "protocol_server_assignments"("userId", "situacao");
CREATE INDEX IF NOT EXISTS "protocol_server_assignments_tipo_situacao_idx" ON "protocol_server_assignments"("tipo", "situacao");
CREATE INDEX IF NOT EXISTS "protocol_server_assignments_isDelegacao_ativaAte_idx" ON "protocol_server_assignments"("isDelegacao", "ativaAte");
CREATE INDEX IF NOT EXISTS "protocol_server_assignments_employeeAssignmentId_idx" ON "protocol_server_assignments"("employeeAssignmentId");
CREATE INDEX IF NOT EXISTS "protocol_server_assignments_organizationalUnitId_idx" ON "protocol_server_assignments"("organizationalUnitId");

-- 5. Adicionar foreign keys (com verificação de existência)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'protocols_simplified_currentAssignedUserId_fkey'
    ) THEN
        ALTER TABLE "protocols_simplified"
        ADD CONSTRAINT "protocols_simplified_currentAssignedUserId_fkey"
        FOREIGN KEY ("currentAssignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'protocols_simplified_organizationalUnitId_fkey'
    ) THEN
        ALTER TABLE "protocols_simplified"
        ADD CONSTRAINT "protocols_simplified_organizationalUnitId_fkey"
        FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'protocols_simplified_teamId_fkey'
    ) THEN
        ALTER TABLE "protocols_simplified"
        ADD CONSTRAINT "protocols_simplified_teamId_fkey"
        FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'protocol_server_assignments_protocolId_fkey'
    ) THEN
        ALTER TABLE "protocol_server_assignments"
        ADD CONSTRAINT "protocol_server_assignments_protocolId_fkey"
        FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'protocol_server_assignments_userId_fkey'
    ) THEN
        ALTER TABLE "protocol_server_assignments"
        ADD CONSTRAINT "protocol_server_assignments_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'protocol_server_assignments_assignedById_fkey'
    ) THEN
        ALTER TABLE "protocol_server_assignments"
        ADD CONSTRAINT "protocol_server_assignments_assignedById_fkey"
        FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'protocol_server_assignments_employeeAssignmentId_fkey'
    ) THEN
        ALTER TABLE "protocol_server_assignments"
        ADD CONSTRAINT "protocol_server_assignments_employeeAssignmentId_fkey"
        FOREIGN KEY ("employeeAssignmentId") REFERENCES "employee_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'protocol_server_assignments_organizationalUnitId_fkey'
    ) THEN
        ALTER TABLE "protocol_server_assignments"
        ADD CONSTRAINT "protocol_server_assignments_organizationalUnitId_fkey"
        FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 6. Migrar dados existentes (criar assignments para protocolos já atribuídos)
INSERT INTO "protocol_server_assignments" (
    "id",
    "protocolId",
    "userId",
    "tipo",
    "situacao",
    "assignedByName",
    "dataInicio",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    p.id,
    p."assignedUserId",
    'PRINCIPAL',
    'ATIVA',
    'Migração automática',
    p."createdAt",
    NOW(),
    NOW()
FROM "protocols_simplified" p
WHERE p."assignedUserId" IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM "protocol_server_assignments" psa
    WHERE psa."protocolId" = p.id
    AND psa."userId" = p."assignedUserId"
);

-- 7. Sincronizar currentAssignedUserId com assignedUserId
UPDATE "protocols_simplified"
SET "currentAssignedUserId" = "assignedUserId"
WHERE "assignedUserId" IS NOT NULL
AND "currentAssignedUserId" IS NULL;

SELECT 'Migration aplicada com sucesso!' as status;
