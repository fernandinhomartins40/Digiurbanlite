-- Histórico de envios de documentos de protocolo
CREATE TABLE "protocol_document_versions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "documentId" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "status" "DocumentStatus" NOT NULL,
    "uploadedAt" TIMESTAMP(3),
    "uploadedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "validatedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocol_document_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "protocol_document_versions_documentId_version_idx" ON "protocol_document_versions"("documentId", "version");
CREATE INDEX "protocol_document_versions_protocolId_idx" ON "protocol_document_versions"("protocolId");
CREATE INDEX "protocol_document_versions_tenantId_idx" ON "protocol_document_versions"("tenantId");

ALTER TABLE "protocol_document_versions" ADD CONSTRAINT "protocol_document_versions_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "protocol_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- O reenvio gravava o próprio id como "versão anterior" (laço infinito ao listar versões)
UPDATE "protocol_documents" SET "previousDocId" = NULL WHERE "previousDocId" = "id";

-- Pendências abertas de protocolos já encerrados continuavam gerando lembretes
UPDATE "protocol_pendings" p
   SET "status" = 'CANCELLED',
       "resolvedAt" = NOW(),
       "resolution" = 'Encerrada automaticamente: o protocolo já estava encerrado.'
  FROM "protocols_simplified" ps
 WHERE ps."id" = p."protocolId"
   AND ps."status" IN ('CONCLUIDO', 'CANCELADO')
   AND p."status" IN ('OPEN', 'IN_PROGRESS', 'UNDER_REVIEW');

-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['protocol_document_versions'] LOOP
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
