CREATE TABLE "ai_semantic_cache" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "queryHash" TEXT NOT NULL,
    "normalizedQuery" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "routeKind" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "embedding" JSONB,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastHitAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_semantic_cache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_semantic_cache_tenantId_queryHash_routeKind_source_key" ON "ai_semantic_cache"("tenantId", "queryHash", "routeKind", "source");
CREATE INDEX "ai_semantic_cache_tenantId_routeKind_source_updatedAt_idx" ON "ai_semantic_cache"("tenantId", "routeKind", "source", "updatedAt");
CREATE INDEX "ai_semantic_cache_tenantId_expiresAt_idx" ON "ai_semantic_cache"("tenantId", "expiresAt");
