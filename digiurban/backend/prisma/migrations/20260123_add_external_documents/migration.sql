-- CreateTable
CREATE TABLE "external_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "citizenId" TEXT,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "documentHash" TEXT NOT NULL,
    "description" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_documents_pkey" PRIMARY KEY ("id")
);

-- AlterTable signatures - Adicionar suporte para documentos externos (CONDICIONAL)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'signatures') THEN
    ALTER TABLE "signatures" ADD COLUMN IF NOT EXISTS "externalDocumentId" TEXT;
    ALTER TABLE "signatures" ALTER COLUMN "documentId" DROP NOT NULL;
    CREATE INDEX IF NOT EXISTS "signatures_externalDocumentId_idx" ON "signatures"("externalDocumentId");
    ALTER TABLE "signatures" ADD CONSTRAINT "signatures_externalDocumentId_fkey" FOREIGN KEY ("externalDocumentId") REFERENCES "external_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AlterTable users - Adicionar relação com documentos externos (já existe, apenas comentário)
-- NOTA: A relação será criada via Prisma client, não precisa de ALTER TABLE

-- AlterTable citizens - Adicionar relação com documentos externos (já existe, apenas comentário)
-- NOTA: A relação será criada via Prisma client, não precisa de ALTER TABLE

-- CreateIndex
CREATE INDEX "external_documents_userId_idx" ON "external_documents"("userId");
CREATE INDEX "external_documents_citizenId_idx" ON "external_documents"("citizenId");
CREATE INDEX "external_documents_uploadedAt_idx" ON "external_documents"("uploadedAt");
CREATE INDEX "external_documents_isActive_idx" ON "external_documents"("isActive");

-- AddForeignKey
ALTER TABLE "external_documents" ADD CONSTRAINT "external_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "external_documents" ADD CONSTRAINT "external_documents_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
