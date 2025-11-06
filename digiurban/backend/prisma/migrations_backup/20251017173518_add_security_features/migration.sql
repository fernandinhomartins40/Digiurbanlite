/*
  Warnings:

  - You are about to drop the column `ipAddress` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `resourceId` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to alter the column `details` on the `audit_logs` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - Made the column `tenantId` on table `audit_logs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `citizens` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "citizenId" TEXT,
    "tenantId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "method" TEXT,
    "details" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_audit_logs" ("action", "details", "id", "resource", "tenantId", "userAgent", "userId") SELECT "action", "details", "id", "resource", "tenantId", "userAgent", "userId" FROM "audit_logs";
DROP TABLE "audit_logs";
ALTER TABLE "new_audit_logs" RENAME TO "audit_logs";
CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_citizenId_idx" ON "audit_logs"("citizenId");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE TABLE "new_citizens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cpf" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "birthDate" DATETIME,
    "address" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "password" TEXT NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedAt" DATETIME,
    "verifiedBy" TEXT,
    "verificationNotes" TEXT,
    "registrationSource" TEXT NOT NULL DEFAULT 'SELF',
    "tenantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME,
    CONSTRAINT "citizens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_citizens" ("address", "birthDate", "cpf", "createdAt", "email", "id", "isActive", "lastLogin", "name", "password", "phone", "registrationSource", "tenantId", "updatedAt", "verificationNotes", "verificationStatus", "verifiedAt", "verifiedBy") SELECT "address", "birthDate", "cpf", "createdAt", "email", "id", "isActive", "lastLogin", "name", "password", "phone", "registrationSource", "tenantId", "updatedAt", "verificationNotes", "verificationStatus", "verifiedAt", "verifiedBy" FROM "citizens";
DROP TABLE "citizens";
ALTER TABLE "new_citizens" RENAME TO "citizens";
CREATE UNIQUE INDEX "citizens_cpf_key" ON "citizens"("cpf");
CREATE UNIQUE INDEX "citizens_tenantId_cpf_key" ON "citizens"("tenantId", "cpf");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "departmentId" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME,
    CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("createdAt", "departmentId", "email", "id", "isActive", "lastLogin", "name", "password", "role", "tenantId", "updatedAt") SELECT "createdAt", "departmentId", "email", "id", "isActive", "lastLogin", "name", "password", "role", "tenantId", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
