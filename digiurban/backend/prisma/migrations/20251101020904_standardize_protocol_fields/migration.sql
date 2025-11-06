/*
  Warnings:

  - You are about to drop the column `protocol` on the `agriculture_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `protocol` on the `technical_assistances` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_agriculture_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "producerName" TEXT NOT NULL,
    "producerCpf" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "propertyName" TEXT,
    "serviceType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "location" TEXT,
    "propertySize" REAL,
    "crops" JSONB,
    "livestock" JSONB,
    "preferredVisitDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "technician" TEXT,
    "scheduledDate" DATETIME,
    "visitDate" DATETIME,
    "findings" TEXT,
    "recommendations" TEXT,
    "followUpDate" DATETIME,
    "resolution" TEXT,
    "satisfaction" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agriculture_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agriculture_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_agriculture_attendances" ("category", "contact", "createdAt", "crops", "description", "findings", "followUpDate", "id", "livestock", "location", "preferredVisitDate", "producerCpf", "producerName", "propertyName", "propertySize", "recommendations", "resolution", "satisfaction", "scheduledDate", "serviceType", "status", "subject", "technician", "tenantId", "updatedAt", "urgency", "visitDate") SELECT "category", "contact", "createdAt", "crops", "description", "findings", "followUpDate", "id", "livestock", "location", "preferredVisitDate", "producerCpf", "producerName", "propertyName", "propertySize", "recommendations", "resolution", "satisfaction", "scheduledDate", "serviceType", "status", "subject", "technician", "tenantId", "updatedAt", "urgency", "visitDate" FROM "agriculture_attendances";
DROP TABLE "agriculture_attendances";
ALTER TABLE "new_agriculture_attendances" RENAME TO "agriculture_attendances";
CREATE UNIQUE INDEX "agriculture_attendances_protocolId_key" ON "agriculture_attendances"("protocolId");
CREATE TABLE "new_attendance_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "schoolId" TEXT,
    "classId" TEXT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "presentDays" INTEGER NOT NULL,
    "absentDays" INTEGER NOT NULL,
    "percentage" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "observations" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'CONSULTA_FREQUENCIA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "attendance_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "attendance_records_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_attendance_records" ("absentDays", "classId", "createdAt", "id", "month", "observations", "percentage", "presentDays", "protocolId", "schoolId", "status", "studentId", "studentName", "tenantId", "totalDays", "updatedAt", "year") SELECT "absentDays", "classId", "createdAt", "id", "month", "observations", "percentage", "presentDays", "protocolId", "schoolId", "status", "studentId", "studentName", "tenantId", "totalDays", "updatedAt", "year" FROM "attendance_records";
DROP TABLE "attendance_records";
ALTER TABLE "new_attendance_records" RENAME TO "attendance_records";
CREATE INDEX "attendance_records_tenantId_moduleType_idx" ON "attendance_records"("tenantId", "moduleType");
CREATE INDEX "attendance_records_protocolId_idx" ON "attendance_records"("protocolId");
CREATE TABLE "new_community_health_agents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "fullName" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "assignedArea" TEXT NOT NULL,
    "registrationNum" TEXT,
    "hireDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "healthUnit" TEXT,
    "supervisor" TEXT,
    "familiesServed" INTEGER NOT NULL DEFAULT 0,
    "workSchedule" JSONB,
    "observations" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'GESTAO_ACS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "community_health_agents_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "community_health_agents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_community_health_agents" ("address", "assignedArea", "cpf", "createdAt", "email", "familiesServed", "fullName", "healthUnit", "hireDate", "id", "observations", "phone", "protocolId", "registrationNum", "status", "supervisor", "tenantId", "updatedAt", "workSchedule") SELECT "address", "assignedArea", "cpf", "createdAt", "email", "familiesServed", "fullName", "healthUnit", "hireDate", "id", "observations", "phone", "protocolId", "registrationNum", "status", "supervisor", "tenantId", "updatedAt", "workSchedule" FROM "community_health_agents";
DROP TABLE "community_health_agents";
ALTER TABLE "new_community_health_agents" RENAME TO "community_health_agents";
CREATE INDEX "community_health_agents_tenantId_moduleType_idx" ON "community_health_agents"("tenantId", "moduleType");
CREATE INDEX "community_health_agents_protocolId_idx" ON "community_health_agents"("protocolId");
CREATE UNIQUE INDEX "community_health_agents_tenantId_cpf_key" ON "community_health_agents"("tenantId", "cpf");
CREATE TABLE "new_education_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT NOT NULL,
    "citizenPhone" TEXT,
    "citizenEmail" TEXT,
    "serviceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "scheduledDate" DATETIME,
    "completedDate" DATETIME,
    "observations" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'ATENDIMENTOS_EDUCACAO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "education_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "education_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_education_attendances" ("citizenCpf", "citizenEmail", "citizenName", "citizenPhone", "completedDate", "createdAt", "description", "id", "observations", "priority", "protocolId", "scheduledDate", "serviceType", "status", "tenantId", "updatedAt") SELECT "citizenCpf", "citizenEmail", "citizenName", "citizenPhone", "completedDate", "createdAt", "description", "id", "observations", "priority", "protocolId", "scheduledDate", "serviceType", "status", "tenantId", "updatedAt" FROM "education_attendances";
DROP TABLE "education_attendances";
ALTER TABLE "new_education_attendances" RENAME TO "education_attendances";
CREATE INDEX "education_attendances_tenantId_moduleType_idx" ON "education_attendances"("tenantId", "moduleType");
CREATE INDEX "education_attendances_protocolId_idx" ON "education_attendances"("protocolId");
CREATE TABLE "new_health_appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "patientName" TEXT NOT NULL,
    "patientCpf" TEXT NOT NULL,
    "patientBirthDate" DATETIME,
    "patientPhone" TEXT,
    "appointmentDate" DATETIME NOT NULL,
    "appointmentTime" TEXT NOT NULL,
    "doctorId" TEXT,
    "speciality" TEXT NOT NULL DEFAULT 'GENERAL',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "symptoms" TEXT,
    "observations" TEXT,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "followUpDate" DATETIME,
    "moduleType" TEXT NOT NULL DEFAULT 'AGENDAMENTOS_MEDICOS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_appointments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "health_appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "health_doctors" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "health_appointments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_health_appointments" ("appointmentDate", "appointmentTime", "createdAt", "diagnosis", "doctorId", "followUpDate", "id", "observations", "patientBirthDate", "patientCpf", "patientName", "patientPhone", "priority", "protocolId", "speciality", "status", "symptoms", "tenantId", "treatment", "updatedAt") SELECT "appointmentDate", "appointmentTime", "createdAt", "diagnosis", "doctorId", "followUpDate", "id", "observations", "patientBirthDate", "patientCpf", "patientName", "patientPhone", "priority", "protocolId", "speciality", "status", "symptoms", "tenantId", "treatment", "updatedAt" FROM "health_appointments";
DROP TABLE "health_appointments";
ALTER TABLE "new_health_appointments" RENAME TO "health_appointments";
CREATE INDEX "health_appointments_tenantId_moduleType_idx" ON "health_appointments"("tenantId", "moduleType");
CREATE INDEX "health_appointments_protocolId_idx" ON "health_appointments"("protocolId");
CREATE TABLE "new_health_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenCPF" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
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
    CONSTRAINT "health_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "health_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_health_attendances" ("appointmentDate", "attachments", "citizenCPF", "citizenName", "contact", "createdAt", "description", "id", "medicalUnit", "observations", "priority", "protocol", "protocolId", "responsible", "status", "symptoms", "tenantId", "type", "updatedAt", "urgency") SELECT "appointmentDate", "attachments", "citizenCPF", "citizenName", "contact", "createdAt", "description", "id", "medicalUnit", "observations", "priority", "protocol", "protocolId", "responsible", "status", "symptoms", "tenantId", "type", "updatedAt", "urgency" FROM "health_attendances";
DROP TABLE "health_attendances";
ALTER TABLE "new_health_attendances" RENAME TO "health_attendances";
CREATE UNIQUE INDEX "health_attendances_protocol_key" ON "health_attendances"("protocol");
CREATE INDEX "health_attendances_tenantId_moduleType_idx" ON "health_attendances"("tenantId", "moduleType");
CREATE INDEX "health_attendances_protocolId_idx" ON "health_attendances"("protocolId");
CREATE TABLE "new_health_campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "campaignType" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "goals" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "coordinatorName" TEXT NOT NULL,
    "budget" REAL,
    "results" JSONB,
    "moduleType" TEXT NOT NULL DEFAULT 'CAMPANHAS_SAUDE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_campaigns_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "health_campaigns_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_health_campaigns" ("budget", "campaignType", "coordinatorName", "createdAt", "description", "endDate", "goals", "id", "isActive", "name", "protocolId", "results", "startDate", "status", "targetAudience", "tenantId", "updatedAt") SELECT "budget", "campaignType", "coordinatorName", "createdAt", "description", "endDate", "goals", "id", "isActive", "name", "protocolId", "results", "startDate", "status", "targetAudience", "tenantId", "updatedAt" FROM "health_campaigns";
DROP TABLE "health_campaigns";
ALTER TABLE "new_health_campaigns" RENAME TO "health_campaigns";
CREATE INDEX "health_campaigns_tenantId_moduleType_idx" ON "health_campaigns"("tenantId", "moduleType");
CREATE INDEX "health_campaigns_protocolId_idx" ON "health_campaigns"("protocolId");
CREATE TABLE "new_health_exams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "patientName" TEXT NOT NULL,
    "patientCpf" TEXT NOT NULL,
    "patientPhone" TEXT,
    "examType" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDate" DATETIME,
    "resultDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "requestedBy" TEXT NOT NULL,
    "healthUnit" TEXT,
    "observations" TEXT,
    "result" TEXT,
    "attachments" JSONB,
    "moduleType" TEXT NOT NULL DEFAULT 'EXAMES',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_exams_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "health_exams_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_health_exams" ("attachments", "createdAt", "examName", "examType", "healthUnit", "id", "observations", "patientCpf", "patientName", "patientPhone", "priority", "protocolId", "requestDate", "requestedBy", "result", "resultDate", "scheduledDate", "status", "tenantId", "updatedAt") SELECT "attachments", "createdAt", "examName", "examType", "healthUnit", "id", "observations", "patientCpf", "patientName", "patientPhone", "priority", "protocolId", "requestDate", "requestedBy", "result", "resultDate", "scheduledDate", "status", "tenantId", "updatedAt" FROM "health_exams";
DROP TABLE "health_exams";
ALTER TABLE "new_health_exams" RENAME TO "health_exams";
CREATE INDEX "health_exams_tenantId_moduleType_idx" ON "health_exams"("tenantId", "moduleType");
CREATE INDEX "health_exams_protocolId_idx" ON "health_exams"("protocolId");
CREATE TABLE "new_health_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "coordinatorName" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "goals" JSONB,
    "participants" INTEGER NOT NULL DEFAULT 0,
    "budget" REAL,
    "observations" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'PROGRAMAS_SAUDE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_programs_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "health_programs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_health_programs" ("budget", "coordinatorName", "createdAt", "description", "endDate", "goals", "id", "name", "observations", "participants", "programType", "protocolId", "startDate", "status", "targetAudience", "tenantId", "updatedAt") SELECT "budget", "coordinatorName", "createdAt", "description", "endDate", "goals", "id", "name", "observations", "participants", "programType", "protocolId", "startDate", "status", "targetAudience", "tenantId", "updatedAt" FROM "health_programs";
DROP TABLE "health_programs";
ALTER TABLE "new_health_programs" RENAME TO "health_programs";
CREATE INDEX "health_programs_tenantId_moduleType_idx" ON "health_programs"("tenantId", "moduleType");
CREATE INDEX "health_programs_protocolId_idx" ON "health_programs"("protocolId");
CREATE TABLE "new_health_transport_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "patientName" TEXT NOT NULL,
    "patientCpf" TEXT NOT NULL,
    "patientPhone" TEXT,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "transportType" TEXT NOT NULL,
    "urgencyLevel" TEXT NOT NULL DEFAULT 'NORMAL',
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT NOT NULL,
    "observations" TEXT,
    "responsibleDriver" TEXT,
    "vehicleId" TEXT,
    "departureTime" DATETIME,
    "arrivalTime" DATETIME,
    "moduleType" TEXT NOT NULL DEFAULT 'TRANSPORTE_PACIENTES',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_transport_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "health_transport_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_health_transport_requests" ("arrivalTime", "createdAt", "departureTime", "destination", "id", "observations", "origin", "patientCpf", "patientName", "patientPhone", "protocolId", "reason", "requestDate", "responsibleDriver", "scheduledDate", "status", "tenantId", "transportType", "updatedAt", "urgencyLevel", "vehicleId") SELECT "arrivalTime", "createdAt", "departureTime", "destination", "id", "observations", "origin", "patientCpf", "patientName", "patientPhone", "protocolId", "reason", "requestDate", "responsibleDriver", "scheduledDate", "status", "tenantId", "transportType", "updatedAt", "urgencyLevel", "vehicleId" FROM "health_transport_requests";
DROP TABLE "health_transport_requests";
ALTER TABLE "new_health_transport_requests" RENAME TO "health_transport_requests";
CREATE INDEX "health_transport_requests_tenantId_moduleType_idx" ON "health_transport_requests"("tenantId", "moduleType");
CREATE INDEX "health_transport_requests_protocolId_idx" ON "health_transport_requests"("protocolId");
CREATE TABLE "new_health_transports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "patientName" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "transportType" TEXT NOT NULL,
    "urgencyLevel" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "observations" TEXT,
    "responsibleDriver" TEXT,
    "vehicleId" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'ENCAMINHAMENTOS_TFD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_transports_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "health_transports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_health_transports" ("createdAt", "destination", "id", "observations", "origin", "patientName", "protocolId", "responsibleDriver", "scheduledDate", "status", "tenantId", "transportType", "updatedAt", "urgencyLevel", "vehicleId") SELECT "createdAt", "destination", "id", "observations", "origin", "patientName", "protocolId", "responsibleDriver", "scheduledDate", "status", "tenantId", "transportType", "updatedAt", "urgencyLevel", "vehicleId" FROM "health_transports";
DROP TABLE "health_transports";
ALTER TABLE "new_health_transports" RENAME TO "health_transports";
CREATE INDEX "health_transports_tenantId_moduleType_idx" ON "health_transports"("tenantId", "moduleType");
CREATE INDEX "health_transports_protocolId_idx" ON "health_transports"("protocolId");
CREATE TABLE "new_medication_dispenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "patientName" TEXT NOT NULL,
    "patientCpf" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL DEFAULT '1x ao dia',
    "quantity" INTEGER NOT NULL,
    "dispenseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prescriptionId" TEXT,
    "pharmacistName" TEXT NOT NULL,
    "dispensedBy" TEXT NOT NULL,
    "unitId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DISPENSED',
    "observations" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'CONTROLE_MEDICAMENTOS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "medication_dispenses_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "medication_dispenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_medication_dispenses" ("createdAt", "dispenseDate", "dispensedBy", "dosage", "id", "medicationName", "observations", "patientCpf", "patientName", "pharmacistName", "prescriptionId", "protocolId", "quantity", "status", "tenantId", "unitId", "updatedAt") SELECT "createdAt", "dispenseDate", "dispensedBy", "dosage", "id", "medicationName", "observations", "patientCpf", "patientName", "pharmacistName", "prescriptionId", "protocolId", "quantity", "status", "tenantId", "unitId", "updatedAt" FROM "medication_dispenses";
DROP TABLE "medication_dispenses";
ALTER TABLE "new_medication_dispenses" RENAME TO "medication_dispenses";
CREATE INDEX "medication_dispenses_tenantId_moduleType_idx" ON "medication_dispenses"("tenantId", "moduleType");
CREATE INDEX "medication_dispenses_protocolId_idx" ON "medication_dispenses"("protocolId");
CREATE TABLE "new_patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "fullName" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "birthDate" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodType" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "susCardNumber" TEXT,
    "allergies" TEXT,
    "chronicDiseases" TEXT,
    "medications" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "observations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "registeredBy" TEXT NOT NULL,
    "registrationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moduleType" TEXT NOT NULL DEFAULT 'CADASTRO_PACIENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "patients_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "patients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_patients" ("address", "allergies", "birthDate", "bloodType", "chronicDiseases", "city", "cpf", "createdAt", "email", "emergencyContact", "emergencyPhone", "fullName", "gender", "id", "medications", "observations", "phone", "protocolId", "registeredBy", "registrationDate", "rg", "state", "status", "susCardNumber", "tenantId", "updatedAt", "zipCode") SELECT "address", "allergies", "birthDate", "bloodType", "chronicDiseases", "city", "cpf", "createdAt", "email", "emergencyContact", "emergencyPhone", "fullName", "gender", "id", "medications", "observations", "phone", "protocolId", "registeredBy", "registrationDate", "rg", "state", "status", "susCardNumber", "tenantId", "updatedAt", "zipCode" FROM "patients";
DROP TABLE "patients";
ALTER TABLE "new_patients" RENAME TO "patients";
CREATE INDEX "patients_tenantId_moduleType_idx" ON "patients"("tenantId", "moduleType");
CREATE INDEX "patients_protocolId_idx" ON "patients"("protocolId");
CREATE UNIQUE INDEX "patients_tenantId_cpf_key" ON "patients"("tenantId", "cpf");
CREATE TABLE "new_school_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "observations" TEXT,
    "fileUrl" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'SOLICITACAO_DOCUMENTO_ESCOLAR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "school_documents_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_school_documents" ("createdAt", "documentType", "fileUrl", "id", "issueDate", "observations", "protocolId", "status", "studentId", "studentName", "tenantId", "updatedAt", "validUntil") SELECT "createdAt", "documentType", "fileUrl", "id", "issueDate", "observations", "protocolId", "status", "studentId", "studentName", "tenantId", "updatedAt", "validUntil" FROM "school_documents";
DROP TABLE "school_documents";
ALTER TABLE "new_school_documents" RENAME TO "school_documents";
CREATE INDEX "school_documents_tenantId_moduleType_idx" ON "school_documents"("tenantId", "moduleType");
CREATE INDEX "school_documents_protocolId_idx" ON "school_documents"("protocolId");
CREATE TABLE "new_school_meals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "schoolId" TEXT,
    "date" DATETIME NOT NULL,
    "shift" TEXT NOT NULL,
    "menu" JSONB NOT NULL,
    "studentsServed" INTEGER NOT NULL DEFAULT 0,
    "cost" REAL,
    "moduleType" TEXT NOT NULL DEFAULT 'GESTAO_MERENDA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_meals_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "school_meals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "school_meals_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_school_meals" ("cost", "createdAt", "date", "id", "menu", "protocolId", "schoolId", "shift", "studentsServed", "tenantId", "updatedAt") SELECT "cost", "createdAt", "date", "id", "menu", "protocolId", "schoolId", "shift", "studentsServed", "tenantId", "updatedAt" FROM "school_meals";
DROP TABLE "school_meals";
ALTER TABLE "new_school_meals" RENAME TO "school_meals";
CREATE INDEX "school_meals_tenantId_moduleType_idx" ON "school_meals"("tenantId", "moduleType");
CREATE INDEX "school_meals_protocolId_idx" ON "school_meals"("protocolId");
CREATE TABLE "new_school_transports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "route" TEXT NOT NULL,
    "driver" TEXT NOT NULL,
    "vehicle" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "shift" TEXT NOT NULL,
    "stops" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "moduleType" TEXT NOT NULL DEFAULT 'TRANSPORTE_ESCOLAR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_transports_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_school_transports" ("capacity", "createdAt", "driver", "id", "isActive", "protocolId", "route", "shift", "stops", "tenantId", "updatedAt", "vehicle") SELECT "capacity", "createdAt", "driver", "id", "isActive", "protocolId", "route", "shift", "stops", "tenantId", "updatedAt", "vehicle" FROM "school_transports";
DROP TABLE "school_transports";
ALTER TABLE "new_school_transports" RENAME TO "school_transports";
CREATE INDEX "school_transports_tenantId_moduleType_idx" ON "school_transports"("tenantId", "moduleType");
CREATE INDEX "school_transports_protocolId_idx" ON "school_transports"("protocolId");
CREATE TABLE "new_student_transfers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "currentSchool" TEXT NOT NULL,
    "targetSchool" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "transferReason" TEXT NOT NULL,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transferDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "documents" JSONB,
    "observations" TEXT,
    "approvedBy" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'TRANSFERENCIA_ESCOLAR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_transfers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_transfers_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_student_transfers" ("approvedBy", "createdAt", "currentSchool", "documents", "grade", "id", "observations", "protocolId", "requestDate", "status", "studentId", "studentName", "targetSchool", "tenantId", "transferDate", "transferReason", "updatedAt") SELECT "approvedBy", "createdAt", "currentSchool", "documents", "grade", "id", "observations", "protocolId", "requestDate", "status", "studentId", "studentName", "targetSchool", "tenantId", "transferDate", "transferReason", "updatedAt" FROM "student_transfers";
DROP TABLE "student_transfers";
ALTER TABLE "new_student_transfers" RENAME TO "student_transfers";
CREATE INDEX "student_transfers_tenantId_moduleType_idx" ON "student_transfers"("tenantId", "moduleType");
CREATE INDEX "student_transfers_protocolId_idx" ON "student_transfers"("protocolId");
CREATE TABLE "new_students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "parentName" TEXT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "parentEmail" TEXT,
    "address" TEXT NOT NULL,
    "medicalInfo" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "moduleType" TEXT NOT NULL DEFAULT 'MATRICULA_ALUNO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "schoolId" TEXT NOT NULL,
    CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "students_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "students_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_students" ("address", "birthDate", "cpf", "createdAt", "id", "isActive", "medicalInfo", "name", "parentEmail", "parentName", "parentPhone", "protocolId", "rg", "schoolId", "tenantId", "updatedAt") SELECT "address", "birthDate", "cpf", "createdAt", "id", "isActive", "medicalInfo", "name", "parentEmail", "parentName", "parentPhone", "protocolId", "rg", "schoolId", "tenantId", "updatedAt" FROM "students";
DROP TABLE "students";
ALTER TABLE "new_students" RENAME TO "students";
CREATE INDEX "students_tenantId_moduleType_idx" ON "students"("tenantId", "moduleType");
CREATE INDEX "students_protocolId_idx" ON "students"("protocolId");
CREATE UNIQUE INDEX "students_tenantId_cpf_key" ON "students"("tenantId", "cpf");
CREATE TABLE "new_technical_assistances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "producerName" TEXT NOT NULL,
    "producerCpf" TEXT NOT NULL,
    "producerPhone" TEXT,
    "propertyName" TEXT NOT NULL,
    "propertySize" REAL NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "assistanceType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "crop" TEXT,
    "livestock" TEXT,
    "technician" TEXT NOT NULL,
    "scheduledDate" DATETIME,
    "scheduledVisit" DATETIME,
    "requestDate" DATETIME,
    "visitDate" DATETIME NOT NULL,
    "visitReport" JSONB,
    "findings" TEXT,
    "recommendations" JSONB NOT NULL,
    "followUpPlan" JSONB,
    "materials" JSONB,
    "costs" REAL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "satisfaction" INTEGER,
    "photos" JSONB,
    "nextVisitDate" DATETIME,
    "observations" TEXT,
    "propertyLocation" TEXT,
    "technicianId" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "propertyArea" REAL,
    "cropTypes" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "completedBy" TEXT,
    "completedAt" DATETIME,
    "followUpDate" DATETIME,
    "followUpNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "technical_assistances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "technical_assistances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_technical_assistances" ("assistanceType", "completedAt", "completedBy", "coordinates", "costs", "createdAt", "crop", "cropTypes", "description", "findings", "followUpDate", "followUpNotes", "followUpPlan", "followUpRequired", "id", "livestock", "location", "materials", "nextVisitDate", "observations", "photos", "priority", "producerCpf", "producerName", "producerPhone", "propertyArea", "propertyLocation", "propertyName", "propertySize", "recommendations", "requestDate", "satisfaction", "scheduledDate", "scheduledVisit", "serviceId", "source", "status", "subject", "technician", "technicianId", "tenantId", "updatedAt", "visitDate", "visitReport") SELECT "assistanceType", "completedAt", "completedBy", "coordinates", "costs", "createdAt", "crop", "cropTypes", "description", "findings", "followUpDate", "followUpNotes", "followUpPlan", "followUpRequired", "id", "livestock", "location", "materials", "nextVisitDate", "observations", "photos", "priority", "producerCpf", "producerName", "producerPhone", "propertyArea", "propertyLocation", "propertyName", "propertySize", "recommendations", "requestDate", "satisfaction", "scheduledDate", "scheduledVisit", "serviceId", "source", "status", "subject", "technician", "technicianId", "tenantId", "updatedAt", "visitDate", "visitReport" FROM "technical_assistances";
DROP TABLE "technical_assistances";
ALTER TABLE "new_technical_assistances" RENAME TO "technical_assistances";
CREATE UNIQUE INDEX "technical_assistances_protocolId_key" ON "technical_assistances"("protocolId");
CREATE TABLE "new_vaccinations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "campaignId" TEXT,
    "patientId" TEXT NOT NULL,
    "vaccine" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "appliedAt" DATETIME NOT NULL,
    "appliedBy" TEXT NOT NULL,
    "lotNumber" TEXT,
    "nextDose" DATETIME,
    "moduleType" TEXT NOT NULL DEFAULT 'VACINACAO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vaccinations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vaccinations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "vaccinations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "vaccination_campaigns" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vaccinations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_vaccinations" ("appliedAt", "appliedBy", "campaignId", "createdAt", "dose", "id", "lotNumber", "nextDose", "patientId", "protocolId", "tenantId", "updatedAt", "vaccine") SELECT "appliedAt", "appliedBy", "campaignId", "createdAt", "dose", "id", "lotNumber", "nextDose", "patientId", "protocolId", "tenantId", "updatedAt", "vaccine" FROM "vaccinations";
DROP TABLE "vaccinations";
ALTER TABLE "new_vaccinations" RENAME TO "vaccinations";
CREATE INDEX "vaccinations_tenantId_patientId_idx" ON "vaccinations"("tenantId", "patientId");
CREATE INDEX "vaccinations_tenantId_appliedAt_idx" ON "vaccinations"("tenantId", "appliedAt");
CREATE INDEX "vaccinations_tenantId_vaccine_idx" ON "vaccinations"("tenantId", "vaccine");
CREATE INDEX "vaccinations_tenantId_moduleType_idx" ON "vaccinations"("tenantId", "moduleType");
CREATE INDEX "vaccinations_protocolId_idx" ON "vaccinations"("protocolId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
