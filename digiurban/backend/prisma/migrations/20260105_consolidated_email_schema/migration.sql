-- ============================================================================
-- MIGRATION CONSOLIDADA - SISTEMA DE EMAIL
-- ============================================================================
-- Data: 2026-01-05
-- Objetivo: Alinhar banco de dados com schema Prisma após refatoração
--
-- Esta migration:
-- 1. Adiciona campos faltantes em email_plan_configs
-- 2. Remove campos duplicados de email_subscriptions e email_servers
-- 3. Cria tabela email_drafts
-- 4. Cria tabela received_emails (inbox)
-- ============================================================================

-- ============================================================================
-- 1. ATUALIZAR EMAIL_PLAN_CONFIGS
-- ============================================================================

-- Adicionar campos com defaults para não quebrar dados existentes
ALTER TABLE "email_plan_configs"
ADD COLUMN IF NOT EXISTS "monthly_price" DECIMAL(10,2) NOT NULL DEFAULT 99.00,
ADD COLUMN IF NOT EXISTS "max_emails_per_month" INTEGER NOT NULL DEFAULT 10000,
ADD COLUMN IF NOT EXISTS "max_accounts" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Atualizar valores reais baseados nos códigos dos planos
UPDATE "email_plan_configs"
SET
  "monthly_price" = 49.00,
  "max_emails_per_month" = 5000,
  "max_accounts" = 5
WHERE "code" = 'BASIC';

UPDATE "email_plan_configs"
SET
  "monthly_price" = 99.00,
  "max_emails_per_month" = 15000,
  "max_accounts" = 15
WHERE "code" = 'STANDARD';

UPDATE "email_plan_configs"
SET
  "monthly_price" = 199.00,
  "max_emails_per_month" = 50000,
  "max_accounts" = 50
WHERE "code" = 'PREMIUM';

UPDATE "email_plan_configs"
SET
  "monthly_price" = 399.00,
  "max_emails_per_month" = -1,
  "max_accounts" = 999
WHERE "code" = 'ENTERPRISE';

-- ============================================================================
-- 2. REMOVER CAMPOS DUPLICADOS
-- ============================================================================

-- Remover campos duplicados de email_subscriptions
ALTER TABLE "email_subscriptions"
DROP COLUMN IF EXISTS "max_emails_per_month",
DROP COLUMN IF EXISTS "max_accounts";

-- Remover campos duplicados de email_servers
ALTER TABLE "email_servers"
DROP COLUMN IF EXISTS "max_emails_per_month";

-- ============================================================================
-- 3. CRIAR TABELA EMAIL_DRAFTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "email_drafts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT,
    "to" TEXT,
    "cc" TEXT,
    "bcc" TEXT,
    "subject" TEXT,
    "text_content" TEXT,
    "html_content" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_drafts_user_id_fkey"
      FOREIGN KEY ("user_id")
      REFERENCES "users" ("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS "email_drafts_user_id_idx" ON "email_drafts"("user_id");
CREATE INDEX IF NOT EXISTS "email_drafts_created_at_idx" ON "email_drafts"("created_at");

-- ============================================================================
-- 4. CRIAR TABELA RECEIVED_EMAILS (INBOX)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "received_emails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message_id" TEXT NOT NULL UNIQUE,
    "from_email" TEXT NOT NULL,
    "from_name" TEXT,
    "to_email" TEXT NOT NULL,
    "cc_emails" JSONB,
    "bcc_emails" JSONB,
    "reply_to" TEXT,
    "subject" TEXT NOT NULL,
    "text_content" TEXT,
    "html_content" TEXT,
    "headers" JSONB,
    "attachments" JSONB,
    "size" INTEGER NOT NULL DEFAULT 0,
    "received_at" TIMESTAMP(3) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_starred" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "is_trash" BOOLEAN NOT NULL DEFAULT false,
    "is_spam" BOOLEAN NOT NULL DEFAULT false,
    "folder" TEXT NOT NULL DEFAULT 'inbox',
    "labels" JSONB,
    "email_server_id" TEXT NOT NULL,
    "email_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "received_emails_email_server_id_fkey"
      FOREIGN KEY ("email_server_id")
      REFERENCES "email_servers" ("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE,

    CONSTRAINT "received_emails_email_user_id_fkey"
      FOREIGN KEY ("email_user_id")
      REFERENCES "email_users" ("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE
);

-- Criar índices para performance de queries do inbox
CREATE INDEX IF NOT EXISTS "received_emails_email_server_id_idx" ON "received_emails"("email_server_id");
CREATE INDEX IF NOT EXISTS "received_emails_email_user_id_idx" ON "received_emails"("email_user_id");
CREATE INDEX IF NOT EXISTS "received_emails_to_email_idx" ON "received_emails"("to_email");
CREATE INDEX IF NOT EXISTS "received_emails_from_email_idx" ON "received_emails"("from_email");
CREATE INDEX IF NOT EXISTS "received_emails_is_read_idx" ON "received_emails"("is_read");
CREATE INDEX IF NOT EXISTS "received_emails_is_trash_idx" ON "received_emails"("is_trash");
CREATE INDEX IF NOT EXISTS "received_emails_is_spam_idx" ON "received_emails"("is_spam");
CREATE INDEX IF NOT EXISTS "received_emails_folder_idx" ON "received_emails"("folder");
CREATE INDEX IF NOT EXISTS "received_emails_received_at_idx" ON "received_emails"("received_at");

-- ============================================================================
-- 5. GARANTIR INTEGRIDADE DAS TABELAS EXISTENTES
-- ============================================================================

-- Garantir que email_plan_allowed_domains existe
CREATE TABLE IF NOT EXISTS "email_plan_allowed_domains" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plan_id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_plan_allowed_domains_plan_id_fkey"
      FOREIGN KEY ("plan_id")
      REFERENCES "email_plan_configs" ("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE,

    CONSTRAINT "email_plan_allowed_domains_domain_id_fkey"
      FOREIGN KEY ("domain_id")
      REFERENCES "email_domains" ("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE,

    UNIQUE ("plan_id", "domain_id")
);

CREATE INDEX IF NOT EXISTS "email_plan_allowed_domains_plan_id_idx" ON "email_plan_allowed_domains"("plan_id");
CREATE INDEX IF NOT EXISTS "email_plan_allowed_domains_domain_id_idx" ON "email_plan_allowed_domains"("domain_id");

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
