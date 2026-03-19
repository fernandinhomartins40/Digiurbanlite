CREATE TABLE "protocol_stage_artifacts" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'UPLOADED',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "parecer" TEXT,
    "fileName" TEXT,
    "filePath" TEXT,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "generatedDocumentId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocol_stage_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "protocol_stage_artifacts_protocolId_stageId_createdAt_idx"
ON "protocol_stage_artifacts"("protocolId", "stageId", "createdAt");

CREATE INDEX "protocol_stage_artifacts_stageId_createdAt_idx"
ON "protocol_stage_artifacts"("stageId", "createdAt");

CREATE INDEX "protocol_stage_artifacts_generatedDocumentId_idx"
ON "protocol_stage_artifacts"("generatedDocumentId");

ALTER TABLE "protocol_stage_artifacts"
ADD CONSTRAINT "protocol_stage_artifacts_protocolId_fkey"
FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "protocol_stage_artifacts"
ADD CONSTRAINT "protocol_stage_artifacts_stageId_fkey"
FOREIGN KEY ("stageId") REFERENCES "protocol_stages"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "protocol_stage_artifacts"
ADD CONSTRAINT "protocol_stage_artifacts_generatedDocumentId_fkey"
FOREIGN KEY ("generatedDocumentId") REFERENCES "generated_documents"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
