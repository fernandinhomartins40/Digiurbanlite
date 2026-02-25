-- AlterTable: Adicionar campos clearedAt1/2 e deletedAt1/2 na tabela conversations
-- Esses campos permitem "apagar para mim" e "excluir conversa" por participante

ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "clearedAt1" TIMESTAMP(3);
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "clearedAt2" TIMESTAMP(3);
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "deletedAt1" TIMESTAMP(3);
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "deletedAt2" TIMESTAMP(3);
