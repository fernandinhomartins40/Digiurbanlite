-- Gabinete do Prefeito por perfil próprio (não mais "ser Administrador do sistema")
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gabineteAccess" BOOLEAN NOT NULL DEFAULT false;
-- quem já usava o painel (administradores) continua com acesso; o município tira de quem não é do gabinete
UPDATE "users" SET "gabineteAccess" = true WHERE "role" = 'ADMIN' AND "gabineteAccess" = false;

-- Agenda do Prefeito: agenda do sistema por município
ALTER TABLE "central_calendars" ADD COLUMN IF NOT EXISTS "systemKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "central_calendars_tenantId_systemKey_key" ON "central_calendars"("tenantId", "systemKey");
