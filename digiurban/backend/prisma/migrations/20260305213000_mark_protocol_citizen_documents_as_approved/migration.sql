-- REPARO (Fase 0 Multi-Tenant, achado B7): a coluna citizen_documents.sourceType
-- é drift (adicionada via db push). Em banco novo não existe (nem há dados a
-- migrar) — condicional.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'citizen_documents' AND column_name = 'sourceType') THEN
    UPDATE "citizen_documents"
    SET
      "status" = 'APPROVED',
      "reviewedAt" = COALESCE("reviewedAt", NOW()),
      "updatedAt" = NOW()
    WHERE
      "sourceType" = 'PROTOCOL'
      AND "status" IN ('PENDING', 'UNDER_REVIEW', 'UPLOADED');
  END IF;
END $$;
