/*
  Warnings:

  - You are about to drop the column `beneficiaryCpf` on the `social_program_enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `beneficiaryName` on the `social_program_enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyIncome` on the `social_program_enrollments` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `social_program_enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `protocol` to the `social_program_enrollments` table without a default value. This is not possible if the table is not empty.
  - Made the column `citizenId` on table `social_program_enrollments` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "social_benefit_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "benefitType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "familyIncome" REAL,
    "familySize" INTEGER,
    "justification" TEXT,
    "documents" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL DEFAULT 'BENEFICIO_SOCIAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "social_benefit_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "social_benefit_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "document_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL DEFAULT 'DOCUMENTO_SOCIAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "document_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "document_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "family_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "familyMembers" JSONB NOT NULL DEFAULT [],
    "familyIncome" REAL,
    "housingType" TEXT,
    "vulnerability" TEXT,
    "needsAssessment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL DEFAULT 'CADASTRO_FAMILIAR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "family_registrations_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "family_registrations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "social_home_visits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "visitReason" TEXT NOT NULL,
    "visitType" TEXT NOT NULL DEFAULT 'avaliacao',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "scheduledDate" DATETIME,
    "completedDate" DATETIME,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL DEFAULT 'VISITA_DOMICILIAR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "social_home_visits_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "social_home_visits_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_social_program_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "programId" TEXT,
    "programName" TEXT,
    "programType" TEXT,
    "enrollmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "familyIncome" REAL,
    "familySize" INTEGER,
    "vulnerability" TEXT,
    "documents" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "approvedDate" DATETIME,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "benefits" JSONB,
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL DEFAULT 'PROGRAMA_SOCIAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "social_program_enrollments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "social_program_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_social_program_enrollments" ("approvedDate", "benefits", "citizenId", "createdAt", "endDate", "enrollmentDate", "familySize", "id", "observations", "priority", "programName", "programType", "protocolId", "startDate", "status", "updatedAt") SELECT "approvedDate", "benefits", "citizenId", "createdAt", "endDate", "enrollmentDate", "familySize", "id", "observations", "priority", "programName", "programType", "protocolId", "startDate", "status", "updatedAt" FROM "social_program_enrollments";
DROP TABLE "social_program_enrollments";
ALTER TABLE "new_social_program_enrollments" RENAME TO "social_program_enrollments";
CREATE UNIQUE INDEX "social_program_enrollments_protocol_key" ON "social_program_enrollments"("protocol");
CREATE INDEX "social_program_enrollments_citizenId_idx" ON "social_program_enrollments"("citizenId");
CREATE INDEX "social_program_enrollments_protocolId_idx" ON "social_program_enrollments"("protocolId");
CREATE INDEX "social_program_enrollments_status_idx" ON "social_program_enrollments"("status");
CREATE INDEX "social_program_enrollments_createdAt_idx" ON "social_program_enrollments"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "social_benefit_requests_protocol_key" ON "social_benefit_requests"("protocol");

-- CreateIndex
CREATE INDEX "social_benefit_requests_citizenId_idx" ON "social_benefit_requests"("citizenId");

-- CreateIndex
CREATE INDEX "social_benefit_requests_protocolId_idx" ON "social_benefit_requests"("protocolId");

-- CreateIndex
CREATE INDEX "social_benefit_requests_status_idx" ON "social_benefit_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "document_requests_protocol_key" ON "document_requests"("protocol");

-- CreateIndex
CREATE INDEX "document_requests_citizenId_idx" ON "document_requests"("citizenId");

-- CreateIndex
CREATE INDEX "document_requests_protocolId_idx" ON "document_requests"("protocolId");

-- CreateIndex
CREATE INDEX "document_requests_status_idx" ON "document_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "family_registrations_protocol_key" ON "family_registrations"("protocol");

-- CreateIndex
CREATE INDEX "family_registrations_citizenId_idx" ON "family_registrations"("citizenId");

-- CreateIndex
CREATE INDEX "family_registrations_protocolId_idx" ON "family_registrations"("protocolId");

-- CreateIndex
CREATE INDEX "family_registrations_status_idx" ON "family_registrations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "social_home_visits_protocol_key" ON "social_home_visits"("protocol");

-- CreateIndex
CREATE INDEX "social_home_visits_citizenId_idx" ON "social_home_visits"("citizenId");

-- CreateIndex
CREATE INDEX "social_home_visits_protocolId_idx" ON "social_home_visits"("protocolId");

-- CreateIndex
CREATE INDEX "social_home_visits_status_idx" ON "social_home_visits"("status");
