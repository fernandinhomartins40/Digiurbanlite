-- AlterTable
ALTER TABLE "digital_certificates" ADD COLUMN "citizenId" TEXT;

-- AlterTable: Tornar userId opcional
ALTER TABLE "digital_certificates" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "digital_certificates_citizenId_idx" ON "digital_certificates"("citizenId");

-- AddForeignKey
ALTER TABLE "digital_certificates" ADD CONSTRAINT "digital_certificates_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
