-- Assinatura eletrônica no histórico do processo interno (código de verificação)
ALTER TABLE "internal_process_movements" ADD COLUMN IF NOT EXISTS "signatureHash" TEXT;
CREATE INDEX IF NOT EXISTS "internal_process_movements_signatureHash_idx" ON "internal_process_movements"("signatureHash");
