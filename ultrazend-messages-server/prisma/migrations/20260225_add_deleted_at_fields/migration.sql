-- AddColumn: deletedAt1 e deletedAt2 na tabela conversations
-- "Excluir conversa" por participante — oculta a conversa para quem excluiu, sem afetar o outro

ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "deletedAt1" TIMESTAMP(3);
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "deletedAt2" TIMESTAMP(3);
