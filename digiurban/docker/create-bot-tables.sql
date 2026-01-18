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
    "messageType" TEXT,
    intent TEXT,
    confidence DOUBLE PRECISION,
    sentiment TEXT,
    "sentimentScore" DOUBLE PRECISION,
    metadata JSONB,
    "wasTransferred" BOOLEAN NOT NULL DEFAULT false,
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
    "uniqueCitizens" INTEGER NOT NULL DEFAULT 0,
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

-- Adicionar colunas que podem estar faltando (se tabelas já existiam)
DO $$
BEGIN
    -- Adicionar messageType em bot_messages se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bot_messages' AND column_name = 'messageType'
    ) THEN
        ALTER TABLE bot_messages ADD COLUMN "messageType" TEXT;
        RAISE NOTICE '✅ Coluna messageType adicionada em bot_messages';
    END IF;

    -- Adicionar wasTransferred em bot_messages se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bot_messages' AND column_name = 'wasTransferred'
    ) THEN
        ALTER TABLE bot_messages ADD COLUMN "wasTransferred" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE '✅ Coluna wasTransferred adicionada em bot_messages';
    END IF;

    -- Adicionar uniqueCitizens em bot_analytics se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bot_analytics' AND column_name = 'uniqueCitizens'
    ) THEN
        ALTER TABLE bot_analytics ADD COLUMN "uniqueCitizens" INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE '✅ Coluna uniqueCitizens adicionada em bot_analytics';
    END IF;

    RAISE NOTICE '✅ Tabelas do DigiBot criadas/atualizadas com sucesso!';
END
$$;
