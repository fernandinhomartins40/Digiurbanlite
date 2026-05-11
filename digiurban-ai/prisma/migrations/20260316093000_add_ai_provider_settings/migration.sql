CREATE TABLE "ai_provider_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "provider" TEXT NOT NULL DEFAULT 'LLAMACPP',
    "fallbackProvider" TEXT,
    "fast_model" TEXT,
    "contextual_model" TEXT,
    "quality_model" TEXT,
    "fallback_fast_model" TEXT,
    "fallback_contextual_model" TEXT,
    "fallback_quality_model" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_provider_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_provider_settings_tenantId_key" ON "ai_provider_settings"("tenantId");
CREATE INDEX "ai_provider_settings_tenantId_provider_idx" ON "ai_provider_settings"("tenantId", "provider");
