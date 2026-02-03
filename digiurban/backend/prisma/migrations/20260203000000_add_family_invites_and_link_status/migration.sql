-- CreateEnum
CREATE TYPE "FamilyLinkStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "family_compositions" ADD COLUMN "status" "FamilyLinkStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "family_invites" (
    "id" TEXT NOT NULL,
    "headId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT,
    "phone" TEXT,
    "name" TEXT,
    "relationship" "FamilyRelationship" NOT NULL,
    "isDependent" BOOLEAN NOT NULL DEFAULT false,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "message" TEXT,
    "monthlyIncome" DECIMAL(65,30),
    "occupation" TEXT,
    "education" TEXT,
    "hasDisability" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "family_invites_token_key" ON "family_invites"("token");

-- CreateIndex
CREATE INDEX "family_invites_token_idx" ON "family_invites"("token");

-- CreateIndex
CREATE INDEX "family_invites_email_idx" ON "family_invites"("email");

-- CreateIndex
CREATE INDEX "family_invites_status_idx" ON "family_invites"("status");

-- CreateIndex
CREATE INDEX "family_invites_expiresAt_idx" ON "family_invites"("expiresAt");

-- CreateIndex
CREATE INDEX "family_compositions_status_idx" ON "family_compositions"("status");

-- AddForeignKey
ALTER TABLE "family_invites" ADD CONSTRAINT "family_invites_headId_fkey" FOREIGN KEY ("headId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
