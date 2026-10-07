-- Processo interno: quem faz cada etapa (papel → unidade), fluxos próprios do
-- município e pedidos de assinatura a uma pessoa (fila de assinaturas)
ALTER TABLE "internal_process_types" ADD COLUMN IF NOT EXISTS "flowDefinition" JSONB;
ALTER TABLE "internal_processes" ADD COLUMN IF NOT EXISTS "flowSnapshot" JSONB;

CREATE TABLE IF NOT EXISTS "internal_process_role_units" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "role" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "unitName" TEXT NOT NULL,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "internal_process_role_units_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "internal_process_role_units_tenantId_role_key" ON "internal_process_role_units"("tenantId", "role");
CREATE INDEX IF NOT EXISTS "internal_process_role_units_tenantId_idx" ON "internal_process_role_units"("tenantId");

CREATE TABLE IF NOT EXISTS "internal_process_signature_requests" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "processId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "requestedByName" TEXT NOT NULL,
  "note" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDENTE',
  "answerNote" TEXT,
  "signatureHash" TEXT,
  "signedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "internal_process_signature_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "internal_process_signature_requests_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "internal_process_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "internal_process_signature_requests_tenantId_idx" ON "internal_process_signature_requests"("tenantId");
CREATE INDEX IF NOT EXISTS "internal_process_signature_requests_userId_status_idx" ON "internal_process_signature_requests"("userId", "status");
CREATE INDEX IF NOT EXISTS "internal_process_signature_requests_requestedById_status_idx" ON "internal_process_signature_requests"("requestedById", "status");
CREATE INDEX IF NOT EXISTS "internal_process_signature_requests_documentId_idx" ON "internal_process_signature_requests"("documentId");
CREATE INDEX IF NOT EXISTS "internal_process_signature_requests_signatureHash_idx" ON "internal_process_signature_requests"("signatureHash");
