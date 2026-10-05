-- Biometria facial: identidade por município, consentimento, registro de acesso,
-- configuração do motor e prazos de guarda (LGPD).

-- Identidade facial era única por pessoa NA PLATAFORMA: a mesma pessoa em dois
-- municípios dividia a biometria. Agora é única por pessoa em cada município.
DROP INDEX IF EXISTS "face_recognition_identities_personId_key";
CREATE UNIQUE INDEX "face_recognition_identities_tenantId_personId_key"
  ON "face_recognition_identities"("tenantId", "personId");

-- Linhas antigas sem município herdam o município do cidadão
UPDATE "face_recognition_identities" i SET "tenantId" = c."tenantId"
  FROM "citizens" c WHERE i."tenantId" IS NULL AND i."citizenId" = c."id";
UPDATE "face_enrollments" e SET "tenantId" = i."tenantId"
  FROM "face_recognition_identities" i WHERE e."tenantId" IS NULL AND e."identityId" = i."id";
UPDATE "face_embeddings" e SET "tenantId" = i."tenantId"
  FROM "face_recognition_identities" i WHERE e."tenantId" IS NULL AND e."identityId" = i."id";
UPDATE "face_devices" d SET "tenantId" = u."tenantId"
  FROM "unidades_educacao" u WHERE d."tenantId" IS NULL AND d."unidadeEducacaoId" = u."id";
UPDATE "face_zones" z SET "tenantId" = d."tenantId"
  FROM "face_devices" d WHERE z."tenantId" IS NULL AND z."deviceId" = d."id";
UPDATE "face_recognition_events" ev SET "tenantId" = d."tenantId"
  FROM "face_devices" d WHERE ev."tenantId" IS NULL AND ev."deviceId" = d."id";

-- O vetor do rosto ia junto nos metadados do evento: some
UPDATE "face_recognition_events"
   SET "metadata" = ("metadata"::jsonb - 'recognitionEmbedding' - 'liveRead' - 'liveSession')
 WHERE "metadata" IS NOT NULL;

ALTER TABLE "privacy_retention_settings"
  ADD COLUMN "faceUnmatchedImageDays" INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN "faceEventImageDays" INTEGER NOT NULL DEFAULT 90,
  ADD COLUMN "faceEventDays" INTEGER NOT NULL DEFAULT 365,
  ADD COLUMN "faceLastRunAt" TIMESTAMP(3),
  ADD COLUMN "faceLastRunSummary" JSONB;

CREATE TABLE "face_consents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "citizenId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "grantedByCitizenId" TEXT,
    "grantedByName" TEXT,
    "relationship" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recordedByUserId" TEXT,
    "termsVersion" TEXT NOT NULL,
    "evidence" JSONB,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "revokedBy" TEXT,
    CONSTRAINT "face_consents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "face_consents_tenantId_idx" ON "face_consents"("tenantId");
CREATE INDEX "face_consents_citizenId_purpose_idx" ON "face_consents"("citizenId", "purpose");

CREATE TABLE "face_access_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "citizenId" TEXT,
    "identityId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "face_access_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "face_access_logs_tenantId_createdAt_idx" ON "face_access_logs"("tenantId", "createdAt");
CREATE INDEX "face_access_logs_citizenId_createdAt_idx" ON "face_access_logs"("citizenId", "createdAt");

CREATE TABLE "face_engine_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "recognitionModel" TEXT NOT NULL DEFAULT 'arcface_mnet',
    "matchThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "reviewThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "minQuality" DOUBLE PRECISION NOT NULL DEFAULT 0.55,
    "minLiveness" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "challengeYawDegrees" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "face_engine_settings_pkey" PRIMARY KEY ("id")
);
INSERT INTO "face_engine_settings" ("id") VALUES ('singleton') ON CONFLICT DO NOTHING;

-- Quem já tinha biometria cadastrada antes deste registro: consentimento
-- registrado como "anterior ao termo" (o cidadão pode revogar no portal).
INSERT INTO "face_consents" ("id", "tenantId", "citizenId", "purpose", "relationship", "channel", "termsVersion", "evidence")
SELECT 'legacy_' || i."id", i."tenantId", i."citizenId", 'IDENTITY_VERIFICATION', 'TITULAR', 'LEGADO',
       'legado-2026-10', '{"nota":"Biometria cadastrada antes do registro formal de consentimento"}'::jsonb
  FROM "face_recognition_identities" i
 WHERE i."citizenId" IS NOT NULL
   AND EXISTS (SELECT 1 FROM "face_enrollments" e WHERE e."identityId" = i."id");

-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['face_consents', 'face_access_logs'] LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
      EXECUTE format($f$CREATE POLICY tenant_isolation ON %I USING (current_tenant_id() IS NULL OR current_tenant_id() = '__platform__' OR "tenantId" IS NULL OR "tenantId" = current_tenant_id()) WITH CHECK (current_tenant_id() IS NULL OR current_tenant_id() = '__platform__' OR "tenantId" IS NULL OR "tenantId" = current_tenant_id())$f$, t);
    EXCEPTION
      WHEN insufficient_privilege THEN RAISE WARNING 'RLS não aplicado em % (sem privilégio)', t;
      WHEN undefined_function THEN RAISE WARNING 'current_tenant_id() ausente ao proteger %', t;
    END;
  END LOOP;
END $OUTER$;
