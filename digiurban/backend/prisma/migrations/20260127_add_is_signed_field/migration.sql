-- AddColumn
ALTER TABLE "GeneratedDocument" ADD COLUMN IF NOT EXISTS "isSigned" BOOLEAN NOT NULL DEFAULT false;

-- AddColumn
ALTER TABLE "ExternalDocument" ADD COLUMN IF NOT EXISTS "isSigned" BOOLEAN NOT NULL DEFAULT false;
