-- AddBotFieldsToConversation (Backend)
-- Adiciona campos de bot na tabela conversations do backend DigiUrban

-- Add bot fields to conversations table
ALTER TABLE "conversations"
ADD COLUMN IF NOT EXISTS "isBotConversation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "botFlowType" TEXT,
ADD COLUMN IF NOT EXISTS "botFlowStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "botFlowData" JSONB,
ADD COLUMN IF NOT EXISTS "botContext" JSONB,
ADD COLUMN IF NOT EXISTS "botLastInteractionAt" TIMESTAMP(3);

-- Create index for bot conversations
CREATE INDEX IF NOT EXISTS "conversations_isBotConversation_status_idx"
ON "conversations"("isBotConversation", "status");
