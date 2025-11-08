/*
  Warnings:

  - You are about to drop the column `citizenCpf` on the `campaign_enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `citizenName` on the `campaign_enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `enrolledBy` on the `campaign_enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `enrollmentDate` on the `campaign_enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `patientBirthDate` on the `campaign_enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `patientPhone` on the `campaign_enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `dispenseDate` on the `medication_dispenses` table. All the data in the column will be lost.
  - You are about to drop the column `dispensedBy` on the `medication_dispenses` table. All the data in the column will be lost.
  - You are about to drop the column `patientCpf` on the `medication_dispenses` table. All the data in the column will be lost.
  - You are about to drop the column `patientName` on the `medication_dispenses` table. All the data in the column will be lost.
  - You are about to drop the column `pharmacistName` on the `medication_dispenses` table. All the data in the column will be lost.
  - Added the required column `citizenId` to the `campaign_enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `protocol` to the `campaign_enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `citizenId` to the `medication_dispenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `protocol` to the `medication_dispenses` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "medical_appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "healthUnit" TEXT,
    "preferredDate" DATETIME,
    "preferredShift" TEXT,
    "appointmentDate" DATETIME,
    "appointmentTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "cancellationReason" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'AGENDAMENTOS_MEDICOS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "medical_appointments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "medical_appointments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "home_cares" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "careType" TEXT NOT NULL,
    "frequency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'ATENDIMENTO_DOMICILIAR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "home_cares_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "home_cares_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vaccination_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "vaccine" TEXT NOT NULL,
    "dose" TEXT,
    "healthUnit" TEXT,
    "scheduledDate" DATETIME,
    "scheduledTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "cancellationReason" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'VACINACAO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vaccination_records_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "vaccination_records_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "medical_exams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "healthUnit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'EXAMES',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "medical_exams_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "medical_exams_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_campaign_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "campaignId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'enrolled',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'PROGRAMAS_SAUDE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "campaign_enrollments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "campaign_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_campaign_enrollments" ("campaignId", "createdAt", "id", "observations", "status", "updatedAt") SELECT "campaignId", "createdAt", "id", "observations", "status", "updatedAt" FROM "campaign_enrollments";
DROP TABLE "campaign_enrollments";
ALTER TABLE "new_campaign_enrollments" RENAME TO "campaign_enrollments";
CREATE UNIQUE INDEX "campaign_enrollments_protocol_key" ON "campaign_enrollments"("protocol");
CREATE INDEX "campaign_enrollments_citizenId_idx" ON "campaign_enrollments"("citizenId");
CREATE INDEX "campaign_enrollments_moduleType_idx" ON "campaign_enrollments"("moduleType");
CREATE INDEX "campaign_enrollments_protocolId_idx" ON "campaign_enrollments"("protocolId");
CREATE INDEX "campaign_enrollments_status_idx" ON "campaign_enrollments"("status");
CREATE TABLE "new_medication_dispenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "dosage" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "prescriptionId" TEXT,
    "unitId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'CONTROLE_MEDICAMENTOS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "medication_dispenses_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "medication_dispenses_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_medication_dispenses" ("createdAt", "dosage", "id", "medicationName", "moduleType", "observations", "prescriptionId", "protocolId", "quantity", "status", "unitId", "updatedAt") SELECT "createdAt", "dosage", "id", "medicationName", "moduleType", "observations", "prescriptionId", "protocolId", "quantity", "status", "unitId", "updatedAt" FROM "medication_dispenses";
DROP TABLE "medication_dispenses";
ALTER TABLE "new_medication_dispenses" RENAME TO "medication_dispenses";
CREATE UNIQUE INDEX "medication_dispenses_protocol_key" ON "medication_dispenses"("protocol");
CREATE INDEX "medication_dispenses_citizenId_idx" ON "medication_dispenses"("citizenId");
CREATE INDEX "medication_dispenses_moduleType_idx" ON "medication_dispenses"("moduleType");
CREATE INDEX "medication_dispenses_protocolId_idx" ON "medication_dispenses"("protocolId");
CREATE INDEX "medication_dispenses_status_idx" ON "medication_dispenses"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "medical_appointments_protocol_key" ON "medical_appointments"("protocol");

-- CreateIndex
CREATE INDEX "medical_appointments_citizenId_idx" ON "medical_appointments"("citizenId");

-- CreateIndex
CREATE INDEX "medical_appointments_moduleType_idx" ON "medical_appointments"("moduleType");

-- CreateIndex
CREATE INDEX "medical_appointments_protocolId_idx" ON "medical_appointments"("protocolId");

-- CreateIndex
CREATE INDEX "medical_appointments_status_idx" ON "medical_appointments"("status");

-- CreateIndex
CREATE INDEX "medical_appointments_createdAt_idx" ON "medical_appointments"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "home_cares_protocol_key" ON "home_cares"("protocol");

-- CreateIndex
CREATE INDEX "home_cares_citizenId_idx" ON "home_cares"("citizenId");

-- CreateIndex
CREATE INDEX "home_cares_moduleType_idx" ON "home_cares"("moduleType");

-- CreateIndex
CREATE INDEX "home_cares_protocolId_idx" ON "home_cares"("protocolId");

-- CreateIndex
CREATE INDEX "home_cares_status_idx" ON "home_cares"("status");

-- CreateIndex
CREATE UNIQUE INDEX "vaccination_records_protocol_key" ON "vaccination_records"("protocol");

-- CreateIndex
CREATE INDEX "vaccination_records_citizenId_idx" ON "vaccination_records"("citizenId");

-- CreateIndex
CREATE INDEX "vaccination_records_moduleType_idx" ON "vaccination_records"("moduleType");

-- CreateIndex
CREATE INDEX "vaccination_records_protocolId_idx" ON "vaccination_records"("protocolId");

-- CreateIndex
CREATE INDEX "vaccination_records_status_idx" ON "vaccination_records"("status");

-- CreateIndex
CREATE INDEX "vaccination_records_createdAt_idx" ON "vaccination_records"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "medical_exams_protocol_key" ON "medical_exams"("protocol");

-- CreateIndex
CREATE INDEX "medical_exams_citizenId_idx" ON "medical_exams"("citizenId");

-- CreateIndex
CREATE INDEX "medical_exams_moduleType_idx" ON "medical_exams"("moduleType");

-- CreateIndex
CREATE INDEX "medical_exams_protocolId_idx" ON "medical_exams"("protocolId");

-- CreateIndex
CREATE INDEX "medical_exams_status_idx" ON "medical_exams"("status");
