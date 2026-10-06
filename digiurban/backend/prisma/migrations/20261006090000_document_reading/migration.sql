-- Scanner e leitura automática de documentos (motor ultrazend-doc-engine)
CREATE TABLE IF NOT EXISTS "doc_scanner_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "smartCameraEnabled" BOOLEAN NOT NULL DEFAULT false,
    "readingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "doc_scanner_settings_pkey" PRIMARY KEY ("id")
);
INSERT INTO "doc_scanner_settings" ("id") VALUES ('singleton') ON CONFLICT DO NOTHING;

-- só o resultado da conferência (nunca o texto lido do documento)
CREATE TABLE IF NOT EXISTS "document_readings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "source" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "detectedKind" TEXT,
    "expectedKind" TEXT,
    "kindMatches" BOOLEAN,
    "nameMatch" TEXT,
    "cpfMatch" TEXT,
    "birthDateMatch" TEXT,
    "mrzValid" BOOLEAN,
    "qrFound" BOOLEAN NOT NULL DEFAULT false,
    "qrGovUrl" TEXT,
    "textQuality" DOUBLE PRECISION,
    "lineCount" INTEGER NOT NULL DEFAULT 0,
    "engineMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_readings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "document_readings_source_documentId_key" ON "document_readings"("source", "documentId");
CREATE INDEX IF NOT EXISTS "document_readings_tenantId_idx" ON "document_readings"("tenantId");

DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['document_readings'] LOOP
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
