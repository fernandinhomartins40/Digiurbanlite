-- ASSISTENCIA REMOTA (2026-09-15)
-- Trilha de auditoria das sessoes de co-browsing somente-visualizacao.
-- O conteudo da tela NUNCA e persistido aqui: trafega so em memoria via
-- WebSocket. Esta tabela guarda QUEM observou QUEM, QUANDO e sob qual
-- consentimento — exigencia de LGPD, ja que a tela assistida pode exibir
-- dado pessoal de cidadao.

CREATE TABLE IF NOT EXISTS "remote_assist_sessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "operatorId" TEXT NOT NULL,
    "operatorName" TEXT NOT NULL,
    "operatorEmail" TEXT NOT NULL,
    "assistedUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "motivo" TEXT,
    "paginaInicial" TEXT,
    "solicitadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aceitaEm" TIMESTAMP(3),
    "encerradaEm" TIMESTAMP(3),
    "encerradaPor" TEXT,
    "eventosEnviados" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_assist_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "remote_assist_sessions_tenantId_idx"
    ON "remote_assist_sessions"("tenantId");
CREATE INDEX IF NOT EXISTS "remote_assist_sessions_assistedUserId_status_idx"
    ON "remote_assist_sessions"("assistedUserId", "status");
CREATE INDEX IF NOT EXISTS "remote_assist_sessions_operatorId_idx"
    ON "remote_assist_sessions"("operatorId");
CREATE INDEX IF NOT EXISTS "remote_assist_sessions_status_solicitadaEm_idx"
    ON "remote_assist_sessions"("status", "solicitadaEm");

-- FKs criadas de forma idempotente: ADD CONSTRAINT nao aceita IF NOT EXISTS no
-- Postgres, entao o DO $$ evita o erro 42710 em reexecucao (licao das migrations
-- que quebraram o deploy em 2026-09-15).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'remote_assist_sessions_tenantId_fkey'
  ) THEN
    ALTER TABLE "remote_assist_sessions"
      ADD CONSTRAINT "remote_assist_sessions_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'remote_assist_sessions_assistedUserId_fkey'
  ) THEN
    ALTER TABLE "remote_assist_sessions"
      ADD CONSTRAINT "remote_assist_sessions_assistedUserId_fkey"
      FOREIGN KEY ("assistedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
