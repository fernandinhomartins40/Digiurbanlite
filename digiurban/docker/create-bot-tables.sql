-- Migration para criar tabelas do DigiBot
-- Executado automaticamente no startup.sh

-- Tabela de conversas do bot
CREATE TABLE IF NOT EXISTS bot_conversations (
    id TEXT PRIMARY KEY,
    "citizenId" TEXT NOT NULL,
    intent TEXT,
    confidence DOUBLE PRECISION,
    "currentFlow" TEXT,
    "flowStep" INTEGER NOT NULL DEFAULT 0,
    "flowData" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "closedAt" TIMESTAMP(3),
    rating INTEGER,
    "ratingComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bot_conversations_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES citizens(id) ON DELETE CASCADE
);

-- Índices para bot_conversations
CREATE INDEX IF NOT EXISTS "bot_conversations_citizenId_idx" ON bot_conversations("citizenId");
CREATE INDEX IF NOT EXISTS "bot_conversations_createdAt_idx" ON bot_conversations("createdAt");
CREATE INDEX IF NOT EXISTS "bot_conversations_currentFlow_idx" ON bot_conversations("currentFlow");
CREATE INDEX IF NOT EXISTS "bot_conversations_isActive_idx" ON bot_conversations("isActive");

-- Tabela de mensagens do bot
CREATE TABLE IF NOT EXISTS bot_messages (
    id TEXT PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    intent TEXT,
    confidence DOUBLE PRECISION,
    sentiment TEXT,
    "sentimentScore" DOUBLE PRECISION,
    metadata JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bot_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES bot_conversations(id) ON DELETE CASCADE
);

-- Índices para bot_messages
CREATE INDEX IF NOT EXISTS "bot_messages_conversationId_idx" ON bot_messages("conversationId");
CREATE INDEX IF NOT EXISTS "bot_messages_createdAt_idx" ON bot_messages("createdAt");
CREATE INDEX IF NOT EXISTS "bot_messages_intent_idx" ON bot_messages(intent);
CREATE INDEX IF NOT EXISTS "bot_messages_role_idx" ON bot_messages(role);

-- Tabela de analytics do bot
CREATE TABLE IF NOT EXISTS bot_analytics (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    intent TEXT NOT NULL,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "transferCount" INTEGER NOT NULL DEFAULT 0,
    "avgConfidence" DOUBLE PRECISION,
    "avgResponseTime" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para bot_analytics
CREATE INDEX IF NOT EXISTS "bot_analytics_date_idx" ON bot_analytics(date);
CREATE INDEX IF NOT EXISTS "bot_analytics_intent_idx" ON bot_analytics(intent);
CREATE UNIQUE INDEX IF NOT EXISTS "bot_analytics_date_intent_key" ON bot_analytics(date, intent);

-- Tabela de uploads do bot
CREATE TABLE IF NOT EXISTS bot_uploads (
    id TEXT PRIMARY KEY,
    "conversationId" TEXT,
    "citizenId" TEXT NOT NULL,
    filename TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    size INTEGER NOT NULL,
    path TEXT NOT NULL,
    url TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bot_uploads_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES citizens(id) ON DELETE CASCADE
);

-- Índices para bot_uploads
CREATE INDEX IF NOT EXISTS "bot_uploads_citizenId_idx" ON bot_uploads("citizenId");
CREATE INDEX IF NOT EXISTS "bot_uploads_conversationId_idx" ON bot_uploads("conversationId");
CREATE INDEX IF NOT EXISTS "bot_uploads_uploadedAt_idx" ON bot_uploads("uploadedAt");

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Tabelas do DigiBot criadas com sucesso!';
END
$$;
