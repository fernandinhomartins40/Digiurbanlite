-- ============================================================================
-- FASE 1 MULTI-TENANT: tabela tenants + backfill a partir de municipio_config
-- ============================================================================
-- O município single-tenant atual vira o tenant default (id fixo e legível,
-- referenciado por DEFAULT_TENANT_ID no backend). Idempotente por ON CONFLICT.

-- Enum "TenantStatus" já existe no banco (migration consolidada 20260106023614,
-- vestígio da versão multi-tenant anterior) — reutilizado, não recriado.

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "codigoIbge" TEXT,
    "nomeMunicipio" TEXT NOT NULL,
    "ufMunicipio" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "suspensionReason" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'active',
    "plan" TEXT NOT NULL DEFAULT 'basic',
    "planEndsAt" TIMESTAMP(3),
    "maxUsers" INTEGER NOT NULL DEFAULT 10,
    "maxCitizens" INTEGER NOT NULL DEFAULT 10000,
    "features" JSONB,
    "branding" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
CREATE UNIQUE INDEX "tenants_cnpj_key" ON "tenants"("cnpj");
CREATE UNIQUE INDEX "tenants_codigoIbge_key" ON "tenants"("codigoIbge");

-- Backfill: município atual → tenant default
INSERT INTO "tenants" (
    "id", "slug", "nome", "cnpj", "codigoIbge", "nomeMunicipio", "ufMunicipio",
    "status", "suspensionReason", "paymentStatus", "plan", "planEndsAt",
    "maxUsers", "maxCitizens", "features", "createdAt", "updatedAt"
)
SELECT
    'tenant-default',
    'default',
    mc."nome",
    mc."cnpj",
    mc."codigoIbge",
    mc."nomeMunicipio",
    mc."ufMunicipio",
    CASE
        WHEN mc."isSuspended" THEN 'SUSPENDED'::"TenantStatus"
        WHEN NOT mc."isActive" THEN 'INACTIVE'::"TenantStatus"
        ELSE 'ACTIVE'::"TenantStatus"
    END,
    mc."suspensionReason",
    mc."paymentStatus",
    mc."subscriptionPlan",
    mc."subscriptionEnds",
    mc."maxUsers",
    mc."maxCitizens",
    mc."features",
    mc."createdAt",
    mc."updatedAt"
FROM "municipio_config" mc
WHERE mc."id" = 'singleton'
ON CONFLICT ("id") DO NOTHING;
