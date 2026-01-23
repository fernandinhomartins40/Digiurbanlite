-- AlterEnum: Adicionar FILE ao enum MessageContentType
ALTER TYPE "MessageContentType" ADD VALUE IF NOT EXISTS 'FILE';
