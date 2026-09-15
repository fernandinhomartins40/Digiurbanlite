-- AddBotFieldsToConversation
-- This migration adds bot-specific fields to the conversations table
-- to support DigiBot integration with UltraZend Messages

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

-- Update metadata field to handle bot message types
-- The metadata JSON field will now support bot-specific message metadata:
-- {
--   "messageType": "interactive" | "card" | "carousel" | "text",
--   "stepType": "searchable_select" | "calendar" | "location" | "upload",
--   "quickReplies": ["Option 1", "Option 2"],
--   "cards": [{...}],
--   "options": [{...}]
-- }

-- Migrate existing BotConversation data (if any exists in legacy table)
-- Note: This assumes legacy tables exist. If not, these statements will be ignored.
-- ⚠️ MIGRACAO DE DADOS LEGADOS (corrigido 2026-09-15)
-- A guarda original checava apenas se a TABELA `bot_conversations` existia, mas o
-- SELECT abaixo referencia a coluna "context" — que nao existe no schema atual
-- (a coluna equivalente chama-se "intent"). Resultado em banco novo:
--   ERROR: column "context" does not exist  (SQLSTATE 42703)
-- A migration falhava, o Prisma travava a cadeia com P3009 e o messages-server
-- entrava em crash-loop.
--
-- A guarda agora exige tambem a COLUNA, nao so a tabela. Em bancos novos (onde
-- `bot_conversations` nasce sem "context") este bloco simplesmente nao roda —
-- correto, porque nao ha dado legado a migrar. Em bancos antigos que realmente
-- tenham a coluna, a migracao de dados ocorre como antes.
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'bot_conversations' AND column_name = 'context'
  ) THEN
    INSERT INTO "conversations" (
      "messageServerId",
      "participant1Id",
      "participant1Type",
      "participant2Id",
      "participant2Type",
      "type",
      "status",
      "isBotConversation",
      "botFlowType",
      "botFlowStep",
      "botFlowData",
      "botContext",
      "botLastInteractionAt",
      "createdAt",
      "updatedAt"
    )
    SELECT
      (SELECT id FROM "message_servers" LIMIT 1), -- Default message server
      "citizenId",
      'CITIZEN',
      'DIGIBOT_SYSTEM',
      'SYSTEM',
      'SUPPORT',
      CASE
        WHEN "isActive" = true THEN 'ACTIVE'::text
        ELSE 'CLOSED'::text
      END::"ConversationStatus",
      true,
      "currentFlow",
      "flowStep",
      "flowData",
      "context",
      "updatedAt",
      "createdAt",
      "updatedAt"
    FROM "bot_conversations"
    WHERE NOT EXISTS (
      SELECT 1 FROM "conversations"
      WHERE "participant1Id" = "bot_conversations"."citizenId"
      AND "participant2Id" = 'DIGIBOT_SYSTEM'
      AND "isBotConversation" = true
    );

    -- Migrate bot messages
    INSERT INTO "messages" (
      "conversationId",
      "senderId",
      "senderType",
      "content",
      "contentType",
      "metadata",
      "status",
      "sentAt",
      "createdAt",
      "updatedAt"
    )
    SELECT
      c."id",
      CASE
        WHEN bm."senderType" = 'CITIZEN' THEN bm."citizenId"
        ELSE 'DIGIBOT_SYSTEM'
      END,
      bm."senderType"::"ParticipantType",
      bm."content",
      CASE bm."messageType"
        WHEN 'text' THEN 'TEXT'
        WHEN 'image' THEN 'IMAGE'
        WHEN 'document' THEN 'DOCUMENT'
        ELSE 'TEXT'
      END::"MessageContentType",
      bm."metadata",
      'SENT'::"MessageStatus",
      bm."createdAt",
      bm."createdAt",
      bm."updatedAt"
    FROM "bot_messages" bm
    JOIN "bot_conversations" bc ON bm."conversationId" = bc."id"
    JOIN "conversations" c ON c."participant1Id" = bc."citizenId"
      AND c."participant2Id" = 'DIGIBOT_SYSTEM'
      AND c."isBotConversation" = true
    WHERE NOT EXISTS (
      SELECT 1 FROM "messages" m
      WHERE m."conversationId" = c."id"
      AND m."content" = bm."content"
      AND m."sentAt" = bm."createdAt"
    );
  END IF;
END $$;
