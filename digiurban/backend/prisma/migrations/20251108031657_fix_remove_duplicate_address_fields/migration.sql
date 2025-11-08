/*
  Warnings:

  - You are about to drop the column `cep` on the `citizens` table. All the data in the column will be lost.
  - You are about to drop the column `complement` on the `citizens` table. All the data in the column will be lost.
  - You are about to drop the column `neighborhood` on the `citizens` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `citizens` table. All the data in the column will be lost.
  - You are about to drop the column `referencePoint` on the `citizens` table. All the data in the column will be lost.
  - You are about to drop the column `street` on the `citizens` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_citizens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cpf" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "birthDate" DATETIME,
    "address" JSONB,
    "municipioId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "password" TEXT NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedAt" DATETIME,
    "verifiedBy" TEXT,
    "verificationNotes" TEXT,
    "registrationSource" TEXT NOT NULL DEFAULT 'SELF',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME,
    "rg" TEXT,
    "phoneSecondary" TEXT,
    "motherName" TEXT,
    "maritalStatus" TEXT,
    "occupation" TEXT,
    "familyIncome" TEXT
);
INSERT INTO "new_citizens" ("address", "birthDate", "cpf", "createdAt", "email", "failedLoginAttempts", "familyIncome", "id", "isActive", "lastLogin", "lockedUntil", "maritalStatus", "motherName", "municipioId", "name", "occupation", "password", "phone", "phoneSecondary", "registrationSource", "rg", "updatedAt", "verificationNotes", "verificationStatus", "verifiedAt", "verifiedBy") SELECT "address", "birthDate", "cpf", "createdAt", "email", "failedLoginAttempts", "familyIncome", "id", "isActive", "lastLogin", "lockedUntil", "maritalStatus", "motherName", "municipioId", "name", "occupation", "password", "phone", "phoneSecondary", "registrationSource", "rg", "updatedAt", "verificationNotes", "verificationStatus", "verifiedAt", "verifiedBy" FROM "citizens";
DROP TABLE "citizens";
ALTER TABLE "new_citizens" RENAME TO "citizens";
CREATE UNIQUE INDEX "citizens_cpf_key" ON "citizens"("cpf");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
