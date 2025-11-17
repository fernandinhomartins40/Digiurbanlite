-- CreateEnum
CREATE TYPE "CitizenLinkType" AS ENUM ('STUDENT', 'GUARDIAN', 'PATIENT', 'COMPANION', 'DEPENDENT', 'FAMILY_MEMBER', 'AUTHORIZED_PERSON', 'BENEFICIARY', 'WITNESS', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceRole" AS ENUM ('BENEFICIARY', 'RESPONSIBLE', 'AUTHORIZED', 'COMPANION', 'WITNESS', 'OTHER');

-- CreateTable
CREATE TABLE "protocol_citizen_links" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "linkedCitizenId" TEXT NOT NULL,
    "linkType" "CitizenLinkType" NOT NULL,
    "relationship" TEXT,
    "role" "ServiceRole" NOT NULL,
    "contextData" JSONB,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocol_citizen_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "protocol_citizen_links_protocolId_idx" ON "protocol_citizen_links"("protocolId");

-- CreateIndex
CREATE INDEX "protocol_citizen_links_linkedCitizenId_idx" ON "protocol_citizen_links"("linkedCitizenId");

-- CreateIndex
CREATE INDEX "protocol_citizen_links_linkType_idx" ON "protocol_citizen_links"("linkType");

-- CreateIndex
CREATE INDEX "protocol_citizen_links_protocolId_linkType_idx" ON "protocol_citizen_links"("protocolId", "linkType");

-- AddForeignKey
ALTER TABLE "protocol_citizen_links" ADD CONSTRAINT "protocol_citizen_links_linkedCitizenId_fkey" FOREIGN KEY ("linkedCitizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_citizen_links" ADD CONSTRAINT "protocol_citizen_links_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;
