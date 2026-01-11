-- CreateEnum
CREATE TYPE "DataFieldStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CORRECTED');

-- CreateTable
CREATE TABLE "protocol_data_fields" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "fieldValue" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "fieldType" TEXT,
    "status" "DataFieldStatus" NOT NULL DEFAULT 'PENDING',
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocol_data_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "protocol_data_fields_protocolId_status_idx" ON "protocol_data_fields"("protocolId", "status");

-- CreateIndex
CREATE INDEX "protocol_data_fields_status_idx" ON "protocol_data_fields"("status");

-- CreateIndex
CREATE UNIQUE INDEX "protocol_data_fields_protocolId_fieldKey_key" ON "protocol_data_fields"("protocolId", "fieldKey");

-- AddForeignKey
ALTER TABLE "protocol_data_fields" ADD CONSTRAINT "protocol_data_fields_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;
