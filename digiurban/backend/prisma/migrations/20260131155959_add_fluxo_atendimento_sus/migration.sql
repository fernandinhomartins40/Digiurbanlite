-- REPARO (Fase 0 Multi-Tenant, achado B7): migration tornada idempotente.
-- A consolidada 20260106023614 já cria "ClassificacaoRisco" com valores antigos
-- (EMERGENCIA..NAO_URGENTE); esta recriava o tipo (Manchester) e abortava todo
-- deploy em banco novo. Agora: cria se não existir; se existir, adiciona os
-- valores Manchester (superset não-destrutivo — o schema.prisma usa só as cores).

-- CreateEnum para FluxoAtendimento
DO $$ BEGIN
  CREATE TYPE "FluxoAtendimento" AS ENUM ('TRADICIONAL', 'ESF', 'MISTO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum para ClassificacaoRisco (Protocolo de Manchester)
DO $$ BEGIN
  CREATE TYPE "ClassificacaoRisco" AS ENUM ('VERMELHO', 'LARANJA', 'AMARELO', 'VERDE', 'AZUL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "ClassificacaoRisco" ADD VALUE IF NOT EXISTS 'VERMELHO';
ALTER TYPE "ClassificacaoRisco" ADD VALUE IF NOT EXISTS 'LARANJA';
ALTER TYPE "ClassificacaoRisco" ADD VALUE IF NOT EXISTS 'AMARELO';
ALTER TYPE "ClassificacaoRisco" ADD VALUE IF NOT EXISTS 'VERDE';
ALTER TYPE "ClassificacaoRisco" ADD VALUE IF NOT EXISTS 'AZUL';

-- CreateEnum para CondutaAcolhimento
DO $$ BEGIN
  CREATE TYPE "CondutaAcolhimento" AS ENUM (
    'RESOLVER_ACOLHIMENTO',
    'ENCAMINHAR_MEDICO',
    'ENCAMINHAR_ENFERMEIRO',
    'ENCAMINHAR_PROCEDIMENTO',
    'AGENDAR_CONSULTA',
    'ENCAMINHAR_EXTERNO',
    'ORIENTACAO'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AlterEnum: StatusFila é drift (criado via db push, não existe em banco novo) —
-- condicional; a baseline de reparo no fim da cadeia cria o estado completo.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatusFila') THEN
    EXECUTE 'ALTER TYPE "StatusFila" ADD VALUE IF NOT EXISTS ''EM_CLASSIFICACAO_RISCO''';
    EXECUTE 'ALTER TYPE "StatusFila" ADD VALUE IF NOT EXISTS ''AGUARDANDO_ATENDIMENTO''';
    EXECUTE 'ALTER TYPE "StatusFila" ADD VALUE IF NOT EXISTS ''EM_ACOLHIMENTO''';
    EXECUTE 'ALTER TYPE "StatusFila" ADD VALUE IF NOT EXISTS ''RESOLVIDO_ACOLHIMENTO''';
    EXECUTE 'ALTER TYPE "StatusFila" ADD VALUE IF NOT EXISTS ''ENCAMINHADO_EXTERNO''';
    EXECUTE 'ALTER TYPE "StatusFila" ADD VALUE IF NOT EXISTS ''INTERNADO''';
    EXECUTE 'ALTER TYPE "StatusFila" ADD VALUE IF NOT EXISTS ''TRANSFERIDO''';
  END IF;
END $$;

-- AlterTable: Adicionar campo fluxoAtendimento na UnidadeSaude (condicional)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unidades_saude') THEN
    ALTER TABLE "unidades_saude"
    ADD COLUMN IF NOT EXISTS "fluxoAtendimento" "FluxoAtendimento" NOT NULL DEFAULT 'TRADICIONAL';
    CREATE INDEX IF NOT EXISTS "unidades_saude_fluxoAtendimento_idx" ON "unidades_saude"("fluxoAtendimento");
    COMMENT ON COLUMN "unidades_saude"."fluxoAtendimento" IS 'Tipo de fluxo de atendimento: TRADICIONAL (UPA/UBS sem ESF), ESF (UBS com ESF), MISTO (ambos)';
  END IF;
END $$;

-- AlterTable: fila_atendimento é drift (criada via db push) — condicional
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fila_atendimento') THEN
    ALTER TABLE "fila_atendimento"
    ADD COLUMN IF NOT EXISTS "classificacaoRisco" "ClassificacaoRisco",
    ADD COLUMN IF NOT EXISTS "dataClassificacaoRisco" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "queixaPrincipal" TEXT,
    ADD COLUMN IF NOT EXISTS "sinaisVitais" JSONB,
    ADD COLUMN IF NOT EXISTS "condutaAcolhimento" "CondutaAcolhimento",
    ADD COLUMN IF NOT EXISTS "dataAcolhimento" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "resolvidoAcolhimento" BOOLEAN NOT NULL DEFAULT false;

    CREATE INDEX IF NOT EXISTS "fila_atendimento_classificacaoRisco_idx" ON "fila_atendimento"("classificacaoRisco");
    CREATE INDEX IF NOT EXISTS "fila_atendimento_condutaAcolhimento_idx" ON "fila_atendimento"("condutaAcolhimento");
    CREATE INDEX IF NOT EXISTS "fila_atendimento_resolvidoAcolhimento_idx" ON "fila_atendimento"("resolvidoAcolhimento");
    COMMENT ON COLUMN "fila_atendimento"."classificacaoRisco" IS 'Classificação de Risco pelo Protocolo de Manchester (UPA)';
    COMMENT ON COLUMN "fila_atendimento"."condutaAcolhimento" IS 'Conduta definida no acolhimento (UBS)';
    COMMENT ON COLUMN "fila_atendimento"."resolvidoAcolhimento" IS 'Se o problema foi resolvido no próprio acolhimento';
  END IF;
END $$;
