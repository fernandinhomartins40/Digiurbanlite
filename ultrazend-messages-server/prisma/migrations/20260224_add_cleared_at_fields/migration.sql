-- AddColumn: clearedAt1 e clearedAt2 na tabela conversations
-- Suporte ao "Apagar para mim" — mensagens com sentAt < clearedAtN ficam ocultas para o participante N
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "clearedAt1" TIMESTAMP(3);
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "clearedAt2" TIMESTAMP(3);
