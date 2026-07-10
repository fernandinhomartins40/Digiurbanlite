-- ============================================================================
-- MULTI-TENANT: Citizen.personId unique global -> composta [tenantId, personId]
-- ============================================================================
-- Person é identidade GLOBAL por CPF (uma pessoa física no Brasil), mas pode
-- ser cidadã de MÚLTIPLOS municípios. O unique global de personId impedia isso
-- (registro do mesmo CPF no 2º município falhava com P2002 em personId).
-- Agora cada município tem seu vínculo cidadão<->pessoa; a Person continua única.
-- Person.citizen vira 1:N (citizens).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='citizens' AND constraint_name='citizens_personId_key') THEN
    ALTER TABLE "citizens" DROP CONSTRAINT "citizens_personId_key";
  ELSIF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='citizens_personId_key') THEN
    DROP INDEX "citizens_personId_key";
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "citizens_tenantId_personId_key" ON "citizens"("tenantId", "personId");
