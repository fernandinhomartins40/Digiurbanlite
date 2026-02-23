-- AlterTable digital_certificates - Adicionar citizenId (CONDICIONAL)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'digital_certificates') THEN
    ALTER TABLE "digital_certificates" ADD COLUMN IF NOT EXISTS "citizenId" TEXT;
    CREATE INDEX IF NOT EXISTS "digital_certificates_citizenId_idx" ON "digital_certificates"("citizenId");

    -- AddForeignKey apenas se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'digital_certificates_citizenId_fkey'
    ) THEN
      ALTER TABLE "digital_certificates" ADD CONSTRAINT "digital_certificates_citizenId_fkey"
      FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;
