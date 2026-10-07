-- Motor único de assinatura: assinaturas com município, assinante e código de
-- conferência; documento do processo interno assinado com certificado;
-- arquivo assinado (original + folha de assinaturas + selo); fila única de
-- pedidos de assinatura.

ALTER TABLE "signatures" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "signatures" ADD COLUMN IF NOT EXISTS "internalDocumentId" TEXT;
ALTER TABLE "signatures" ADD COLUMN IF NOT EXISTS "signerName" TEXT;
ALTER TABLE "signatures" ADD COLUMN IF NOT EXISTS "signerUserId" TEXT;
ALTER TABLE "signatures" ADD COLUMN IF NOT EXISTS "signerCitizenId" TEXT;
ALTER TABLE "signatures" ADD COLUMN IF NOT EXISTS "signerRole" TEXT;
ALTER TABLE "signatures" ADD COLUMN IF NOT EXISTS "code" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "signatures_code_key" ON "signatures"("code");
CREATE INDEX IF NOT EXISTS "signatures_tenantId_idx" ON "signatures"("tenantId");
CREATE INDEX IF NOT EXISTS "signatures_internalDocumentId_idx" ON "signatures"("internalDocumentId");
DO $$ BEGIN
  ALTER TABLE "signatures" ADD CONSTRAINT "signatures_internalDocumentId_fkey"
    FOREIGN KEY ("internalDocumentId") REFERENCES "internal_process_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- município das assinaturas antigas (pelo certificado)
UPDATE "signatures" s SET "tenantId" = c."tenantId"
  FROM "digital_certificates" c WHERE s."certificateId" = c."id" AND s."tenantId" IS NULL;
UPDATE "signatures" s SET "signerName" = c."commonName", "signerUserId" = c."userId", "signerCitizenId" = c."citizenId"
  FROM "digital_certificates" c WHERE s."certificateId" = c."id" AND s."signerName" IS NULL;

ALTER TABLE "certificate_revocation_list" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
CREATE INDEX IF NOT EXISTS "certificate_revocation_list_tenantId_idx" ON "certificate_revocation_list"("tenantId");
UPDATE "certificate_revocation_list" r SET "tenantId" = c."tenantId"
  FROM "digital_certificates" c WHERE r."serialNumber" = c."serialNumber" AND r."tenantId" IS NULL;

ALTER TABLE "generated_documents" ADD COLUMN IF NOT EXISTS "signedFilePath" TEXT;
ALTER TABLE "generated_documents" ADD COLUMN IF NOT EXISTS "finalHash" TEXT;
ALTER TABLE "external_documents" ADD COLUMN IF NOT EXISTS "signedFilePath" TEXT;
ALTER TABLE "external_documents" ADD COLUMN IF NOT EXISTS "finalHash" TEXT;

CREATE TABLE IF NOT EXISTS "signature_requests" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "protocolId" TEXT,
  "processId" TEXT,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "requestedByName" TEXT NOT NULL,
  "note" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDENTE',
  "answerNote" TEXT,
  "signatureId" TEXT,
  "signedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "signature_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "signature_requests_tenantId_idx" ON "signature_requests"("tenantId");
CREATE INDEX IF NOT EXISTS "signature_requests_userId_status_idx" ON "signature_requests"("userId", "status");
CREATE INDEX IF NOT EXISTS "signature_requests_requestedById_status_idx" ON "signature_requests"("requestedById", "status");
CREATE INDEX IF NOT EXISTS "signature_requests_targetType_targetId_idx" ON "signature_requests"("targetType", "targetId");

-- pedidos pendentes do processo interno passam para a fila única
-- (os já respondidos ficam na tabela antiga, só para conferir assinaturas antigas)
INSERT INTO "signature_requests" ("id", "tenantId", "targetType", "targetId", "title", "processId", "userId", "userName",
  "requestedById", "requestedByName", "note", "status", "createdAt", "updatedAt")
SELECT r."id", r."tenantId", 'INTERNAL', r."documentId", d."title", r."processId", r."userId", r."userName",
  r."requestedById", r."requestedByName", r."note", 'PENDENTE', r."createdAt", r."updatedAt"
FROM "internal_process_signature_requests" r
JOIN "internal_process_documents" d ON d."id" = r."documentId"
WHERE r."status" = 'PENDENTE'
ON CONFLICT ("id") DO NOTHING;
UPDATE "internal_process_signature_requests" SET "status" = 'MIGRADO' WHERE "status" = 'PENDENTE';
