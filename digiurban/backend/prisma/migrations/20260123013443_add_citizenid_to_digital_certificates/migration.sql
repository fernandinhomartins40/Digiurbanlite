-- AlterTable
ALTER TABLE "digital_certificates" ADD COLUMN "citizenId" TEXT;

-- CreateIndex
CREATE INDEX "digital_certificates_citizenId_idx" ON "digital_certificates"("citizenId");

-- AddForeignKey
ALTER TABLE "digital_certificates" ADD CONSTRAINT "digital_certificates_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
