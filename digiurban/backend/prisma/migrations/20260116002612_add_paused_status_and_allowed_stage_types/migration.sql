-- AlterEnum
ALTER TYPE "StageStatus" ADD VALUE 'PAUSED';

-- AlterTable
ALTER TABLE "document_templates" ADD COLUMN     "allowedStageTypes" JSONB DEFAULT '[]';
