-- Aviso de saldo baixo de créditos de IA
ALTER TABLE "ai_billing_settings" ADD COLUMN IF NOT EXISTS "lowBalanceCredits" DOUBLE PRECISION NOT NULL DEFAULT 500;
ALTER TABLE "ai_tenant_wallets" ADD COLUMN IF NOT EXISTS "lowBalanceThreshold" DOUBLE PRECISION;
ALTER TABLE "ai_tenant_wallets" ADD COLUMN IF NOT EXISTS "lowBalanceNotifiedAt" TIMESTAMP(3);

-- Prazo de guarda das conversas (LGPD)
CREATE TABLE IF NOT EXISTS "privacy_retention_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "botChatDays" INTEGER NOT NULL DEFAULT 365,
    "humanChatDays" INTEGER NOT NULL DEFAULT 730,
    "assistantDays" INTEGER NOT NULL DEFAULT 180,
    "lastRunAt" TIMESTAMP(3),
    "lastRunSummary" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "privacy_retention_settings_pkey" PRIMARY KEY ("id")
);
