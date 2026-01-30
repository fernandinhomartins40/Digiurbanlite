-- CreateEnum
CREATE TYPE "TipoAuditoriaVinculo" AS ENUM ('CRIACAO', 'ATIVACAO', 'DESATIVACAO', 'TRANSFERENCIA', 'ALTERACAO_CARGA_HORARIA', 'ALTERACAO_PERIODO');

-- CreateTable
CREATE TABLE "profissional_unidade" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "cargaHoraria" INTEGER,
    "percentualDedicacao" INTEGER,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profissional_unidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_vinculo" (
    "id" TEXT NOT NULL,
    "vinculoId" TEXT,
    "tipo" "TipoAuditoriaVinculo" NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "profissionalNome" TEXT NOT NULL,
    "unidadeOrigemId" TEXT,
    "unidadeOrigemNome" TEXT,
    "unidadeDestinoId" TEXT,
    "unidadeDestinoNome" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "motivo" TEXT,
    "detalhes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_vinculo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profissional_unidade_profissionalId_ativo_idx" ON "profissional_unidade"("profissionalId", "ativo");

-- CreateIndex
CREATE INDEX "profissional_unidade_unidadeId_ativo_idx" ON "profissional_unidade"("unidadeId", "ativo");

-- CreateIndex
CREATE INDEX "profissional_unidade_ativo_idx" ON "profissional_unidade"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "profissional_unidade_profissionalId_unidadeId_dataInicio_key" ON "profissional_unidade"("profissionalId", "unidadeId", "dataInicio");

-- CreateIndex
CREATE INDEX "auditoria_vinculo_profissionalId_idx" ON "auditoria_vinculo"("profissionalId");

-- CreateIndex
CREATE INDEX "auditoria_vinculo_unidadeOrigemId_idx" ON "auditoria_vinculo"("unidadeOrigemId");

-- CreateIndex
CREATE INDEX "auditoria_vinculo_unidadeDestinoId_idx" ON "auditoria_vinculo"("unidadeDestinoId");

-- CreateIndex
CREATE INDEX "auditoria_vinculo_tipo_idx" ON "auditoria_vinculo"("tipo");

-- CreateIndex
CREATE INDEX "auditoria_vinculo_createdAt_idx" ON "auditoria_vinculo"("createdAt");

-- AddForeignKey
ALTER TABLE "profissional_unidade" ADD CONSTRAINT "profissional_unidade_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais_saude"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissional_unidade" ADD CONSTRAINT "profissional_unidade_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades_saude"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_vinculo" ADD CONSTRAINT "auditoria_vinculo_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "profissional_unidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
