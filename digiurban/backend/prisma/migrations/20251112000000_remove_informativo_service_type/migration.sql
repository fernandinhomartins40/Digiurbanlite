-- Migration: Remove INFORMATIVO from ServiceType enum
-- Description: Replace INFORMATIVO with SEM_DADOS and update enum definition

-- Step 1: Update all existing INFORMATIVO records to SEM_DADOS (already done manually)
-- UPDATE "services_simplified" SET "serviceType" = 'SEM_DADOS' WHERE "serviceType" = 'INFORMATIVO';

-- Step 2: Create new enum without INFORMATIVO
CREATE TYPE "ServiceType_new" AS ENUM ('COM_DADOS', 'SEM_DADOS');

-- Step 3: Alter column to use new enum
ALTER TABLE "services_simplified"
  ALTER COLUMN "serviceType" TYPE "ServiceType_new"
  USING ("serviceType"::text::"ServiceType_new");

-- Step 4: Drop old enum and rename new one
DROP TYPE "ServiceType";
ALTER TYPE "ServiceType_new" RENAME TO "ServiceType";
