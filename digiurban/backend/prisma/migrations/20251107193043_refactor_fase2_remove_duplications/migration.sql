/*
  Warnings:

  - You are about to drop the column `address` on the `community_health_agents` table. All the data in the column will be lost.
  - You are about to drop the column `agentCpf` on the `community_health_agents` table. All the data in the column will be lost.
  - You are about to drop the column `agentEmail` on the `community_health_agents` table. All the data in the column will be lost.
  - You are about to drop the column `agentName` on the `community_health_agents` table. All the data in the column will be lost.
  - You are about to drop the column `agentPhone` on the `community_health_agents` table. All the data in the column will be lost.
  - You are about to drop the column `coverageArea` on the `community_health_agents` table. All the data in the column will be lost.
  - You are about to drop the column `cpf` on the `community_health_agents` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `community_health_agents` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `community_health_agents` table. All the data in the column will be lost.
  - You are about to drop the column `healthUnit` on the `community_health_agents` table. All the data in the column will be lost.
  - You are about to drop the column `hiringDate` on the `community_health_agents` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `community_health_agents` table. All the data in the column will be lost.
  - You are about to drop the column `registrationNum` on the `community_health_agents` table. All the data in the column will be lost.
  - You are about to drop the column `supervisor` on the `community_health_agents` table. All the data in the column will be lost.
  - You are about to drop the column `citizenCpf` on the `education_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `citizenEmail` on the `education_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `citizenName` on the `education_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `citizenPhone` on the `education_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `citizenCPF` on the `health_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `citizenName` on the `health_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `contact` on the `health_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `patientBirthDate` on the `health_transport_requests` table. All the data in the column will be lost.
  - You are about to drop the column `patientCpf` on the `health_transport_requests` table. All the data in the column will be lost.
  - You are about to drop the column `patientName` on the `health_transport_requests` table. All the data in the column will be lost.
  - You are about to drop the column `patientPhone` on the `health_transport_requests` table. All the data in the column will be lost.
  - You are about to drop the column `patientCpf` on the `health_transports` table. All the data in the column will be lost.
  - You are about to drop the column `patientName` on the `health_transports` table. All the data in the column will be lost.
  - You are about to drop the column `patientPhone` on the `health_transports` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `addressComplement` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `addressNumber` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `cpf` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyContact` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyPhone` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `fatherName` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `maritalStatus` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `medications` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `motherName` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `neighborhood` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `occupation` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `patientBirthDate` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `patientCpf` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `patientEmail` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `patientName` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `patientPhone` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `rg` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `managerCpf` on the `school_management` table. All the data in the column will be lost.
  - You are about to drop the column `managerEmail` on the `school_management` table. All the data in the column will be lost.
  - You are about to drop the column `managerName` on the `school_management` table. All the data in the column will be lost.
  - You are about to drop the column `managerPhone` on the `school_management` table. All the data in the column will be lost.
  - You are about to drop the column `citizenCpf` on the `social_appointments` table. All the data in the column will be lost.
  - You are about to drop the column `citizenEmail` on the `social_appointments` table. All the data in the column will be lost.
  - You are about to drop the column `citizenName` on the `social_appointments` table. All the data in the column will be lost.
  - You are about to drop the column `citizenPhone` on the `social_appointments` table. All the data in the column will be lost.
  - You are about to drop the column `socialWorker` on the `social_appointments` table. All the data in the column will be lost.
  - You are about to drop the column `citizenCpf` on the `social_assistance_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `citizenEmail` on the `social_assistance_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `citizenName` on the `social_assistance_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `citizenPhone` on the `social_assistance_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `contact` on the `social_assistance_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `social_equipments` table. All the data in the column will be lost.
  - Made the column `citizenId` on table `community_health_agents` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `citizenId` to the `health_attendances` table without a default value. This is not possible if the table is not empty.
  - Made the column `citizenId` on table `health_transport_requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `citizenId` on table `health_transports` required. This step will fail if there are existing NULL values in that column.
  - Made the column `citizenId` on table `patients` required. This step will fail if there are existing NULL values in that column.
  - Made the column `citizenId` on table `social_appointments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `citizenId` on table `social_assistance_attendances` required. This step will fail if there are existing NULL values in that column.
  - Made the column `citizenId` on table `social_equipments` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_community_health_agents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "hireDate" DATETIME NOT NULL,
    "contractType" TEXT,
    "healthUnitId" TEXT,
    "healthUnitName" TEXT,
    "assignedArea" TEXT NOT NULL,
    "neighborhoods" JSONB,
    "microarea" TEXT,
    "estimatedFamilies" INTEGER NOT NULL DEFAULT 0,
    "estimatedPeople" INTEGER NOT NULL DEFAULT 0,
    "education" TEXT,
    "hasCourseCompletion" BOOLEAN NOT NULL DEFAULT false,
    "courseCompletionDate" DATETIME,
    "additionalTraining" TEXT,
    "workSchedule" JSONB,
    "weeklyHours" INTEGER NOT NULL DEFAULT 40,
    "workDays" TEXT,
    "hasTablet" BOOLEAN NOT NULL DEFAULT false,
    "hasUniform" BOOLEAN NOT NULL DEFAULT false,
    "hasBag" BOOLEAN NOT NULL DEFAULT false,
    "hasIdentificationCard" BOOLEAN NOT NULL DEFAULT false,
    "supervisorId" TEXT,
    "supervisorName" TEXT,
    "familiesServed" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    "terminationDate" DATETIME,
    "observations" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'GESTAO_ACS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "community_health_agents_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "community_health_agents_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_community_health_agents" ("additionalTraining", "approvedAt", "assignedArea", "citizenId", "contractType", "courseCompletionDate", "createdAt", "education", "estimatedFamilies", "estimatedPeople", "familiesServed", "hasBag", "hasCourseCompletion", "hasIdentificationCard", "hasTablet", "hasUniform", "healthUnitId", "healthUnitName", "hireDate", "id", "isActive", "microarea", "moduleType", "neighborhoods", "observations", "protocolId", "registrationNumber", "status", "supervisorId", "supervisorName", "terminationDate", "updatedAt", "weeklyHours", "workDays", "workSchedule") SELECT "additionalTraining", "approvedAt", "assignedArea", "citizenId", "contractType", "courseCompletionDate", "createdAt", "education", "estimatedFamilies", "estimatedPeople", "familiesServed", "hasBag", "hasCourseCompletion", "hasIdentificationCard", "hasTablet", "hasUniform", "healthUnitId", "healthUnitName", "hireDate", "id", "isActive", "microarea", "moduleType", "neighborhoods", "observations", "protocolId", "registrationNumber", "status", "supervisorId", "supervisorName", "terminationDate", "updatedAt", "weeklyHours", "workDays", "workSchedule" FROM "community_health_agents";
DROP TABLE "community_health_agents";
ALTER TABLE "new_community_health_agents" RENAME TO "community_health_agents";
CREATE INDEX "community_health_agents_moduleType_idx" ON "community_health_agents"("moduleType");
CREATE INDEX "community_health_agents_protocolId_idx" ON "community_health_agents"("protocolId");
CREATE INDEX "community_health_agents_citizenId_idx" ON "community_health_agents"("citizenId");
CREATE TABLE "new_education_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "attendanceType" TEXT,
    "category" TEXT,
    "serviceType" TEXT NOT NULL,
    "studentName" TEXT,
    "studentCpf" TEXT,
    "studentBirthDate" DATETIME,
    "studentRelationship" TEXT,
    "schoolId" TEXT,
    "schoolName" TEXT,
    "grade" TEXT,
    "shift" TEXT,
    "subject" TEXT,
    "description" TEXT NOT NULL,
    "requestedServices" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "urgency" TEXT,
    "hasDocuments" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "scheduledDate" DATETIME,
    "completedDate" DATETIME,
    "startedAt" DATETIME,
    "observations" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'ATENDIMENTOS_EDUCACAO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "education_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "education_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_education_attendances" ("assignedToId", "assignedToName", "attachments", "attendanceType", "category", "citizenId", "completedDate", "createdAt", "description", "grade", "hasDocuments", "id", "isActive", "moduleType", "observations", "priority", "protocolId", "requestedServices", "scheduledDate", "schoolId", "schoolName", "serviceType", "shift", "startedAt", "status", "studentBirthDate", "studentCpf", "studentName", "studentRelationship", "subject", "updatedAt", "urgency") SELECT "assignedToId", "assignedToName", "attachments", "attendanceType", "category", "citizenId", "completedDate", "createdAt", "description", "grade", "hasDocuments", "id", "isActive", "moduleType", "observations", "priority", "protocolId", "requestedServices", "scheduledDate", "schoolId", "schoolName", "serviceType", "shift", "startedAt", "status", "studentBirthDate", "studentCpf", "studentName", "studentRelationship", "subject", "updatedAt", "urgency" FROM "education_attendances";
DROP TABLE "education_attendances";
ALTER TABLE "new_education_attendances" RENAME TO "education_attendances";
CREATE INDEX "education_attendances_moduleType_idx" ON "education_attendances"("moduleType");
CREATE INDEX "education_attendances_protocolId_idx" ON "education_attendances"("protocolId");
CREATE INDEX "education_attendances_citizenId_idx" ON "education_attendances"("citizenId");
CREATE TABLE "new_health_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "observations" TEXT,
    "responsible" TEXT,
    "attachments" JSONB,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "medicalUnit" TEXT,
    "appointmentDate" DATETIME,
    "symptoms" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "moduleType" TEXT NOT NULL DEFAULT 'ATENDIMENTOS_SAUDE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "health_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_health_attendances" ("appointmentDate", "attachments", "createdAt", "description", "id", "medicalUnit", "moduleType", "observations", "priority", "protocol", "protocolId", "responsible", "status", "symptoms", "type", "updatedAt", "urgency") SELECT "appointmentDate", "attachments", "createdAt", "description", "id", "medicalUnit", "moduleType", "observations", "priority", "protocol", "protocolId", "responsible", "status", "symptoms", "type", "updatedAt", "urgency" FROM "health_attendances";
DROP TABLE "health_attendances";
ALTER TABLE "new_health_attendances" RENAME TO "health_attendances";
CREATE UNIQUE INDEX "health_attendances_protocol_key" ON "health_attendances"("protocol");
CREATE INDEX "health_attendances_citizenId_idx" ON "health_attendances"("citizenId");
CREATE INDEX "health_attendances_moduleType_idx" ON "health_attendances"("moduleType");
CREATE INDEX "health_attendances_protocolId_idx" ON "health_attendances"("protocolId");
CREATE INDEX "health_attendances_status_idx" ON "health_attendances"("status");
CREATE INDEX "health_attendances_createdAt_idx" ON "health_attendances"("createdAt");
CREATE INDEX "health_attendances_moduleType_status_idx" ON "health_attendances"("moduleType", "status");
CREATE TABLE "new_health_transport_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "requestType" TEXT,
    "specialty" TEXT,
    "referringDoctor" TEXT,
    "referringUnit" TEXT,
    "destinationCity" TEXT,
    "destinationState" TEXT,
    "destinationHospital" TEXT,
    "diagnosis" TEXT,
    "medicalJustification" TEXT,
    "urgencyLevel" TEXT NOT NULL DEFAULT 'NORMAL',
    "hasMedicalReport" BOOLEAN NOT NULL DEFAULT false,
    "hasExams" BOOLEAN NOT NULL DEFAULT false,
    "hasReferral" BOOLEAN NOT NULL DEFAULT true,
    "needsCompanion" BOOLEAN NOT NULL DEFAULT false,
    "companionName" TEXT,
    "companionCpf" TEXT,
    "companionRelationship" TEXT,
    "expectedDate" DATETIME,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "transportType" TEXT NOT NULL,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDate" DATETIME,
    "reason" TEXT NOT NULL,
    "responsibleDriver" TEXT,
    "vehicleId" TEXT,
    "departureTime" DATETIME,
    "arrivalTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    "observations" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'ENCAMINHAMENTOS_TFD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_transport_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "health_transport_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_health_transport_requests" ("approvedAt", "arrivalTime", "citizenId", "companionCpf", "companionName", "companionRelationship", "createdAt", "departureTime", "destination", "destinationCity", "destinationHospital", "destinationState", "diagnosis", "expectedDate", "hasExams", "hasMedicalReport", "hasReferral", "id", "isActive", "medicalJustification", "moduleType", "needsCompanion", "observations", "origin", "protocolId", "reason", "referringDoctor", "referringUnit", "requestDate", "requestType", "responsibleDriver", "scheduledDate", "specialty", "status", "transportType", "updatedAt", "urgencyLevel", "vehicleId") SELECT "approvedAt", "arrivalTime", "citizenId", "companionCpf", "companionName", "companionRelationship", "createdAt", "departureTime", "destination", "destinationCity", "destinationHospital", "destinationState", "diagnosis", "expectedDate", "hasExams", "hasMedicalReport", "hasReferral", "id", "isActive", "medicalJustification", "moduleType", "needsCompanion", "observations", "origin", "protocolId", "reason", "referringDoctor", "referringUnit", "requestDate", "requestType", "responsibleDriver", "scheduledDate", "specialty", "status", "transportType", "updatedAt", "urgencyLevel", "vehicleId" FROM "health_transport_requests";
DROP TABLE "health_transport_requests";
ALTER TABLE "new_health_transport_requests" RENAME TO "health_transport_requests";
CREATE INDEX "health_transport_requests_moduleType_idx" ON "health_transport_requests"("moduleType");
CREATE INDEX "health_transport_requests_protocolId_idx" ON "health_transport_requests"("protocolId");
CREATE INDEX "health_transport_requests_citizenId_idx" ON "health_transport_requests"("citizenId");
CREATE TABLE "new_health_transports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "transportType" TEXT NOT NULL,
    "transportDate" DATETIME,
    "transportTime" TEXT,
    "scheduledDate" DATETIME NOT NULL,
    "origin" TEXT NOT NULL,
    "originAddress" TEXT,
    "originNeighborhood" TEXT,
    "originReference" TEXT,
    "destination" TEXT NOT NULL,
    "destinationType" TEXT,
    "destinationAddress" TEXT,
    "destinationName" TEXT,
    "destinationCity" TEXT,
    "reason" TEXT,
    "urgencyLevel" TEXT NOT NULL,
    "medicalCondition" TEXT,
    "requiresOxygen" BOOLEAN NOT NULL DEFAULT false,
    "requiresStretcher" BOOLEAN NOT NULL DEFAULT false,
    "requiresWheelchair" BOOLEAN NOT NULL DEFAULT false,
    "hasCompanion" BOOLEAN NOT NULL DEFAULT false,
    "companionName" TEXT,
    "companionPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" DATETIME,
    "observations" TEXT,
    "specialInstructions" TEXT,
    "responsibleDriver" TEXT,
    "vehicleId" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'TRANSPORTE_PACIENTES',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_transports_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "health_transports_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_health_transports" ("citizenId", "companionName", "companionPhone", "confirmedAt", "createdAt", "destination", "destinationAddress", "destinationCity", "destinationName", "destinationType", "hasCompanion", "id", "isActive", "medicalCondition", "moduleType", "observations", "origin", "originAddress", "originNeighborhood", "originReference", "protocolId", "reason", "requiresOxygen", "requiresStretcher", "requiresWheelchair", "responsibleDriver", "scheduledDate", "specialInstructions", "status", "transportDate", "transportTime", "transportType", "updatedAt", "urgencyLevel", "vehicleId") SELECT "citizenId", "companionName", "companionPhone", "confirmedAt", "createdAt", "destination", "destinationAddress", "destinationCity", "destinationName", "destinationType", "hasCompanion", "id", "isActive", "medicalCondition", "moduleType", "observations", "origin", "originAddress", "originNeighborhood", "originReference", "protocolId", "reason", "requiresOxygen", "requiresStretcher", "requiresWheelchair", "responsibleDriver", "scheduledDate", "specialInstructions", "status", "transportDate", "transportTime", "transportType", "updatedAt", "urgencyLevel", "vehicleId" FROM "health_transports";
DROP TABLE "health_transports";
ALTER TABLE "new_health_transports" RENAME TO "health_transports";
CREATE INDEX "health_transports_moduleType_idx" ON "health_transports"("moduleType");
CREATE INDEX "health_transports_protocolId_idx" ON "health_transports"("protocolId");
CREATE INDEX "health_transports_citizenId_idx" ON "health_transports"("citizenId");
CREATE TABLE "new_patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "bloodType" TEXT,
    "susCardNumber" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelationship" TEXT,
    "allergies" TEXT,
    "chronicDiseases" TEXT,
    "currentMedications" TEXT,
    "previousSurgeries" TEXT,
    "preferredHealthUnitId" TEXT,
    "isPregnant" BOOLEAN NOT NULL DEFAULT false,
    "isDiabetic" BOOLEAN NOT NULL DEFAULT false,
    "isHypertensive" BOOLEAN NOT NULL DEFAULT false,
    "hasHeartDisease" BOOLEAN NOT NULL DEFAULT false,
    "hasRespiratoryDisease" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    "observations" TEXT,
    "registeredBy" TEXT NOT NULL,
    "registrationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moduleType" TEXT NOT NULL DEFAULT 'CADASTRO_PACIENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "patients_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "patients_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_patients" ("allergies", "approvedAt", "bloodType", "chronicDiseases", "citizenId", "createdAt", "currentMedications", "emergencyContactName", "emergencyContactPhone", "emergencyContactRelationship", "hasHeartDisease", "hasRespiratoryDisease", "id", "isActive", "isDiabetic", "isHypertensive", "isPregnant", "moduleType", "observations", "preferredHealthUnitId", "previousSurgeries", "protocolId", "registeredBy", "registrationDate", "status", "susCardNumber", "updatedAt") SELECT "allergies", "approvedAt", "bloodType", "chronicDiseases", "citizenId", "createdAt", "currentMedications", "emergencyContactName", "emergencyContactPhone", "emergencyContactRelationship", "hasHeartDisease", "hasRespiratoryDisease", "id", "isActive", "isDiabetic", "isHypertensive", "isPregnant", "moduleType", "observations", "preferredHealthUnitId", "previousSurgeries", "protocolId", "registeredBy", "registrationDate", "status", "susCardNumber", "updatedAt" FROM "patients";
DROP TABLE "patients";
ALTER TABLE "new_patients" RENAME TO "patients";
CREATE INDEX "patients_moduleType_idx" ON "patients"("moduleType");
CREATE INDEX "patients_protocolId_idx" ON "patients"("protocolId");
CREATE INDEX "patients_citizenId_idx" ON "patients"("citizenId");
CREATE INDEX "patients_status_idx" ON "patients"("status");
CREATE INDEX "patients_createdAt_idx" ON "patients"("createdAt");
CREATE INDEX "patients_moduleType_status_idx" ON "patients"("moduleType", "status");
CREATE TABLE "new_school_management" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "requestType" TEXT,
    "category" TEXT,
    "managementType" TEXT NOT NULL,
    "schoolId" TEXT,
    "schoolName" TEXT NOT NULL,
    "schoolType" TEXT,
    "subject" TEXT,
    "description" TEXT NOT NULL,
    "managementArea" TEXT,
    "affectedPeople" INTEGER NOT NULL DEFAULT 0,
    "affectedClasses" INTEGER NOT NULL DEFAULT 0,
    "estimatedBudget" REAL NOT NULL DEFAULT 0,
    "proposedSolution" TEXT,
    "requiresEquipment" BOOLEAN NOT NULL DEFAULT false,
    "requiredEquipment" JSONB,
    "requiresStaff" BOOLEAN NOT NULL DEFAULT false,
    "requiredStaffType" TEXT,
    "requiresInfrastructure" BOOLEAN NOT NULL DEFAULT false,
    "infrastructureDetails" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "urgencyLevel" TEXT,
    "expectedImplementationDate" DATETIME,
    "justification" TEXT,
    "requiresSecretaryApproval" BOOLEAN NOT NULL DEFAULT false,
    "requiresBudgetApproval" BOOLEAN NOT NULL DEFAULT false,
    "requiresCouncilApproval" BOOLEAN NOT NULL DEFAULT false,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB,
    "documents" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "assignedTo" TEXT,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedDate" DATETIME,
    "observations" TEXT,
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_management_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "school_management_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_school_management" ("affectedClasses", "affectedPeople", "approvedAt", "assignedTo", "assignedToId", "assignedToName", "attachments", "category", "citizenId", "completedDate", "createdAt", "description", "documents", "estimatedBudget", "expectedImplementationDate", "hasAttachments", "id", "infrastructureDetails", "internalNotes", "isActive", "justification", "managementArea", "managementType", "observations", "priority", "proposedSolution", "protocolId", "requestDate", "requestType", "requiredEquipment", "requiredStaffType", "requiresBudgetApproval", "requiresCouncilApproval", "requiresEquipment", "requiresInfrastructure", "requiresSecretaryApproval", "requiresStaff", "schoolId", "schoolName", "schoolType", "status", "subject", "updatedAt", "urgencyLevel") SELECT "affectedClasses", "affectedPeople", "approvedAt", "assignedTo", "assignedToId", "assignedToName", "attachments", "category", "citizenId", "completedDate", "createdAt", "description", "documents", "estimatedBudget", "expectedImplementationDate", "hasAttachments", "id", "infrastructureDetails", "internalNotes", "isActive", "justification", "managementArea", "managementType", "observations", "priority", "proposedSolution", "protocolId", "requestDate", "requestType", "requiredEquipment", "requiredStaffType", "requiresBudgetApproval", "requiresCouncilApproval", "requiresEquipment", "requiresInfrastructure", "requiresSecretaryApproval", "requiresStaff", "schoolId", "schoolName", "schoolType", "status", "subject", "updatedAt", "urgencyLevel" FROM "school_management";
DROP TABLE "school_management";
ALTER TABLE "new_school_management" RENAME TO "school_management";
CREATE INDEX "school_management_citizenId_idx" ON "school_management"("citizenId");
CREATE TABLE "new_social_appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "appointmentType" TEXT NOT NULL,
    "serviceType" TEXT,
    "appointmentDate" DATETIME NOT NULL,
    "appointmentTime" TEXT,
    "estimatedDuration" INTEGER NOT NULL DEFAULT 60,
    "equipmentType" TEXT,
    "equipmentId" TEXT,
    "equipmentName" TEXT,
    "roomNumber" TEXT,
    "socialWorkerId" TEXT,
    "socialWorkerName" TEXT,
    "reason" TEXT,
    "purpose" TEXT NOT NULL,
    "description" TEXT,
    "referredBy" TEXT,
    "referralReason" TEXT,
    "priority" TEXT,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "urgencyJustification" TEXT,
    "isFirstTime" BOOLEAN NOT NULL DEFAULT false,
    "previousAttendances" INTEGER NOT NULL DEFAULT 0,
    "hasCadUnico" BOOLEAN NOT NULL DEFAULT false,
    "vulnerabilityLevel" TEXT,
    "requiredDocuments" JSONB,
    "hasAllDocuments" BOOLEAN NOT NULL DEFAULT false,
    "hasCompanion" BOOLEAN NOT NULL DEFAULT false,
    "companionName" TEXT,
    "companionRelationship" TEXT,
    "needsAccessibility" BOOLEAN NOT NULL DEFAULT false,
    "accessibilityNeeds" JSONB,
    "needsInterpreter" BOOLEAN NOT NULL DEFAULT false,
    "interpreterLanguage" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmationMethod" TEXT,
    "confirmedAt" DATETIME,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" DATETIME,
    "notes" TEXT,
    "result" TEXT,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" DATETIME,
    "observations" TEXT,
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "social_appointments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "social_appointments_socialWorkerId_fkey" FOREIGN KEY ("socialWorkerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "social_appointments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_social_appointments" ("accessibilityNeeds", "appointmentDate", "appointmentTime", "appointmentType", "cancelledAt", "citizenId", "companionName", "companionRelationship", "confirmationMethod", "confirmed", "confirmedAt", "createdAt", "description", "equipmentId", "equipmentName", "equipmentType", "estimatedDuration", "followUpDate", "followUpNeeded", "hasAllDocuments", "hasCadUnico", "hasCompanion", "id", "internalNotes", "interpreterLanguage", "isActive", "isFirstTime", "isUrgent", "needsAccessibility", "needsInterpreter", "notes", "observations", "previousAttendances", "priority", "protocolId", "purpose", "reason", "referralReason", "referredBy", "reminderDate", "reminderSent", "requiredDocuments", "result", "roomNumber", "serviceType", "socialWorkerId", "socialWorkerName", "status", "updatedAt", "urgencyJustification", "vulnerabilityLevel") SELECT "accessibilityNeeds", "appointmentDate", "appointmentTime", "appointmentType", "cancelledAt", "citizenId", "companionName", "companionRelationship", "confirmationMethod", "confirmed", "confirmedAt", "createdAt", "description", "equipmentId", "equipmentName", "equipmentType", "estimatedDuration", "followUpDate", "followUpNeeded", "hasAllDocuments", "hasCadUnico", "hasCompanion", "id", "internalNotes", "interpreterLanguage", "isActive", "isFirstTime", "isUrgent", "needsAccessibility", "needsInterpreter", "notes", "observations", "previousAttendances", "priority", "protocolId", "purpose", "reason", "referralReason", "referredBy", "reminderDate", "reminderSent", "requiredDocuments", "result", "roomNumber", "serviceType", "socialWorkerId", "socialWorkerName", "status", "updatedAt", "urgencyJustification", "vulnerabilityLevel" FROM "social_appointments";
DROP TABLE "social_appointments";
ALTER TABLE "new_social_appointments" RENAME TO "social_appointments";
CREATE TABLE "new_social_assistance_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "attendanceType" TEXT,
    "category" TEXT,
    "socialDemand" TEXT,
    "socialIssue" JSONB,
    "vulnerabilityLevel" TEXT,
    "vulnerability" TEXT,
    "familySize" INTEGER,
    "dependents" INTEGER NOT NULL DEFAULT 0,
    "minors" INTEGER NOT NULL DEFAULT 0,
    "elderly" INTEGER NOT NULL DEFAULT 0,
    "disabledMembers" INTEGER NOT NULL DEFAULT 0,
    "familyIncome" REAL,
    "monthlyIncome" REAL,
    "unemployed" BOOLEAN NOT NULL DEFAULT false,
    "informalWork" BOOLEAN NOT NULL DEFAULT false,
    "housingSituation" TEXT,
    "hasNIS" BOOLEAN NOT NULL DEFAULT false,
    "nisNumber" TEXT,
    "hasCadUnico" BOOLEAN NOT NULL DEFAULT false,
    "cadUnicoNumber" TEXT,
    "hasBolsaFamilia" BOOLEAN NOT NULL DEFAULT false,
    "otherBenefits" JSONB,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requestedServices" JSONB,
    "requestedBenefits" JSONB,
    "needsReferral" BOOLEAN NOT NULL DEFAULT false,
    "referralType" TEXT,
    "referralDestination" TEXT,
    "referredBy" TEXT,
    "referrals" JSONB,
    "crasId" TEXT,
    "crasName" TEXT,
    "creasId" TEXT,
    "creasName" TEXT,
    "socialWorker" TEXT,
    "socialWorkerId" TEXT,
    "socialWorkerName" TEXT,
    "assessment" JSONB,
    "interventionPlan" JSONB,
    "socialWorkerNotes" TEXT,
    "actionPlan" TEXT,
    "followUpPlan" JSONB,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" DATETIME,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "priority" TEXT,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "urgencyReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" DATETIME,
    "resolution" TEXT,
    "nextVisitDate" DATETIME,
    "satisfaction" INTEGER,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "social_assistance_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "social_assistance_attendances_socialWorkerId_fkey" FOREIGN KEY ("socialWorkerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "social_assistance_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_social_assistance_attendances" ("actionPlan", "assessment", "attendanceType", "cadUnicoNumber", "category", "citizenId", "crasId", "crasName", "creasId", "creasName", "createdAt", "dependents", "description", "disabledMembers", "elderly", "familyIncome", "familySize", "followUpDate", "followUpNeeded", "followUpPlan", "hasBolsaFamilia", "hasCadUnico", "hasNIS", "housingSituation", "id", "informalWork", "interventionPlan", "isActive", "isUrgent", "minors", "monthlyIncome", "needsReferral", "nextVisitDate", "nisNumber", "observations", "otherBenefits", "priority", "protocol", "protocolId", "referralDestination", "referralType", "referrals", "referredBy", "requestedBenefits", "requestedServices", "resolution", "satisfaction", "serviceType", "socialDemand", "socialIssue", "socialWorker", "socialWorkerId", "socialWorkerName", "socialWorkerNotes", "startedAt", "status", "subject", "unemployed", "updatedAt", "urgency", "urgencyReason", "vulnerability", "vulnerabilityLevel") SELECT "actionPlan", "assessment", "attendanceType", "cadUnicoNumber", "category", "citizenId", "crasId", "crasName", "creasId", "creasName", "createdAt", "dependents", "description", "disabledMembers", "elderly", "familyIncome", "familySize", "followUpDate", "followUpNeeded", "followUpPlan", "hasBolsaFamilia", "hasCadUnico", "hasNIS", "housingSituation", "id", "informalWork", "interventionPlan", "isActive", "isUrgent", "minors", "monthlyIncome", "needsReferral", "nextVisitDate", "nisNumber", "observations", "otherBenefits", "priority", "protocol", "protocolId", "referralDestination", "referralType", "referrals", "referredBy", "requestedBenefits", "requestedServices", "resolution", "satisfaction", "serviceType", "socialDemand", "socialIssue", "socialWorker", "socialWorkerId", "socialWorkerName", "socialWorkerNotes", "startedAt", "status", "subject", "unemployed", "updatedAt", "urgency", "urgencyReason", "vulnerability", "vulnerabilityLevel" FROM "social_assistance_attendances";
DROP TABLE "social_assistance_attendances";
ALTER TABLE "new_social_assistance_attendances" RENAME TO "social_assistance_attendances";
CREATE UNIQUE INDEX "social_assistance_attendances_protocol_key" ON "social_assistance_attendances"("protocol");
CREATE INDEX "social_assistance_attendances_protocolId_idx" ON "social_assistance_attendances"("protocolId");
CREATE INDEX "social_assistance_attendances_status_idx" ON "social_assistance_attendances"("status");
CREATE INDEX "social_assistance_attendances_createdAt_idx" ON "social_assistance_attendances"("createdAt");
CREATE TABLE "new_social_equipments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "equipmentType" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "code" TEXT,
    "cnpj" TEXT,
    "address" TEXT NOT NULL,
    "addressNumber" TEXT,
    "addressComplement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "coordinates" JSONB,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "operatingHours" JSONB,
    "operatingDays" TEXT,
    "schedule" JSONB,
    "capacity" INTEGER,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "maxMonthlyAttendances" INTEGER,
    "coverageArea" JSONB,
    "coveragePopulation" INTEGER,
    "referenceFamilies" INTEGER,
    "coordinator" TEXT,
    "coordinatorId" TEXT,
    "coordinatorName" TEXT,
    "coordinatorPhone" TEXT,
    "coordinatorEmail" TEXT,
    "socialWorkers" INTEGER NOT NULL DEFAULT 0,
    "psychologists" INTEGER NOT NULL DEFAULT 0,
    "educators" INTEGER NOT NULL DEFAULT 0,
    "supportStaff" INTEGER NOT NULL DEFAULT 0,
    "totalStaff" INTEGER NOT NULL DEFAULT 0,
    "services" JSONB,
    "offeredServices" JSONB,
    "programs" JSONB,
    "groups" JSONB,
    "hasAccessibility" BOOLEAN NOT NULL DEFAULT false,
    "accessibilityFeatures" JSONB,
    "rooms" INTEGER NOT NULL DEFAULT 0,
    "computerLab" BOOLEAN NOT NULL DEFAULT false,
    "kitchen" BOOLEAN NOT NULL DEFAULT false,
    "playground" BOOLEAN NOT NULL DEFAULT false,
    "sportsArea" BOOLEAN NOT NULL DEFAULT false,
    "hasVehicle" BOOLEAN NOT NULL DEFAULT false,
    "vehicleType" TEXT,
    "vehiclePlate" TEXT,
    "municipalDecree" TEXT,
    "creationDate" DATETIME,
    "lastInspectionDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "operationStatus" TEXT,
    "approvedAt" DATETIME,
    "observations" TEXT,
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "social_equipments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "social_equipments_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "social_equipments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_social_equipments" ("accessibilityFeatures", "address", "addressComplement", "addressNumber", "approvedAt", "capacity", "citizenId", "city", "cnpj", "code", "computerLab", "coordinates", "coordinator", "coordinatorEmail", "coordinatorId", "coordinatorName", "coordinatorPhone", "coverageArea", "coveragePopulation", "createdAt", "creationDate", "currentOccupancy", "educators", "email", "equipmentName", "equipmentType", "groups", "hasAccessibility", "hasVehicle", "id", "internalNotes", "isActive", "kitchen", "lastInspectionDate", "maxMonthlyAttendances", "municipalDecree", "neighborhood", "observations", "offeredServices", "operatingDays", "operatingHours", "operationStatus", "phone", "playground", "programs", "protocolId", "psychologists", "referenceFamilies", "rooms", "schedule", "services", "socialWorkers", "sportsArea", "state", "status", "supportStaff", "totalStaff", "updatedAt", "vehiclePlate", "vehicleType", "website", "zipCode") SELECT "accessibilityFeatures", "address", "addressComplement", "addressNumber", "approvedAt", "capacity", "citizenId", "city", "cnpj", "code", "computerLab", "coordinates", "coordinator", "coordinatorEmail", "coordinatorId", "coordinatorName", "coordinatorPhone", "coverageArea", "coveragePopulation", "createdAt", "creationDate", "currentOccupancy", "educators", "email", "equipmentName", "equipmentType", "groups", "hasAccessibility", "hasVehicle", "id", "internalNotes", "isActive", "kitchen", "lastInspectionDate", "maxMonthlyAttendances", "municipalDecree", "neighborhood", "observations", "offeredServices", "operatingDays", "operatingHours", "operationStatus", "phone", "playground", "programs", "protocolId", "psychologists", "referenceFamilies", "rooms", "schedule", "services", "socialWorkers", "sportsArea", "state", "status", "supportStaff", "totalStaff", "updatedAt", "vehiclePlate", "vehicleType", "website", "zipCode" FROM "social_equipments";
DROP TABLE "social_equipments";
ALTER TABLE "new_social_equipments" RENAME TO "social_equipments";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
