ALTER TYPE "PendingStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';

ALTER TABLE "protocol_pendings"
ADD COLUMN "stageId" TEXT,
ADD COLUMN "submittedAt" TIMESTAMP(3),
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedBy" TEXT,
ADD COLUMN "reviewNotes" TEXT,
ADD COLUMN "requiresReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sourceType" TEXT,
ADD COLUMN "sourceEntityType" TEXT,
ADD COLUMN "sourceEntityId" TEXT,
ADD COLUMN "dedupeKey" TEXT;

CREATE INDEX "protocol_pendings_protocolId_dedupeKey_status_idx"
ON "protocol_pendings"("protocolId", "dedupeKey", "status");

CREATE INDEX "protocol_pendings_stageId_idx"
ON "protocol_pendings"("stageId");
