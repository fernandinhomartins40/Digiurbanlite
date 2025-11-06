/*
  Warnings:

  - You are about to drop the `sport_modalities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `sportsModalityId` on the `competitions` table. All the data in the column will be lost.
  - You are about to drop the column `sportsModalityId` on the `sports_teams` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sports_modalities" ADD COLUMN "equipment" JSONB;
ALTER TABLE "sports_modalities" ADD COLUMN "maxAge" INTEGER;
ALTER TABLE "sports_modalities" ADD COLUMN "minAge" INTEGER;
ALTER TABLE "sports_modalities" ADD COLUMN "rules" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "sport_modalities";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_athletes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "sport" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "team" TEXT,
    "teamId" TEXT,
    "position" TEXT,
    "medicalInfo" JSONB,
    "emergencyContact" JSONB,
    "federationNumber" TEXT,
    "federationExpiry" DATETIME,
    "medicalCertificate" JSONB,
    "modalityId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "athletes_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "sports_modalities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "athletes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "athletes_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_athletes" ("address", "birthDate", "category", "cpf", "createdAt", "email", "emergencyContact", "federationExpiry", "federationNumber", "id", "isActive", "medicalCertificate", "medicalInfo", "modalityId", "name", "phone", "position", "protocol", "protocolId", "rg", "serviceId", "source", "sport", "team", "teamId", "tenantId", "updatedAt") SELECT "address", "birthDate", "category", "cpf", "createdAt", "email", "emergencyContact", "federationExpiry", "federationNumber", "id", "isActive", "medicalCertificate", "medicalInfo", "modalityId", "name", "phone", "position", "protocol", "protocolId", "rg", "serviceId", "source", "sport", "team", "teamId", "tenantId", "updatedAt" FROM "athletes";
DROP TABLE "athletes";
ALTER TABLE "new_athletes" RENAME TO "athletes";
CREATE INDEX "athletes_protocolId_idx" ON "athletes"("protocolId");
CREATE INDEX "athletes_tenantId_createdAt_idx" ON "athletes"("tenantId", "createdAt");
CREATE UNIQUE INDEX "athletes_tenantId_cpf_key" ON "athletes"("tenantId", "cpf");
CREATE TABLE "new_competitions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "competitionType" TEXT NOT NULL,
    "type" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "maxTeams" INTEGER,
    "registeredTeams" INTEGER,
    "registrationFee" REAL,
    "entryFee" REAL,
    "prizes" JSONB,
    "rules" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "organizer" TEXT NOT NULL,
    "venue" TEXT,
    "location" TEXT,
    "contact" JSONB,
    "results" JSONB,
    "modalityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "competitions_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "sports_modalities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "competitions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "competitions_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_competitions" ("ageGroup", "category", "competitionType", "contact", "createdAt", "endDate", "entryFee", "id", "location", "maxTeams", "modalityId", "name", "organizer", "prizes", "protocolId", "registeredTeams", "registrationFee", "results", "rules", "sport", "startDate", "status", "tenantId", "type", "updatedAt", "venue") SELECT "ageGroup", "category", "competitionType", "contact", "createdAt", "endDate", "entryFee", "id", "location", "maxTeams", "modalityId", "name", "organizer", "prizes", "protocolId", "registeredTeams", "registrationFee", "results", "rules", "sport", "startDate", "status", "tenantId", "type", "updatedAt", "venue" FROM "competitions";
DROP TABLE "competitions";
ALTER TABLE "new_competitions" RENAME TO "competitions";
CREATE INDEX "competitions_protocolId_idx" ON "competitions"("protocolId");
CREATE INDEX "competitions_tenantId_status_idx" ON "competitions"("tenantId", "status");
CREATE INDEX "competitions_tenantId_createdAt_idx" ON "competitions"("tenantId", "createdAt");
CREATE TABLE "new_sports_teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "gender" TEXT,
    "ageGroup" TEXT NOT NULL,
    "coach" TEXT NOT NULL,
    "coachCpf" TEXT,
    "coachPhone" TEXT,
    "foundationDate" DATETIME,
    "trainingSchedule" JSONB,
    "maxPlayers" INTEGER,
    "currentPlayers" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "homeVenue" TEXT,
    "description" TEXT,
    "achievements" JSONB,
    "roster" JSONB,
    "modalityId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sports_teams_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "sports_modalities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sports_teams_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sports_teams_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sports_teams" ("achievements", "ageGroup", "category", "coach", "coachCpf", "coachPhone", "createdAt", "currentPlayers", "description", "foundationDate", "gender", "homeVenue", "id", "isActive", "maxPlayers", "modalityId", "name", "protocol", "protocolId", "roster", "serviceId", "source", "sport", "status", "tenantId", "trainingSchedule", "updatedAt") SELECT "achievements", "ageGroup", "category", "coach", "coachCpf", "coachPhone", "createdAt", "currentPlayers", "description", "foundationDate", "gender", "homeVenue", "id", "isActive", "maxPlayers", "modalityId", "name", "protocol", "protocolId", "roster", "serviceId", "source", "sport", "status", "tenantId", "trainingSchedule", "updatedAt" FROM "sports_teams";
DROP TABLE "sports_teams";
ALTER TABLE "new_sports_teams" RENAME TO "sports_teams";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
