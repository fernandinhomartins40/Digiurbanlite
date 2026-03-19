-- ============================================================================
-- MIGRATION: Lifecycle de documentos gerados + schema de entrada por template
-- ============================================================================

ALTER TABLE "document_templates"
ADD COLUMN "inputSchema" JSONB;

ALTER TABLE "generated_documents"
ADD COLUMN "inputData" JSONB,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING_SIGNATURE',
ADD COLUMN "publishedToCitizen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "publishedBy" TEXT,
ADD COLUMN "revisionNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "previousVersionId" TEXT,
ADD COLUMN "supersededAt" TIMESTAMP(3),
ADD COLUMN "sourceStageId" TEXT,
ADD COLUMN "sourceStageName" TEXT;

UPDATE "generated_documents"
SET "status" = CASE
  WHEN "isSigned" = true THEN 'SIGNED'
  ELSE 'PENDING_SIGNATURE'
END
WHERE "status" IS NULL OR "status" = '';

CREATE INDEX "generated_documents_status_idx" ON "generated_documents"("status");
CREATE INDEX "generated_documents_publishedToCitizen_idx" ON "generated_documents"("publishedToCitizen");
