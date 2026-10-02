-- CreateTable
CREATE TABLE "bot_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "published" JSONB NOT NULL,
    "draft" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_settings_versions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "bot_settings_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_faqs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_service_terms" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "serviceId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_service_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_unanswered" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "text" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" JSONB,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_unanswered_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bot_settings_tenantId_key" ON "bot_settings"("tenantId");

-- CreateIndex
CREATE INDEX "bot_settings_tenantId_idx" ON "bot_settings"("tenantId");

-- CreateIndex
CREATE INDEX "bot_settings_versions_tenantId_idx" ON "bot_settings_versions"("tenantId");

-- CreateIndex
CREATE INDEX "bot_settings_versions_tenantId_version_idx" ON "bot_settings_versions"("tenantId", "version");

-- CreateIndex
CREATE INDEX "bot_faqs_tenantId_idx" ON "bot_faqs"("tenantId");

-- CreateIndex
CREATE INDEX "bot_faqs_tenantId_isActive_idx" ON "bot_faqs"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "bot_service_terms_tenantId_idx" ON "bot_service_terms"("tenantId");

-- CreateIndex
CREATE INDEX "bot_service_terms_serviceId_idx" ON "bot_service_terms"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "bot_service_terms_tenantId_serviceId_term_key" ON "bot_service_terms"("tenantId", "serviceId", "term");

-- CreateIndex
CREATE INDEX "bot_unanswered_tenantId_idx" ON "bot_unanswered"("tenantId");

-- CreateIndex
CREATE INDEX "bot_unanswered_tenantId_status_idx" ON "bot_unanswered"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "bot_unanswered_tenantId_normalized_key" ON "bot_unanswered"("tenantId", "normalized");
