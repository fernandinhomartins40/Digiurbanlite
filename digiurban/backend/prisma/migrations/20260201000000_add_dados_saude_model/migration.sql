-- CreateTable: DadosSaude (nova tabela para dados específicos de saúde vinculados ao User)
CREATE TABLE "dados_saude" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "registroProfissional" TEXT,
    "tipoRegistro" TEXT,
    "ufRegistro" TEXT,
    "cns" TEXT,
    "especialidades" JSONB,
    "cbo" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "motivoInativacao" TEXT,
    "dataInativacao" TIMESTAMP(3),
    "aceitaAgendamento" BOOLEAN NOT NULL DEFAULT true,
    "tempoMedioConsulta" INTEGER DEFAULT 30,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "dados_saude_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dados_saude_userId_key" ON "dados_saude"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dados_saude_registroProfissional_key" ON "dados_saude"("registroProfissional");

-- CreateIndex
CREATE UNIQUE INDEX "dados_saude_cns_key" ON "dados_saude"("cns");

-- CreateIndex
CREATE INDEX "dados_saude_userId_idx" ON "dados_saude"("userId");

-- CreateIndex
CREATE INDEX "dados_saude_categoria_idx" ON "dados_saude"("categoria");

-- CreateIndex
CREATE INDEX "dados_saude_ativo_idx" ON "dados_saude"("ativo");

-- AddForeignKey
ALTER TABLE "dados_saude" ADD CONSTRAINT "dados_saude_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: ProfissionalUnidade - Mudar relacionamento de ProfissionalSaude para User
-- NOTA: Esta alteração requer migração de dados manual antes de aplicar
-- Os dados existentes em profissional_unidade precisam ser atualizados para referenciar User ao invés de ProfissionalSaude

-- DropForeignKey (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'profissional_unidade_profissionalId_fkey'
    ) THEN
        ALTER TABLE "profissional_unidade" DROP CONSTRAINT "profissional_unidade_profissionalId_fkey";
    END IF;
END $$;

-- AddForeignKey: Novo relacionamento com User
ALTER TABLE "profissional_unidade" ADD CONSTRAINT "profissional_unidade_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
