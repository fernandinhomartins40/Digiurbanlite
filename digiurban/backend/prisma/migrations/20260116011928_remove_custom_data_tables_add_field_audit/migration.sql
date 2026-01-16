/*
  Warnings:

  - You are about to drop the `custom_data_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `custom_data_tables` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "custom_data_records" DROP CONSTRAINT "custom_data_records_tableId_fkey";

-- DropTable
DROP TABLE "custom_data_records";

-- DropTable
DROP TABLE "custom_data_tables";

-- CreateTable
CREATE TABLE "field_approvals" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT NOT NULL,
    "reason" TEXT,
    "previousValue" TEXT,
    "newValue" TEXT,

    CONSTRAINT "field_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_changes" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oldValue" TEXT,
    "newValue" TEXT,
    "actor" TEXT NOT NULL,

    CONSTRAINT "field_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "field_approvals_fieldId_timestamp_idx" ON "field_approvals"("fieldId", "timestamp");

-- CreateIndex
CREATE INDEX "field_approvals_approvedBy_timestamp_idx" ON "field_approvals"("approvedBy", "timestamp");

-- CreateIndex
CREATE INDEX "field_changes_fieldId_timestamp_idx" ON "field_changes"("fieldId", "timestamp");

-- CreateIndex
CREATE INDEX "field_changes_actor_timestamp_idx" ON "field_changes"("actor", "timestamp");

-- AddForeignKey
ALTER TABLE "field_approvals" ADD CONSTRAINT "field_approvals_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_approvals" ADD CONSTRAINT "field_approvals_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "protocol_data_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_changes" ADD CONSTRAINT "field_changes_actor_fkey" FOREIGN KEY ("actor") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_changes" ADD CONSTRAINT "field_changes_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "protocol_data_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
