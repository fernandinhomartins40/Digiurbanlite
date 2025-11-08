/*
  Warnings:

  - You are about to drop the `urban_planning_attendances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `applicantCpf` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `applicantCpfCnpj` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `applicantEmail` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `applicantName` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `applicantPhone` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `approvalDate` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `approvedBy` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `blockNumber` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `builtArea` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `construction` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `constructionType` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `documents` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `issuedDate` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `permitNumber` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `permitType` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `projectValue` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `property` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `requestedBy` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `requirements` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedBy` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `submissionDate` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `technicalAnalysis` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `validUntil` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `applicantCpfCnpj` on the `certificate_requests` table. All the data in the column will be lost.
  - You are about to drop the column `applicantEmail` on the `certificate_requests` table. All the data in the column will be lost.
  - You are about to drop the column `applicantName` on the `certificate_requests` table. All the data in the column will be lost.
  - You are about to drop the column `applicantPhone` on the `certificate_requests` table. All the data in the column will be lost.
  - You are about to drop the column `documents` on the `certificate_requests` table. All the data in the column will be lost.
  - You are about to drop the column `issuedDate` on the `certificate_requests` table. All the data in the column will be lost.
  - You are about to drop the column `neighborhood` on the `certificate_requests` table. All the data in the column will be lost.
  - You are about to drop the column `propertyNumber` on the `certificate_requests` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `certificate_requests` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedBy` on the `certificate_requests` table. All the data in the column will be lost.
  - You are about to drop the column `submissionDate` on the `certificate_requests` table. All the data in the column will be lost.
  - You are about to drop the column `applicantName` on the `project_approvals` table. All the data in the column will be lost.
  - You are about to drop the column `approvalDate` on the `project_approvals` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `project_approvals` table. All the data in the column will be lost.
  - You are about to drop the column `documents` on the `project_approvals` table. All the data in the column will be lost.
  - You are about to drop the column `projectName` on the `project_approvals` table. All the data in the column will be lost.
  - You are about to drop the column `submissionDate` on the `project_approvals` table. All the data in the column will be lost.
  - Added the required column `constructionArea` to the `building_permits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `engineerCrea` to the `building_permits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `engineerName` to the `building_permits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `engineerPhone` to the `building_permits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerCpf` to the `building_permits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerName` to the `building_permits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerPhone` to the `building_permits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectType` to the `building_permits` table without a default value. This is not possible if the table is not empty.
  - Made the column `floors` on table `building_permits` required. This step will fail if there are existing NULL values in that column.
  - Made the column `neighborhood` on table `building_permits` required. This step will fail if there are existing NULL values in that column.
  - Made the column `protocolId` on table `building_permits` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalArea` on table `building_permits` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `requesterCpf` to the `certificate_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requesterName` to the `certificate_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requesterPhone` to the `certificate_requests` table without a default value. This is not possible if the table is not empty.
  - Made the column `protocolId` on table `certificate_requests` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `architectCau` to the `project_approvals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `architectName` to the `project_approvals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `architectPhone` to the `project_approvals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `constructionArea` to the `project_approvals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `floors` to the `project_approvals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `neighborhood` to the `project_approvals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerCpf` to the `project_approvals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerName` to the `project_approvals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerPhone` to the `project_approvals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectCategory` to the `project_approvals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyAddress` to the `project_approvals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalArea` to the `project_approvals` table without a default value. This is not possible if the table is not empty.
  - Made the column `protocolId` on table `project_approvals` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "urban_planning_attendances_createdAt_idx";

-- DropIndex
DROP INDEX "urban_planning_attendances_status_idx";

-- DropIndex
DROP INDEX "urban_planning_attendances_protocolId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "urban_planning_attendances";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "urban_planning_attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT NOT NULL,
    "citizenPhone" TEXT NOT NULL,
    "citizenEmail" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attendanceType" TEXT NOT NULL,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "urban_planning_attendance_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "operating_licenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradeName" TEXT,
    "cnpj" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerCpf" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "number" TEXT,
    "neighborhood" TEXT NOT NULL,
    "complement" TEXT,
    "zipCode" TEXT,
    "activityType" TEXT NOT NULL,
    "cnae" TEXT,
    "businessArea" REAL,
    "employees" INTEGER,
    "operatingHours" TEXT,
    "hasFireSafety" BOOLEAN NOT NULL DEFAULT false,
    "hasSanitaryLicense" BOOLEAN NOT NULL DEFAULT false,
    "hasEnvironmentalLic" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ANALYSIS',
    "issuedAt" DATETIME,
    "expiresAt" DATETIME,
    "renewalDate" DATETIME,
    "observations" TEXT,
    "rejectionReason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "operating_licenses_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "illegal_construction_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "reporterName" TEXT,
    "reporterCpf" TEXT,
    "reporterPhone" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "address" TEXT NOT NULL,
    "number" TEXT,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "coordinates" TEXT,
    "violationType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hasPhotos" BOOLEAN NOT NULL DEFAULT false,
    "photoUrls" JSONB,
    "inspectionScheduled" DATETIME,
    "inspectedAt" DATETIME,
    "inspectorNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "resolution" TEXT,
    "resolvedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "illegal_construction_reports_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subdivision_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "subdivisionName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerCpf" TEXT,
    "ownerCnpj" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "location" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "totalArea" REAL NOT NULL,
    "totalLots" INTEGER NOT NULL,
    "publicAreaPercent" REAL,
    "greenAreaPercent" REAL,
    "hasInfrastructure" BOOLEAN NOT NULL DEFAULT false,
    "hasPavement" BOOLEAN NOT NULL DEFAULT false,
    "hasWater" BOOLEAN NOT NULL DEFAULT false,
    "hasSewage" BOOLEAN NOT NULL DEFAULT false,
    "hasElectricity" BOOLEAN NOT NULL DEFAULT false,
    "engineerName" TEXT NOT NULL,
    "engineerCrea" TEXT NOT NULL,
    "artNumber" TEXT,
    "approvalDate" DATETIME,
    "registrationNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ANALYSIS',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "subdivision_registrations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_works_attendance_phase3" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT NOT NULL,
    "citizenPhone" TEXT NOT NULL,
    "citizenEmail" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attendanceType" TEXT NOT NULL,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "location" TEXT,
    "neighborhood" TEXT,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "public_works_attendance_phase3_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "road_repair_requests_phase3" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "address" TEXT NOT NULL,
    "number" TEXT,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "coordinates" TEXT,
    "problemType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affectedArea" REAL,
    "hasPhotos" BOOLEAN NOT NULL DEFAULT false,
    "photoUrls" JSONB,
    "inspectionDate" DATETIME,
    "repairScheduled" DATETIME,
    "repairedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "road_repair_requests_phase3_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "technical_inspections_phase3" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT,
    "requesterCnpj" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "inspectionType" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "preferredDate" DATETIME,
    "urgency" BOOLEAN NOT NULL DEFAULT false,
    "inspectionDate" DATETIME,
    "inspectorName" TEXT,
    "findings" TEXT,
    "recommendations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "reportIssued" BOOLEAN NOT NULL DEFAULT false,
    "reportUrl" TEXT,
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "technical_inspections_phase3_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_work_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "workName" TEXT NOT NULL,
    "workType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "address" TEXT,
    "budget" REAL,
    "contractedCompany" TEXT,
    "cnpj" TEXT,
    "contractNumber" TEXT,
    "startDate" DATETIME,
    "expectedEndDate" DATETIME,
    "actualEndDate" DATETIME,
    "engineerName" TEXT,
    "engineerCrea" TEXT,
    "progress" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "public_work_registrations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "work_inspections_phase3" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "workName" TEXT NOT NULL,
    "workLocation" TEXT NOT NULL,
    "contractNumber" TEXT,
    "inspectionDate" DATETIME NOT NULL,
    "inspectorName" TEXT NOT NULL,
    "inspectorRole" TEXT,
    "progressPercent" REAL NOT NULL,
    "qualityRating" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    "nonCompliances" JSONB,
    "recommendations" TEXT,
    "hasPhotos" BOOLEAN NOT NULL DEFAULT false,
    "photoUrls" JSONB,
    "requiresAction" BOOLEAN NOT NULL DEFAULT false,
    "actionDeadline" DATETIME,
    "nextInspection" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "work_inspections_phase3_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_service_attendance_phase3" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT NOT NULL,
    "citizenPhone" TEXT NOT NULL,
    "citizenEmail" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attendanceType" TEXT NOT NULL,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "location" TEXT,
    "neighborhood" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "public_service_attendance_phase3_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_lighting_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "requestType" TEXT NOT NULL,
    "problemType" TEXT,
    "address" TEXT NOT NULL,
    "number" TEXT,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "coordinates" TEXT,
    "description" TEXT NOT NULL,
    "urgency" BOOLEAN NOT NULL DEFAULT false,
    "hasPhotos" BOOLEAN NOT NULL DEFAULT false,
    "photoUrls" JSONB,
    "inspectionDate" DATETIME,
    "repairScheduled" DATETIME,
    "repairedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "public_lighting_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "urban_cleaning_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "cleaningType" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "coordinates" TEXT,
    "description" TEXT NOT NULL,
    "estimatedArea" REAL,
    "hasPhotos" BOOLEAN NOT NULL DEFAULT false,
    "photoUrls" JSONB,
    "scheduledDate" DATETIME,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "urban_cleaning_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "special_collection_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "collectionType" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "number" TEXT,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "itemDescription" TEXT NOT NULL,
    "estimatedVolume" TEXT,
    "itemQuantity" INTEGER,
    "preferredDate" DATETIME,
    "scheduledDate" DATETIME,
    "collectedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "special_collection_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "weeding_requests_phase3" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "coordinates" TEXT,
    "areaType" TEXT NOT NULL,
    "estimatedArea" REAL,
    "description" TEXT NOT NULL,
    "hasPhotos" BOOLEAN NOT NULL DEFAULT false,
    "photoUrls" JSONB,
    "scheduledDate" DATETIME,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "weeding_requests_phase3_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "drainage_unblock_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "coordinates" TEXT,
    "obstructionType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "causingFlooding" BOOLEAN NOT NULL DEFAULT false,
    "hasPhotos" BOOLEAN NOT NULL DEFAULT false,
    "photoUrls" JSONB,
    "inspectionDate" DATETIME,
    "scheduledDate" DATETIME,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "drainage_unblock_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tree_pruning_requests_phase3" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "coordinates" TEXT,
    "treeType" TEXT,
    "treeHeight" TEXT,
    "pruningReason" TEXT NOT NULL,
    "urgency" BOOLEAN NOT NULL DEFAULT false,
    "nearPowerLines" BOOLEAN NOT NULL DEFAULT false,
    "hasPhotos" BOOLEAN NOT NULL DEFAULT false,
    "photoUrls" JSONB,
    "inspectionDate" DATETIME,
    "scheduledDate" DATETIME,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tree_pruning_requests_phase3_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_building_permits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerCpf" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "ownerEmail" TEXT,
    "propertyAddress" TEXT NOT NULL,
    "propertyNumber" TEXT,
    "neighborhood" TEXT NOT NULL,
    "lotNumber" TEXT,
    "block" TEXT,
    "subdivision" TEXT,
    "registryNumber" TEXT,
    "projectType" TEXT NOT NULL,
    "constructionArea" REAL NOT NULL,
    "totalArea" REAL NOT NULL,
    "floors" INTEGER NOT NULL,
    "rooms" INTEGER,
    "parking" INTEGER,
    "engineerName" TEXT NOT NULL,
    "engineerCrea" TEXT NOT NULL,
    "engineerPhone" TEXT NOT NULL,
    "artNumber" TEXT,
    "projectApprovalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ANALYSIS',
    "analysisStartedAt" DATETIME,
    "approvedAt" DATETIME,
    "issuedAt" DATETIME,
    "expiresAt" DATETIME,
    "observations" TEXT,
    "rejectionReason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "building_permits_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "building_permits_projectApprovalId_fkey" FOREIGN KEY ("projectApprovalId") REFERENCES "project_approvals" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_building_permits" ("approvedAt", "createdAt", "floors", "id", "lotNumber", "neighborhood", "observations", "propertyAddress", "propertyNumber", "protocolId", "status", "totalArea", "updatedAt") SELECT "approvedAt", "createdAt", "floors", "id", "lotNumber", "neighborhood", "observations", "propertyAddress", "propertyNumber", "protocolId", "status", "totalArea", "updatedAt" FROM "building_permits";
DROP TABLE "building_permits";
ALTER TABLE "new_building_permits" RENAME TO "building_permits";
CREATE UNIQUE INDEX "building_permits_protocolId_key" ON "building_permits"("protocolId");
CREATE INDEX "building_permits_ownerCpf_idx" ON "building_permits"("ownerCpf");
CREATE INDEX "building_permits_status_idx" ON "building_permits"("status");
CREATE INDEX "building_permits_expiresAt_idx" ON "building_permits"("expiresAt");
CREATE TABLE "new_certificate_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT NOT NULL,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "certificateType" TEXT NOT NULL,
    "purpose" TEXT,
    "propertyAddress" TEXT,
    "propertyRegistration" TEXT,
    "lotNumber" TEXT,
    "block" TEXT,
    "urgency" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "issuedAt" DATETIME,
    "validUntil" DATETIME,
    "certificateNumber" TEXT,
    "observations" TEXT,
    "rejectionReason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "certificate_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_certificate_requests" ("certificateNumber", "certificateType", "createdAt", "id", "observations", "propertyAddress", "protocolId", "purpose", "status", "updatedAt", "validUntil") SELECT "certificateNumber", "certificateType", "createdAt", "id", "observations", "propertyAddress", "protocolId", "purpose", "status", "updatedAt", "validUntil" FROM "certificate_requests";
DROP TABLE "certificate_requests";
ALTER TABLE "new_certificate_requests" RENAME TO "certificate_requests";
CREATE UNIQUE INDEX "certificate_requests_protocolId_key" ON "certificate_requests"("protocolId");
CREATE INDEX "certificate_requests_requesterCpf_idx" ON "certificate_requests"("requesterCpf");
CREATE INDEX "certificate_requests_status_idx" ON "certificate_requests"("status");
CREATE INDEX "certificate_requests_certificateType_idx" ON "certificate_requests"("certificateType");
CREATE TABLE "new_project_approvals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerCpf" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "ownerEmail" TEXT,
    "propertyAddress" TEXT NOT NULL,
    "propertyNumber" TEXT,
    "neighborhood" TEXT NOT NULL,
    "lotNumber" TEXT,
    "block" TEXT,
    "subdivision" TEXT,
    "registryNumber" TEXT,
    "projectType" TEXT NOT NULL,
    "projectCategory" TEXT NOT NULL,
    "constructionArea" REAL NOT NULL,
    "totalArea" REAL NOT NULL,
    "floors" INTEGER NOT NULL,
    "units" INTEGER,
    "architectName" TEXT NOT NULL,
    "architectCau" TEXT NOT NULL,
    "architectPhone" TEXT NOT NULL,
    "rrtNumber" TEXT,
    "technicalOpinion" TEXT,
    "observations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ANALYSIS',
    "analysisStartedAt" DATETIME,
    "approvedAt" DATETIME,
    "rejectedAt" DATETIME,
    "rejectionReason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_approvals_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_project_approvals" ("createdAt", "id", "projectType", "protocolId", "status", "updatedAt") SELECT "createdAt", "id", "projectType", "protocolId", "status", "updatedAt" FROM "project_approvals";
DROP TABLE "project_approvals";
ALTER TABLE "new_project_approvals" RENAME TO "project_approvals";
CREATE UNIQUE INDEX "project_approvals_protocolId_key" ON "project_approvals"("protocolId");
CREATE INDEX "project_approvals_ownerCpf_idx" ON "project_approvals"("ownerCpf");
CREATE INDEX "project_approvals_status_idx" ON "project_approvals"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "urban_planning_attendance_protocolId_key" ON "urban_planning_attendance"("protocolId");

-- CreateIndex
CREATE INDEX "urban_planning_attendance_citizenCpf_idx" ON "urban_planning_attendance"("citizenCpf");

-- CreateIndex
CREATE INDEX "urban_planning_attendance_status_idx" ON "urban_planning_attendance"("status");

-- CreateIndex
CREATE INDEX "urban_planning_attendance_attendanceType_idx" ON "urban_planning_attendance"("attendanceType");

-- CreateIndex
CREATE UNIQUE INDEX "operating_licenses_protocolId_key" ON "operating_licenses"("protocolId");

-- CreateIndex
CREATE INDEX "operating_licenses_cnpj_idx" ON "operating_licenses"("cnpj");

-- CreateIndex
CREATE INDEX "operating_licenses_ownerCpf_idx" ON "operating_licenses"("ownerCpf");

-- CreateIndex
CREATE INDEX "operating_licenses_status_idx" ON "operating_licenses"("status");

-- CreateIndex
CREATE INDEX "operating_licenses_expiresAt_idx" ON "operating_licenses"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "illegal_construction_reports_protocolId_key" ON "illegal_construction_reports"("protocolId");

-- CreateIndex
CREATE INDEX "illegal_construction_reports_status_idx" ON "illegal_construction_reports"("status");

-- CreateIndex
CREATE INDEX "illegal_construction_reports_neighborhood_idx" ON "illegal_construction_reports"("neighborhood");

-- CreateIndex
CREATE UNIQUE INDEX "subdivision_registrations_protocolId_key" ON "subdivision_registrations"("protocolId");

-- CreateIndex
CREATE INDEX "subdivision_registrations_status_idx" ON "subdivision_registrations"("status");

-- CreateIndex
CREATE INDEX "subdivision_registrations_subdivisionName_idx" ON "subdivision_registrations"("subdivisionName");

-- CreateIndex
CREATE UNIQUE INDEX "public_works_attendance_phase3_protocolId_key" ON "public_works_attendance_phase3"("protocolId");

-- CreateIndex
CREATE INDEX "public_works_attendance_phase3_citizenCpf_idx" ON "public_works_attendance_phase3"("citizenCpf");

-- CreateIndex
CREATE INDEX "public_works_attendance_phase3_status_idx" ON "public_works_attendance_phase3"("status");

-- CreateIndex
CREATE UNIQUE INDEX "road_repair_requests_phase3_protocolId_key" ON "road_repair_requests_phase3"("protocolId");

-- CreateIndex
CREATE INDEX "road_repair_requests_phase3_status_idx" ON "road_repair_requests_phase3"("status");

-- CreateIndex
CREATE INDEX "road_repair_requests_phase3_neighborhood_idx" ON "road_repair_requests_phase3"("neighborhood");

-- CreateIndex
CREATE INDEX "road_repair_requests_phase3_problemType_idx" ON "road_repair_requests_phase3"("problemType");

-- CreateIndex
CREATE UNIQUE INDEX "technical_inspections_phase3_protocolId_key" ON "technical_inspections_phase3"("protocolId");

-- CreateIndex
CREATE INDEX "technical_inspections_phase3_status_idx" ON "technical_inspections_phase3"("status");

-- CreateIndex
CREATE INDEX "technical_inspections_phase3_inspectionType_idx" ON "technical_inspections_phase3"("inspectionType");

-- CreateIndex
CREATE UNIQUE INDEX "public_work_registrations_protocolId_key" ON "public_work_registrations"("protocolId");

-- CreateIndex
CREATE INDEX "public_work_registrations_status_idx" ON "public_work_registrations"("status");

-- CreateIndex
CREATE INDEX "public_work_registrations_workType_idx" ON "public_work_registrations"("workType");

-- CreateIndex
CREATE INDEX "public_work_registrations_neighborhood_idx" ON "public_work_registrations"("neighborhood");

-- CreateIndex
CREATE UNIQUE INDEX "work_inspections_phase3_protocolId_key" ON "work_inspections_phase3"("protocolId");

-- CreateIndex
CREATE INDEX "work_inspections_phase3_workName_idx" ON "work_inspections_phase3"("workName");

-- CreateIndex
CREATE INDEX "work_inspections_phase3_inspectionDate_idx" ON "work_inspections_phase3"("inspectionDate");

-- CreateIndex
CREATE UNIQUE INDEX "public_service_attendance_phase3_protocolId_key" ON "public_service_attendance_phase3"("protocolId");

-- CreateIndex
CREATE INDEX "public_service_attendance_phase3_citizenCpf_idx" ON "public_service_attendance_phase3"("citizenCpf");

-- CreateIndex
CREATE INDEX "public_service_attendance_phase3_status_idx" ON "public_service_attendance_phase3"("status");

-- CreateIndex
CREATE UNIQUE INDEX "public_lighting_requests_protocolId_key" ON "public_lighting_requests"("protocolId");

-- CreateIndex
CREATE INDEX "public_lighting_requests_status_idx" ON "public_lighting_requests"("status");

-- CreateIndex
CREATE INDEX "public_lighting_requests_neighborhood_idx" ON "public_lighting_requests"("neighborhood");

-- CreateIndex
CREATE INDEX "public_lighting_requests_requestType_idx" ON "public_lighting_requests"("requestType");

-- CreateIndex
CREATE UNIQUE INDEX "urban_cleaning_requests_protocolId_key" ON "urban_cleaning_requests"("protocolId");

-- CreateIndex
CREATE INDEX "urban_cleaning_requests_status_idx" ON "urban_cleaning_requests"("status");

-- CreateIndex
CREATE INDEX "urban_cleaning_requests_neighborhood_idx" ON "urban_cleaning_requests"("neighborhood");

-- CreateIndex
CREATE INDEX "urban_cleaning_requests_cleaningType_idx" ON "urban_cleaning_requests"("cleaningType");

-- CreateIndex
CREATE UNIQUE INDEX "special_collection_requests_protocolId_key" ON "special_collection_requests"("protocolId");

-- CreateIndex
CREATE INDEX "special_collection_requests_status_idx" ON "special_collection_requests"("status");

-- CreateIndex
CREATE INDEX "special_collection_requests_neighborhood_idx" ON "special_collection_requests"("neighborhood");

-- CreateIndex
CREATE INDEX "special_collection_requests_collectionType_idx" ON "special_collection_requests"("collectionType");

-- CreateIndex
CREATE UNIQUE INDEX "weeding_requests_phase3_protocolId_key" ON "weeding_requests_phase3"("protocolId");

-- CreateIndex
CREATE INDEX "weeding_requests_phase3_status_idx" ON "weeding_requests_phase3"("status");

-- CreateIndex
CREATE INDEX "weeding_requests_phase3_neighborhood_idx" ON "weeding_requests_phase3"("neighborhood");

-- CreateIndex
CREATE UNIQUE INDEX "drainage_unblock_requests_protocolId_key" ON "drainage_unblock_requests"("protocolId");

-- CreateIndex
CREATE INDEX "drainage_unblock_requests_status_idx" ON "drainage_unblock_requests"("status");

-- CreateIndex
CREATE INDEX "drainage_unblock_requests_neighborhood_idx" ON "drainage_unblock_requests"("neighborhood");

-- CreateIndex
CREATE INDEX "drainage_unblock_requests_causingFlooding_idx" ON "drainage_unblock_requests"("causingFlooding");

-- CreateIndex
CREATE UNIQUE INDEX "tree_pruning_requests_phase3_protocolId_key" ON "tree_pruning_requests_phase3"("protocolId");

-- CreateIndex
CREATE INDEX "tree_pruning_requests_phase3_status_idx" ON "tree_pruning_requests_phase3"("status");

-- CreateIndex
CREATE INDEX "tree_pruning_requests_phase3_neighborhood_idx" ON "tree_pruning_requests_phase3"("neighborhood");

-- CreateIndex
CREATE INDEX "tree_pruning_requests_phase3_urgency_idx" ON "tree_pruning_requests_phase3"("urgency");
