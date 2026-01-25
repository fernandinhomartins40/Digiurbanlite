-- AlterTable
ALTER TABLE "digital_certificates" ADD COLUMN "encryptedPrivateKey" TEXT NOT NULL DEFAULT '';

-- Update existing records with empty encrypted key (they will need to be re-issued)
-- In production, you might want to handle this differently
