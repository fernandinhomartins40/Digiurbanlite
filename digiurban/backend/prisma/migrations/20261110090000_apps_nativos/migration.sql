-- Apps nativos (2026-11-10): aparelhos Android/iOS que recebem avisos push (FCM / APNs),
-- consentimento do cidadão para o assistente com IA e denúncia de resposta do assistente

-- AlterTable
ALTER TABLE "citizens" ADD COLUMN IF NOT EXISTS "aiConsent" BOOLEAN;
ALTER TABLE "citizens" ADD COLUMN IF NOT EXISTS "aiConsentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "bot_answer_reports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "citizenId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_answer_reports_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bot_answer_reports_messageId_citizenId_key" ON "bot_answer_reports"("messageId", "citizenId");
CREATE INDEX "bot_answer_reports_tenantId_idx" ON "bot_answer_reports"("tenantId");
CREATE INDEX "bot_answer_reports_tenantId_status_idx" ON "bot_answer_reports"("tenantId", "status");

-- CreateTable
CREATE TABLE "native_push_devices" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "citizenId" TEXT,
    "platform" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "native_push_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "native_push_devices_token_key" ON "native_push_devices"("token");
CREATE INDEX "native_push_devices_userId_idx" ON "native_push_devices"("userId");
CREATE INDEX "native_push_devices_citizenId_idx" ON "native_push_devices"("citizenId");
CREATE INDEX "native_push_devices_tenantId_idx" ON "native_push_devices"("tenantId");

-- AddForeignKey
ALTER TABLE "native_push_devices" ADD CONSTRAINT "native_push_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "native_push_devices" ADD CONSTRAINT "native_push_devices_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['native_push_devices', 'bot_answer_reports'] LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
      EXECUTE format($f$CREATE POLICY tenant_isolation ON %I USING (current_tenant_id() IS NULL OR current_tenant_id() = '__platform__' OR "tenantId" IS NULL OR "tenantId" = current_tenant_id()) WITH CHECK (current_tenant_id() IS NULL OR current_tenant_id() = '__platform__' OR "tenantId" IS NULL OR "tenantId" = current_tenant_id())$f$, t);
    EXCEPTION
      WHEN insufficient_privilege THEN RAISE WARNING 'RLS não aplicado em % (sem privilégio)', t;
      WHEN undefined_function THEN RAISE WARNING 'current_tenant_id() ausente ao proteger %', t;
    END;
  END LOOP;
END $OUTER$;
