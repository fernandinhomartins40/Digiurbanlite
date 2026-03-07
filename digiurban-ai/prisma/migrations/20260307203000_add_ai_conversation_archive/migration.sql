ALTER TABLE "ai_conversations"
ADD COLUMN "is_archived" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "ai_conversations_tenantId_userId_is_archived_lastMessageAt_idx"
ON "ai_conversations"("tenantId", "userId", "is_archived", "lastMessageAt");
