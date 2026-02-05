-- AlterTable: Adicionar campos de servidor público na tabela users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cpf" TEXT,
ADD COLUMN IF NOT EXISTS "matricula" TEXT,
ADD COLUMN IF NOT EXISTS "rg" TEXT,
ADD COLUMN IF NOT EXISTS "dataNascimento" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "telefone" TEXT,
ADD COLUMN IF NOT EXISTS "telefoneSecundario" TEXT,
ADD COLUMN IF NOT EXISTS "endereco" JSONB,
ADD COLUMN IF NOT EXISTS "cargoEfetivo" TEXT,
ADD COLUMN IF NOT EXISTS "situacaoFuncional" TEXT,
ADD COLUMN IF NOT EXISTS "dataAdmissao" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "observacoes" TEXT;

-- CreateIndex: Adicionar índices únicos para CPF e matrícula
CREATE UNIQUE INDEX IF NOT EXISTS "users_cpf_key" ON "users"("cpf");
CREATE UNIQUE INDEX IF NOT EXISTS "users_matricula_key" ON "users"("matricula");
