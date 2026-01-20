-- AlterTable
ALTER TABLE "services_simplified" ADD COLUMN "serviceSubtype" TEXT;

-- CreateIndex (opcional, para performance)
CREATE INDEX "services_simplified_serviceSubtype_idx" ON "services_simplified"("serviceSubtype");
