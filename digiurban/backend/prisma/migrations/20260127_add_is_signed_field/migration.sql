-- AddColumn
ALTER TABLE "generated_documents" ADD COLUMN IF NOT EXISTS "isSigned" BOOLEAN NOT NULL DEFAULT false;

-- AddColumn
ALTER TABLE "external_documents" ADD COLUMN IF NOT EXISTS "isSigned" BOOLEAN NOT NULL DEFAULT false;
