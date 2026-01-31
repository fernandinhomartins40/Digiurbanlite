-- CreateTable: ProfissionalEspecialidade (Relacionamento N:N entre Profissional e Especialidade)
CREATE TABLE "profissional_especialidade" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "especialidadeId" TEXT NOT NULL,
    "isPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profissional_especialidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profissional_especialidade_profissionalId_especialidadeId_key" ON "profissional_especialidade"("profissionalId", "especialidadeId");

-- CreateIndex
CREATE INDEX "profissional_especialidade_profissionalId_ativo_idx" ON "profissional_especialidade"("profissionalId", "ativo");

-- CreateIndex
CREATE INDEX "profissional_especialidade_especialidadeId_ativo_idx" ON "profissional_especialidade"("especialidadeId", "ativo");

-- CreateIndex
CREATE INDEX "profissional_especialidade_isPrincipal_ativo_idx" ON "profissional_especialidade"("isPrincipal", "ativo");

-- AddForeignKey
ALTER TABLE "profissional_especialidade" ADD CONSTRAINT "profissional_especialidade_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissional_saude"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissional_especialidade" ADD CONSTRAINT "profissional_especialidade_especialidadeId_fkey" FOREIGN KEY ("especialidadeId") REFERENCES "especialidade_medica"("id") ON DELETE CASCADE ON UPDATE CASCADE;
