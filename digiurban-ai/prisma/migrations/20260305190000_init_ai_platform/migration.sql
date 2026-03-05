-- CreateEnum
CREATE TYPE "AiMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');

-- CreateEnum
CREATE TYPE "AiConversationVisibility" AS ENUM ('PRIVATE', 'SHARED_TEAM', 'SHARED_DEPARTMENT');

-- CreateEnum
CREATE TYPE "AiKnowledgeSourceType" AS ENUM ('SYSTEM_TABLE', 'SQL_QUERY', 'MANUAL_TEXT', 'HTTP_ENDPOINT');

-- CreateEnum
CREATE TYPE "AiPlanType" AS ENUM ('INTERNAL', 'MUNICIPALITY');

-- CreateEnum
CREATE TYPE "AiApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "title" TEXT,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT,
    "visibility" "AiConversationVisibility" NOT NULL DEFAULT 'PRIVATE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_knowledge_sources" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL,
    "type" "AiKnowledgeSourceType" NOT NULL,
    "config" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastIngestedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_knowledge_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_knowledge_chunks" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "hash" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_api_plans" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL,
    "planType" "AiPlanType" NOT NULL DEFAULT 'MUNICIPALITY',
    "requestLimitPerMinute" INTEGER NOT NULL DEFAULT 60,
    "monthlyBudgetTokens" INTEGER NOT NULL DEFAULT 1000000,
    "inputTokenLimit" INTEGER NOT NULL DEFAULT 500000,
    "outputTokenLimit" INTEGER NOT NULL DEFAULT 500000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_api_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_api_keys" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "status" "AiApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "allowedIps" JSONB,
    "lastUsedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_token_usage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "planId" TEXT,
    "apiKeyId" TEXT,
    "conversationId" TEXT,
    "userId" TEXT,
    "source" TEXT NOT NULL,
    "model" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_token_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_conversations_tenantId_userId_lastMessageAt_idx" ON "ai_conversations"("tenantId", "userId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "ai_conversations_tenantId_createdAt_idx" ON "ai_conversations"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_messages_conversationId_createdAt_idx" ON "ai_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ai_knowledge_sources_tenantId_name_key" ON "ai_knowledge_sources"("tenantId", "name");

-- CreateIndex
CREATE INDEX "ai_knowledge_sources_tenantId_isActive_idx" ON "ai_knowledge_sources"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ai_knowledge_chunks_sourceId_hash_key" ON "ai_knowledge_chunks"("sourceId", "hash");

-- CreateIndex
CREATE INDEX "ai_knowledge_chunks_tenantId_createdAt_idx" ON "ai_knowledge_chunks"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_knowledge_chunks_sourceId_createdAt_idx" ON "ai_knowledge_chunks"("sourceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ai_api_plans_tenantId_name_key" ON "ai_api_plans"("tenantId", "name");

-- CreateIndex
CREATE INDEX "ai_api_plans_tenantId_isActive_idx" ON "ai_api_plans"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ai_api_keys_keyHash_key" ON "ai_api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "ai_api_keys_tenantId_status_idx" ON "ai_api_keys"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ai_api_keys_keyPrefix_idx" ON "ai_api_keys"("keyPrefix");

-- CreateIndex
CREATE INDEX "ai_api_keys_planId_status_idx" ON "ai_api_keys"("planId", "status");

-- CreateIndex
CREATE INDEX "ai_token_usage_tenantId_createdAt_idx" ON "ai_token_usage"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_token_usage_apiKeyId_createdAt_idx" ON "ai_token_usage"("apiKeyId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_token_usage_planId_createdAt_idx" ON "ai_token_usage"("planId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_token_usage_conversationId_createdAt_idx" ON "ai_token_usage"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_knowledge_chunks" ADD CONSTRAINT "ai_knowledge_chunks_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ai_knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_api_keys" ADD CONSTRAINT "ai_api_keys_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ai_api_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_token_usage" ADD CONSTRAINT "ai_token_usage_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ai_api_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_token_usage" ADD CONSTRAINT "ai_token_usage_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ai_api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_token_usage" ADD CONSTRAINT "ai_token_usage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
