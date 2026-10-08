-- Arquivo de endereços já procurados (geocodificação) e data da geocodificação do protocolo
ALTER TABLE "protocols_simplified" ADD COLUMN IF NOT EXISTS "geocodedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "geo_cache" (
  "id" TEXT NOT NULL,
  "queryKey" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "formattedAddress" TEXT,
  "precision" TEXT,
  "placeId" TEXT,
  "hits" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "geo_cache_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "geo_cache_queryKey_key" ON "geo_cache"("queryKey");
CREATE INDEX IF NOT EXISTS "geo_cache_provider_idx" ON "geo_cache"("provider");
CREATE INDEX IF NOT EXISTS "geo_cache_expiresAt_idx" ON "geo_cache"("expiresAt");
