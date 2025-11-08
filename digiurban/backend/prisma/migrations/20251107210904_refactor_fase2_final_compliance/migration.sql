/*
  Warnings:

  - You are about to drop the column `patientBirthDate` on the `health_appointments` table. All the data in the column will be lost.
  - You are about to drop the column `patientCpf` on the `health_appointments` table. All the data in the column will be lost.
  - You are about to drop the column `patientName` on the `health_appointments` table. All the data in the column will be lost.
  - You are about to drop the column `patientPhone` on the `health_appointments` table. All the data in the column will be lost.
  - You are about to drop the column `patientCpf` on the `health_exams` table. All the data in the column will be lost.
  - You are about to drop the column `patientName` on the `health_exams` table. All the data in the column will be lost.
  - You are about to drop the column `patientPhone` on the `health_exams` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `cpf` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `rg` on the `students` table. All the data in the column will be lost.
  - Added the required column `citizenId` to the `health_appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `citizenId` to the `health_exams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `citizenId` to the `students` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_health_appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "appointmentDate" DATETIME NOT NULL,
    "appointmentTime" TEXT NOT NULL,
    "doctorId" TEXT,
    "speciality" TEXT NOT NULL DEFAULT 'GENERAL',
    "healthUnitId" TEXT,
    "healthUnitName" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "confirmedAt" DATETIME,
    "symptoms" TEXT,
    "observations" TEXT,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "followUpDate" DATETIME,
    "prescriptions" JSONB,
    "examRequests" JSONB,
    "moduleType" TEXT NOT NULL DEFAULT 'AGENDAMENTOS_MEDICOS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_appointments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "health_appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "health_doctors" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "health_appointments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_health_appointments" ("appointmentDate", "appointmentTime", "createdAt", "diagnosis", "doctorId", "followUpDate", "id", "moduleType", "observations", "priority", "protocolId", "speciality", "status", "symptoms", "treatment", "updatedAt") SELECT "appointmentDate", "appointmentTime", "createdAt", "diagnosis", "doctorId", "followUpDate", "id", "moduleType", "observations", "priority", "protocolId", "speciality", "status", "symptoms", "treatment", "updatedAt" FROM "health_appointments";
DROP TABLE "health_appointments";
ALTER TABLE "new_health_appointments" RENAME TO "health_appointments";
CREATE INDEX "health_appointments_citizenId_idx" ON "health_appointments"("citizenId");
CREATE INDEX "health_appointments_moduleType_idx" ON "health_appointments"("moduleType");
CREATE INDEX "health_appointments_protocolId_idx" ON "health_appointments"("protocolId");
CREATE INDEX "health_appointments_status_idx" ON "health_appointments"("status");
CREATE INDEX "health_appointments_createdAt_idx" ON "health_appointments"("createdAt");
CREATE INDEX "health_appointments_moduleType_status_idx" ON "health_appointments"("moduleType", "status");
CREATE TABLE "new_health_exams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDate" DATETIME,
    "resultDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "requestedBy" TEXT NOT NULL,
    "requestedById" TEXT,
    "healthUnit" TEXT,
    "healthUnitId" TEXT,
    "laboratory" TEXT,
    "observations" TEXT,
    "result" TEXT,
    "resultValue" TEXT,
    "resultUnit" TEXT,
    "referenceValue" TEXT,
    "attachments" JSONB,
    "files" JSONB,
    "moduleType" TEXT NOT NULL DEFAULT 'EXAMES',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_exams_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "health_exams_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_health_exams" ("attachments", "createdAt", "examName", "examType", "healthUnit", "id", "moduleType", "observations", "priority", "protocolId", "requestDate", "requestedBy", "result", "resultDate", "scheduledDate", "status", "updatedAt") SELECT "attachments", "createdAt", "examName", "examType", "healthUnit", "id", "moduleType", "observations", "priority", "protocolId", "requestDate", "requestedBy", "result", "resultDate", "scheduledDate", "status", "updatedAt" FROM "health_exams";
DROP TABLE "health_exams";
ALTER TABLE "new_health_exams" RENAME TO "health_exams";
CREATE INDEX "health_exams_citizenId_idx" ON "health_exams"("citizenId");
CREATE INDEX "health_exams_moduleType_idx" ON "health_exams"("moduleType");
CREATE INDEX "health_exams_protocolId_idx" ON "health_exams"("protocolId");
CREATE INDEX "health_exams_status_idx" ON "health_exams"("status");
CREATE TABLE "new_students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "studentName" TEXT,
    "studentBirthDate" DATETIME,
    "studentCpf" TEXT,
    "parentName" TEXT,
    "parentPhone" TEXT,
    "parentEmail" TEXT,
    "schoolId" TEXT NOT NULL,
    "medicalInfo" JSONB,
    "specialNeeds" TEXT,
    "bloodType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "moduleType" TEXT NOT NULL DEFAULT 'MATRICULA_ALUNO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "students_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "students_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_students" ("createdAt", "id", "isActive", "medicalInfo", "moduleType", "parentEmail", "parentName", "parentPhone", "protocolId", "schoolId", "updatedAt") SELECT "createdAt", "id", "isActive", "medicalInfo", "moduleType", "parentEmail", "parentName", "parentPhone", "protocolId", "schoolId", "updatedAt" FROM "students";
DROP TABLE "students";
ALTER TABLE "new_students" RENAME TO "students";
CREATE INDEX "students_citizenId_idx" ON "students"("citizenId");
CREATE INDEX "students_moduleType_idx" ON "students"("moduleType");
CREATE INDEX "students_protocolId_idx" ON "students"("protocolId");
CREATE INDEX "students_createdAt_idx" ON "students"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
