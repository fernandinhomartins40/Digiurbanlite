-- ============================================================================
-- MIGRATION: Add Current Stage Tracking & Remove WorkflowStatus
-- ============================================================================
-- FASE 1: Adicionar currentStageId para rastreamento de stage atual
-- FASE 2: Remover enum WorkflowStatus (não utilizado)
-- ============================================================================

-- FASE 1: Adicionar campo currentStageId ao ProtocolSimplified
ALTER TABLE "protocols_simplified" ADD COLUMN "currentStageId" TEXT;

-- Adicionar índice para performance
CREATE INDEX "protocols_simplified_currentStageId_idx" ON "protocols_simplified"("currentStageId");

-- Adicionar foreign key para ProtocolStage
ALTER TABLE "protocols_simplified" ADD CONSTRAINT "protocols_simplified_currentStageId_fkey"
  FOREIGN KEY ("currentStageId") REFERENCES "protocol_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- FASE 2: Mudar WorkflowInstance.status de enum para String
-- Primeiro, alterar a coluna para aceitar qualquer texto
ALTER TABLE "workflow_instances" ALTER COLUMN "status" TYPE TEXT;

-- Remover o enum WorkflowStatus (se existir)
DROP TYPE IF EXISTS "WorkflowStatus";

-- ============================================================================
-- MIGRAÇÃO DE DADOS: Atualizar currentStageId nos protocolos existentes
-- ============================================================================
-- Setar currentStageId para a primeira stage IN_PROGRESS ou PENDING de cada protocolo

UPDATE "protocols_simplified" p
SET "currentStageId" = (
  SELECT s.id
  FROM "protocol_stages" s
  WHERE s."protocolId" = p.id
    AND s.status IN ('IN_PROGRESS', 'PENDING')
  ORDER BY s."stageOrder" ASC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1
  FROM "protocol_stages" s
  WHERE s."protocolId" = p.id
);

-- ============================================================================
-- COMENTÁRIOS DE AUDITORIA
-- ============================================================================
COMMENT ON COLUMN "protocols_simplified"."currentStageId" IS 'Stage atual em execução do workflow';
