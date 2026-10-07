-- Hierarquia e dados profissionais ganham município (estavam sem tenantId:
-- a lista de hierarquia mostrava a de todos os municípios)
ALTER TABLE "employee_hierarchies" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
UPDATE "employee_hierarchies" h SET "tenantId" = u."tenantId" FROM "users" u WHERE u."id" = h."subordinadoId" AND h."tenantId" IS NULL;
CREATE INDEX IF NOT EXISTS "employee_hierarchies_tenantId_idx" ON "employee_hierarchies"("tenantId");

ALTER TABLE "health_professional_data" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "education_professional_data" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "engineering_professional_data" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "social_assistance_professional_data" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
UPDATE "health_professional_data" d SET "tenantId" = u."tenantId" FROM "users" u WHERE u."id" = d."userId" AND d."tenantId" IS NULL;
UPDATE "education_professional_data" d SET "tenantId" = u."tenantId" FROM "users" u WHERE u."id" = d."userId" AND d."tenantId" IS NULL;
UPDATE "engineering_professional_data" d SET "tenantId" = u."tenantId" FROM "users" u WHERE u."id" = d."userId" AND d."tenantId" IS NULL;
UPDATE "social_assistance_professional_data" d SET "tenantId" = u."tenantId" FROM "users" u WHERE u."id" = d."userId" AND d."tenantId" IS NULL;
CREATE INDEX IF NOT EXISTS "health_professional_data_tenantId_idx" ON "health_professional_data"("tenantId");
CREATE INDEX IF NOT EXISTS "education_professional_data_tenantId_idx" ON "education_professional_data"("tenantId");
CREATE INDEX IF NOT EXISTS "engineering_professional_data_tenantId_idx" ON "engineering_professional_data"("tenantId");
CREATE INDEX IF NOT EXISTS "social_assistance_professional_data_tenantId_idx" ON "social_assistance_professional_data"("tenantId");

-- registro em conselho / CNS únicos POR município (o profissional pode atender em dois)
DROP INDEX IF EXISTS "health_professional_data_cns_key";
DROP INDEX IF EXISTS "health_professional_data_registroProfissional_key";
DROP INDEX IF EXISTS "engineering_professional_data_registroProfissional_key";
DROP INDEX IF EXISTS "social_assistance_professional_data_registroProfissional_key";
CREATE UNIQUE INDEX IF NOT EXISTS "health_professional_data_tenantId_cns_key" ON "health_professional_data"("tenantId", "cns");
CREATE UNIQUE INDEX IF NOT EXISTS "health_professional_data_tenantId_registroProfissional_key" ON "health_professional_data"("tenantId", "registroProfissional");
CREATE UNIQUE INDEX IF NOT EXISTS "engineering_professional_data_tenantId_registroProfissional_key" ON "engineering_professional_data"("tenantId", "registroProfissional");
CREATE UNIQUE INDEX IF NOT EXISTS "social_assistance_professional_data_tenantId_registroProfissional_key" ON "social_assistance_professional_data"("tenantId", "registroProfissional");
