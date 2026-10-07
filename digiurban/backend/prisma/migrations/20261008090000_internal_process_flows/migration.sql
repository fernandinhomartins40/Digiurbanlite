-- Fluxos com etapas (licitação e contratação direta — Lei 14.133/2021) e
-- documentos do processo interno (DFD, ETP, Termo de Referência...)
ALTER TABLE "internal_process_types" ADD COLUMN IF NOT EXISTS "flowKey" TEXT;

ALTER TABLE "internal_processes" ADD COLUMN IF NOT EXISTS "flowKey" TEXT;
ALTER TABLE "internal_processes" ADD COLUMN IF NOT EXISTS "stageKey" TEXT;
ALTER TABLE "internal_processes" ADD COLUMN IF NOT EXISTS "stageDueAt" TIMESTAMP(3);
ALTER TABLE "internal_processes" ADD COLUMN IF NOT EXISTS "fields" JSONB;
CREATE INDEX IF NOT EXISTS "internal_processes_flowKey_stageKey_idx" ON "internal_processes"("flowKey", "stageKey");

CREATE TABLE IF NOT EXISTS "internal_process_documents" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "processId" TEXT NOT NULL,
  "templateKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "stageKey" TEXT,
  "content" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdByName" TEXT NOT NULL,
  "updatedById" TEXT,
  "updatedByName" TEXT,
  "signatureHash" TEXT,
  "signedById" TEXT,
  "signedByName" TEXT,
  "signedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "internal_process_documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "internal_process_documents_processId_fkey" FOREIGN KEY ("processId") REFERENCES "internal_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "internal_process_documents_processId_idx" ON "internal_process_documents"("processId");
CREATE INDEX IF NOT EXISTS "internal_process_documents_tenantId_idx" ON "internal_process_documents"("tenantId");
CREATE INDEX IF NOT EXISTS "internal_process_documents_signatureHash_idx" ON "internal_process_documents"("signatureHash");
