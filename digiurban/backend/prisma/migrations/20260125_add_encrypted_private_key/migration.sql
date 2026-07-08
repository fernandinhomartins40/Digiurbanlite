-- AlterTable (condicional — mesma técnica da migration 20260123013443)
-- REPARO (Fase 0 Multi-Tenant): a tabela digital_certificates não é criada por
-- nenhuma migration (foi criada via db push em produção — drift de histórico).
-- A forma não-condicional quebrava QUALQUER instalação nova via migrate deploy.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'digital_certificates') THEN
    ALTER TABLE "digital_certificates" ADD COLUMN IF NOT EXISTS "encryptedPrivateKey" TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- Update existing records with empty encrypted key (they will need to be re-issued)
-- In production, you might want to handle this differently
