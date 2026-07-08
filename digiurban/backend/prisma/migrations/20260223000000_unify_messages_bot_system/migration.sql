-- =====================================================================
-- MIGRATION: Unificação completa do sistema de Mensagens + DigiBot
-- Data: 2026-02-23
-- Descrição: Elimina duplicação de estado, adiciona campos queryable,
--            prepara sistema de handover bot→humano
-- =====================================================================

-- ============================================
-- PARTE 1: REFATORAR CONVERSATION
-- ============================================

-- Remover campos duplicados do bot (agora fonte de verdade é FlowExecution)
ALTER TABLE "conversations" DROP COLUMN IF EXISTS "botFlowType";
ALTER TABLE "conversations" DROP COLUMN IF EXISTS "botFlowStep";
ALTER TABLE "conversations" DROP COLUMN IF EXISTS "botFlowData";
ALTER TABLE "conversations" DROP COLUMN IF EXISTS "botContext";
ALTER TABLE "conversations" DROP COLUMN IF EXISTS "botLastInteractionAt";

-- Adicionar FK para execução ativa do bot
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "activeFlowExecutionId" TEXT UNIQUE;

-- Criar índice para consultas rápidas
CREATE INDEX IF NOT EXISTS "conversations_activeFlowExecutionId_idx" ON "conversations"("activeFlowExecutionId");

-- ============================================
-- PARTE 2: EXPANDIR FLOWEXECUTION
-- ============================================

-- Adicionar campos de pausa (movidos de metadata para campos diretos)
-- REPARO (Fase 0 Multi-Tenant, achado B7): flow_executions é drift (db push) — condicional
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flow_executions') THEN
    ALTER TABLE "flow_executions" ADD COLUMN IF NOT EXISTS "isPaused" BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE "flow_executions" ADD COLUMN IF NOT EXISTS "pausedBy" TEXT;
    ALTER TABLE "flow_executions" ADD COLUMN IF NOT EXISTS "pausedAt" TIMESTAMP(3);
    ALTER TABLE "flow_executions" ADD COLUMN IF NOT EXISTS "pauseReason" TEXT;
    ALTER TABLE "flow_executions" ADD COLUMN IF NOT EXISTS "resumedAt" TIMESTAMP(3);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flow_executions') THEN
    ALTER TABLE "flow_executions" ADD COLUMN IF NOT EXISTS "resumedBy" TEXT;
    -- Adicionar retry count e metadata genérico
    ALTER TABLE "flow_executions" ADD COLUMN IF NOT EXISTS "retryCount" INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE "flow_executions" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
    -- Criar índices para queries de handover
    CREATE INDEX IF NOT EXISTS "flow_executions_isPaused_idx" ON "flow_executions"("isPaused");
    CREATE INDEX IF NOT EXISTS "flow_executions_pausedAt_idx" ON "flow_executions"("pausedAt");
    CREATE INDEX IF NOT EXISTS "flow_executions_pausedBy_idx" ON "flow_executions"("pausedBy");
  END IF;
END $$;

-- ============================================
-- PARTE 3: ADICIONAR CAMPOS QUERYABLE NO MESSAGE
-- ============================================

-- Campos para analytics de bot
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "isBotMessage" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "botInteractionType" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "botSelectedOption" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "botStructuredData" JSONB;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "botFlowNodeId" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "botFlowAction" TEXT;

-- Criar índices para analytics
CREATE INDEX IF NOT EXISTS "messages_isBotMessage_idx" ON "messages"("isBotMessage");
CREATE INDEX IF NOT EXISTS "messages_botInteractionType_idx" ON "messages"("botInteractionType");
CREATE INDEX IF NOT EXISTS "messages_botSelectedOption_idx" ON "messages"("botSelectedOption");
CREATE INDEX IF NOT EXISTS "messages_botFlowNodeId_idx" ON "messages"("botFlowNodeId");

-- ============================================
-- PARTE 4: ADICIONAR FOREIGN KEY
-- ============================================

-- Relacionar Conversation → FlowExecution (ativa)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flow_executions')
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'conversations_activeFlowExecutionId_fkey'
  ) THEN
    ALTER TABLE "conversations"
    ADD CONSTRAINT "conversations_activeFlowExecutionId_fkey"
    FOREIGN KEY ("activeFlowExecutionId")
    REFERENCES "flow_executions"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- PARTE 5: MIGRAR DADOS EXISTENTES (se houver)
-- ============================================

-- Marcar mensagens enviadas por DIGIBOT_SYSTEM como bot messages
UPDATE "messages"
SET "isBotMessage" = true
WHERE "senderId" = 'DIGIBOT_SYSTEM'
  AND "senderType" = 'SYSTEM'
  AND "isBotMessage" = false;

-- Extrair tipo de interação dos metadados (se existirem)
UPDATE "messages"
SET
  "botInteractionType" = CASE
    WHEN metadata->>'messageType' IS NOT NULL THEN metadata->>'messageType'
    WHEN metadata->>'dataType' IS NOT NULL THEN metadata->>'dataType'
    ELSE NULL
  END,
  "botSelectedOption" = CASE
    WHEN metadata->'originalData'->>'optionId' IS NOT NULL
    THEN metadata->'originalData'->>'optionId'
    ELSE NULL
  END,
  "botStructuredData" = CASE
    WHEN metadata->'originalData' IS NOT NULL
    THEN metadata->'originalData'
    ELSE NULL
  END
WHERE "isBotMessage" = true
  AND "botInteractionType" IS NULL
  AND metadata IS NOT NULL;

-- =====================================================================
-- FIM DA MIGRATION
-- =====================================================================
