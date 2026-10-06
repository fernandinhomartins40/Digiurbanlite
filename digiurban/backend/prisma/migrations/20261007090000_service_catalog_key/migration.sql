-- De qual item do catálogo da plataforma o serviço veio, e a "impressão" do que
-- foi aplicado: melhoria do catálogo só chega a serviço que o município não editou
ALTER TABLE "services_simplified" ADD COLUMN IF NOT EXISTS "catalogKey" TEXT;
ALTER TABLE "services_simplified" ADD COLUMN IF NOT EXISTS "catalogHash" TEXT;
CREATE INDEX IF NOT EXISTS "services_simplified_tenantId_catalogKey_idx" ON "services_simplified"("tenantId", "catalogKey");
