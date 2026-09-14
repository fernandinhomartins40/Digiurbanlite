-- ============================================================================
-- REPARO DE DRIFT: tabelas de canais oficiais (broadcast)
-- ============================================================================
-- PROBLEMA (medido na VPS em 2026-09-13, docs/VPS-OPTIMIZATION-AUDIT.md):
-- o log do PostgreSQL registrava, 1x por minuto, sem parar:
--
--   ERROR: relation "public.channel_messages" does not exist
--
-- Origem: o setInterval de 60s em ultrazend-messages-server/src/index.ts
-- consulta channelMessage.findMany() para despachar broadcasts agendados.
--
-- Levantamento do banco de produção:
--   - existe        : official_channels
--   - FALTAM        : channel_messages, channel_subscriptions, channel_deliveries
--   - enums presentes: MessageContentType, BroadcastStatus, MessageStatus,
--                      ChannelSubscriptionStatus
--   - a migration 20260106023614_consolidated_with_messages está marcada como
--     finished=true, mas estas 3 tabelas não existem — logo ela foi marcada
--     como aplicada (resolve --applied) sem ter criado tudo. Por isso o reparo
--     precisa ser uma migration NOVA, e não a correção da antiga.
--
-- Criar apenas channel_messages não bastaria: ChannelService.deliverBroadcast()
-- também toca channel_deliveries e channel_subscriptions — trocaríamos um
-- P2021 por outro.
--
-- Multi-tenant: no schema.prisma, channel_subscriptions e channel_deliveries
-- TÊM tenantId (ondas 6) e channel_messages NÃO tem (herda o tenant via
-- channelId → official_channels). A wave6 (20260708140000) já foi aplicada e
-- seus blocos são `IF EXISTS (tabela)`, portanto não voltará a rodar para estas
-- tabelas: as colunas tenantId, FKs, índices e as policies de RLS precisam ser
-- criadas AQUI, no mesmo padrão do loop de 20260708150000_row_level_security.
--
-- Idempotente de ponta a ponta (IF NOT EXISTS / DO blocks): pode rodar em
-- bancos onde parte dos objetos já exista, sem tocar em dados existentes.
-- Nenhum DROP, nenhum DELETE — só criação.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) TABELAS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "channel_messages" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "contentType" "MessageContentType" NOT NULL DEFAULT 'TEXT',
    "attachments" JSONB,
    "scheduledFor" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "status" "BroadcastStatus" NOT NULL DEFAULT 'DRAFT',
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "channel_messages_pkey" PRIMARY KEY ("id")
);

-- tenantId já embutido (a wave6 não voltará a rodar para esta tabela)
CREATE TABLE IF NOT EXISTS "channel_subscriptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "channelId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "status" "ChannelSubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "notifyInApp" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT false,
    "notifySMS" BOOLEAN NOT NULL DEFAULT false,
    "notifyPush" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "channel_deliveries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "messageId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'QUEUED',
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_deliveries_pkey" PRIMARY KEY ("id")
);

-- Bancos onde as tabelas já existissem SEM a coluna (defensivo)
ALTER TABLE "channel_subscriptions" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "channel_deliveries"    ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- ---------------------------------------------------------------------------
-- 2) ÍNDICES (mesmos nomes da migration consolidada — o Prisma compara por nome)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "channel_messages_channelId_publishedAt_idx" ON "channel_messages"("channelId", "publishedAt");
CREATE INDEX IF NOT EXISTS "channel_messages_status_scheduledFor_idx"   ON "channel_messages"("status", "scheduledFor");
CREATE INDEX IF NOT EXISTS "channel_messages_authorId_idx"              ON "channel_messages"("authorId");

CREATE INDEX IF NOT EXISTS "channel_subscriptions_citizenId_status_idx" ON "channel_subscriptions"("citizenId", "status");
CREATE INDEX IF NOT EXISTS "channel_subscriptions_channelId_status_idx" ON "channel_subscriptions"("channelId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "channel_subscriptions_channelId_citizenId_key" ON "channel_subscriptions"("channelId", "citizenId");
CREATE INDEX IF NOT EXISTS "channel_subscriptions_tenantId_idx"         ON "channel_subscriptions"("tenantId");

CREATE INDEX IF NOT EXISTS "channel_deliveries_messageId_status_idx"  ON "channel_deliveries"("messageId", "status");
CREATE INDEX IF NOT EXISTS "channel_deliveries_citizenId_status_idx"  ON "channel_deliveries"("citizenId", "status");
CREATE INDEX IF NOT EXISTS "channel_deliveries_status_queuedAt_idx"   ON "channel_deliveries"("status", "queuedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "channel_deliveries_messageId_citizenId_key" ON "channel_deliveries"("messageId", "citizenId");
CREATE INDEX IF NOT EXISTS "channel_deliveries_tenantId_idx"          ON "channel_deliveries"("tenantId");

-- ---------------------------------------------------------------------------
-- 3) FOREIGN KEYS (idempotentes: ADD CONSTRAINT não aceita IF NOT EXISTS)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                  WHERE constraint_name = 'channel_messages_channelId_fkey') THEN
    ALTER TABLE "channel_messages" ADD CONSTRAINT "channel_messages_channelId_fkey"
      FOREIGN KEY ("channelId") REFERENCES "official_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                  WHERE constraint_name = 'channel_subscriptions_channelId_fkey') THEN
    ALTER TABLE "channel_subscriptions" ADD CONSTRAINT "channel_subscriptions_channelId_fkey"
      FOREIGN KEY ("channelId") REFERENCES "official_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                  WHERE constraint_name = 'channel_deliveries_messageId_fkey') THEN
    ALTER TABLE "channel_deliveries" ADD CONSTRAINT "channel_deliveries_messageId_fkey"
      FOREIGN KEY ("messageId") REFERENCES "channel_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                  WHERE constraint_name = 'channel_deliveries_subscriptionId_fkey') THEN
    ALTER TABLE "channel_deliveries" ADD CONSTRAINT "channel_deliveries_subscriptionId_fkey"
      FOREIGN KEY ("subscriptionId") REFERENCES "channel_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- FKs de tenant (padrão das ondas multi-tenant: ON DELETE SET NULL).
-- Só cria se a tabela "tenants" existir — bancos pré-multi-tenant não a têm.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'channel_subscriptions_tenantId_fkey') THEN
      ALTER TABLE "channel_subscriptions" ADD CONSTRAINT "channel_subscriptions_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'channel_deliveries_tenantId_fkey') THEN
      ALTER TABLE "channel_deliveries" ADD CONSTRAINT "channel_deliveries_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4) ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
-- channel_subscriptions e channel_deliveries constam da lista de tabelas
-- escopadas em 20260708150000_row_level_security. Como aquela migration já
-- rodou (e seus blocos são IF EXISTS), as policies precisam ser armadas aqui,
-- com EXATAMENTE a mesma expressão — divergir criaria dois regimes de
-- isolamento diferentes no mesmo banco.
--
-- channel_messages fica FORA de propósito: não tem coluna tenantId (o isolamento
-- vem de channelId → official_channels, que é escopada e tem policy própria).
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  -- current_tenant_id() é criada pela migration de RLS; sem ela, não há o que armar.
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_tenant_id') THEN
    RAISE NOTICE 'current_tenant_id() ausente — RLS nao armado para tabelas de canal';
    RETURN;
  END IF;

  FOREACH t IN ARRAY ARRAY['channel_subscriptions', 'channel_deliveries'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
      EXECUTE format($f$CREATE POLICY tenant_isolation ON %I USING (current_tenant_id() IS NULL OR current_tenant_id() = '__platform__' OR "tenantId" IS NULL OR "tenantId" = current_tenant_id()) WITH CHECK (current_tenant_id() IS NULL OR current_tenant_id() = '__platform__' OR "tenantId" IS NULL OR "tenantId" = current_tenant_id())$f$, t);
    END IF;
  END LOOP;
END $OUTER$;
