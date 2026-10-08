-- Ponto da casa do cidadão confirmado (GPS ou alfinete no mapa)
ALTER TABLE "citizens" ADD COLUMN IF NOT EXISTS "homeLatitude" DOUBLE PRECISION;
ALTER TABLE "citizens" ADD COLUMN IF NOT EXISTS "homeLongitude" DOUBLE PRECISION;
ALTER TABLE "citizens" ADD COLUMN IF NOT EXISTS "homeLocationSource" TEXT;
ALTER TABLE "citizens" ADD COLUMN IF NOT EXISTS "homeLocationAt" TIMESTAMP(3);
ALTER TABLE "citizens" ADD COLUMN IF NOT EXISTS "homeLocationKey" TEXT;
