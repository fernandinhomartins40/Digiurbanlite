-- Assistente de IA dos servidores (conversas por servidor/município)
-- CreateTable
CREATE TABLE "ai_assistant_conversations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_assistant_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_assistant_messages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_assistant_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_assistant_conversations_tenantId_idx" ON "ai_assistant_conversations"("tenantId");

-- CreateIndex
CREATE INDEX "ai_assistant_conversations_tenantId_userId_lastMessageAt_idx" ON "ai_assistant_conversations"("tenantId", "userId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "ai_assistant_messages_tenantId_idx" ON "ai_assistant_messages"("tenantId");

-- CreateIndex
CREATE INDEX "ai_assistant_messages_conversationId_createdAt_idx" ON "ai_assistant_messages"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "ai_assistant_messages" ADD CONSTRAINT "ai_assistant_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_assistant_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
