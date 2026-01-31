-- CreateEnum para FluxoAtendimento
CREATE TYPE "FluxoAtendimento" AS ENUM ('TRADICIONAL', 'ESF', 'MISTO');

-- CreateEnum para ClassificacaoRisco (Protocolo de Manchester)
CREATE TYPE "ClassificacaoRisco" AS ENUM ('VERMELHO', 'LARANJA', 'AMARELO', 'VERDE', 'AZUL');

-- CreateEnum para CondutaAcolhimento
CREATE TYPE "CondutaAcolhimento" AS ENUM (
  'RESOLVER_ACOLHIMENTO',
  'ENCAMINHAR_MEDICO',
  'ENCAMINHAR_ENFERMEIRO',
  'ENCAMINHAR_PROCEDIMENTO',
  'AGENDAR_CONSULTA',
  'ENCAMINHAR_EXTERNO',
  'ORIENTACAO'
);

-- AlterEnum: Adicionar novos valores ao StatusFila
ALTER TYPE "StatusFila" ADD VALUE 'EM_CLASSIFICACAO_RISCO';
ALTER TYPE "StatusFila" ADD VALUE 'AGUARDANDO_ATENDIMENTO';
ALTER TYPE "StatusFila" ADD VALUE 'EM_ACOLHIMENTO';
ALTER TYPE "StatusFila" ADD VALUE 'RESOLVIDO_ACOLHIMENTO';
ALTER TYPE "StatusFila" ADD VALUE 'ENCAMINHADO_EXTERNO';
ALTER TYPE "StatusFila" ADD VALUE 'INTERNADO';
ALTER TYPE "StatusFila" ADD VALUE 'TRANSFERIDO';

-- AlterTable: Adicionar campo fluxoAtendimento na UnidadeSaude
ALTER TABLE "unidades_saude"
ADD COLUMN "fluxoAtendimento" "FluxoAtendimento" NOT NULL DEFAULT 'TRADICIONAL';

-- AlterTable: Adicionar campos de Classificação de Risco e Acolhimento na FilaAtendimento
ALTER TABLE "fila_atendimento"
ADD COLUMN "classificacaoRisco" "ClassificacaoRisco",
ADD COLUMN "dataClassificacaoRisco" TIMESTAMP(3),
ADD COLUMN "queixaPrincipal" TEXT,
ADD COLUMN "sinaisVitais" JSONB,
ADD COLUMN "condutaAcolhimento" "CondutaAcolhimento",
ADD COLUMN "dataAcolhimento" TIMESTAMP(3),
ADD COLUMN "resolvidoAcolhimento" BOOLEAN NOT NULL DEFAULT false;

-- Criar índices para melhorar performance
CREATE INDEX "fila_atendimento_classificacaoRisco_idx" ON "fila_atendimento"("classificacaoRisco");
CREATE INDEX "fila_atendimento_condutaAcolhimento_idx" ON "fila_atendimento"("condutaAcolhimento");
CREATE INDEX "fila_atendimento_resolvidoAcolhimento_idx" ON "fila_atendimento"("resolvidoAcolhimento");
CREATE INDEX "unidades_saude_fluxoAtendimento_idx" ON "unidades_saude"("fluxoAtendimento");

-- Comentários para documentação
COMMENT ON COLUMN "unidades_saude"."fluxoAtendimento" IS 'Tipo de fluxo de atendimento: TRADICIONAL (UPA/UBS sem ESF), ESF (UBS com ESF), MISTO (ambos)';
COMMENT ON COLUMN "fila_atendimento"."classificacaoRisco" IS 'Classificação de Risco pelo Protocolo de Manchester (UPA)';
COMMENT ON COLUMN "fila_atendimento"."condutaAcolhimento" IS 'Conduta definida no acolhimento (UBS)';
COMMENT ON COLUMN "fila_atendimento"."resolvidoAcolhimento" IS 'Se o problema foi resolvido no próprio acolhimento';
