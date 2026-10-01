-- CreateTable
CREATE TABLE "ai_provider_credentials" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "apiKeyEnc" TEXT,
    "apiKeyLast4" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dataRegion" TEXT NOT NULL DEFAULT 'CN',
    "zeroRetention" BOOLEAN NOT NULL DEFAULT false,
    "lastTestAt" TIMESTAMP(3),
    "lastTestOk" BOOLEAN,
    "lastTestError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_provider_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_model_configs" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "inputPricePerMUsd" DOUBLE PRECISION NOT NULL,
    "outputPricePerMUsd" DOUBLE PRECISION NOT NULL,
    "cachedInputPricePerMUsd" DOUBLE PRECISION,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "calls" INTEGER NOT NULL DEFAULT 0,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "avgLatencyMs" INTEGER NOT NULL DEFAULT 0,
    "lastFailureAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_model_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_billing_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "usdToBrl" DOUBLE PRECISION NOT NULL DEFAULT 5.5,
    "markup" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "creditValueBrl" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "minChargeCredits" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "allowChinaHosted" BOOLEAN NOT NULL DEFAULT true,
    "redactPii" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_billing_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_credit_packages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "credits" INTEGER NOT NULL,
    "priceBrl" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_credit_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_tenant_wallets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "balance" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalPurchased" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalConsumed" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_tenant_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_credit_ledger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "kind" TEXT NOT NULL,
    "credits" DECIMAL(14,4) NOT NULL,
    "balanceAfter" DECIMAL(14,4) NOT NULL,
    "description" TEXT,
    "task" TEXT,
    "source" TEXT,
    "provider" TEXT,
    "modelId" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DECIMAL(14,8) NOT NULL DEFAULT 0,
    "revenueBrl" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "orderId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_credit_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_credit_orders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "packageId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "priceBrl" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invoiceId" TEXT,
    "requestedById" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_credit_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_provider_credentials_provider_key" ON "ai_provider_credentials"("provider");

-- CreateIndex
CREATE INDEX "ai_model_configs_tier_isEnabled_idx" ON "ai_model_configs"("tier", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "ai_model_configs_provider_modelId_key" ON "ai_model_configs"("provider", "modelId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_credit_packages_code_key" ON "ai_credit_packages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ai_tenant_wallets_tenantId_key" ON "ai_tenant_wallets"("tenantId");

-- CreateIndex
CREATE INDEX "ai_tenant_wallets_tenantId_idx" ON "ai_tenant_wallets"("tenantId");

-- CreateIndex
CREATE INDEX "ai_credit_ledger_tenantId_idx" ON "ai_credit_ledger"("tenantId");

-- CreateIndex
CREATE INDEX "ai_credit_ledger_tenantId_createdAt_idx" ON "ai_credit_ledger"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_credit_ledger_kind_createdAt_idx" ON "ai_credit_ledger"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "ai_credit_orders_tenantId_idx" ON "ai_credit_orders"("tenantId");

-- CreateIndex
CREATE INDEX "ai_credit_orders_tenantId_status_idx" ON "ai_credit_orders"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ai_credit_orders_invoiceId_idx" ON "ai_credit_orders"("invoiceId");

