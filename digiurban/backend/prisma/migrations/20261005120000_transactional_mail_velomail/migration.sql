-- E-mail transacional pelo VeloMail (o servidor de e-mail próprio foi desligado)
CREATE TABLE "transactional_mail_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "fromEmail" TEXT NOT NULL DEFAULT 'nao-responda@notificacoes.digiurban.com.br',
    "fromName" TEXT NOT NULL DEFAULT 'DigiUrban',
    "apiBaseUrl" TEXT NOT NULL DEFAULT 'https://www.velomail.com.br/api',
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactional_mail_settings_pkey" PRIMARY KEY ("id")
);
INSERT INTO "transactional_mail_settings" ("id") VALUES ('singleton') ON CONFLICT DO NOTHING;

CREATE TABLE "tenant_mail_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "senderName" TEXT,
    "replyTo" TEXT,
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_mail_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tenant_mail_settings_tenantId_key" ON "tenant_mail_settings"("tenantId");
CREATE INDEX "tenant_mail_settings_tenantId_idx" ON "tenant_mail_settings"("tenantId");

-- busca do status pelo retorno do VeloMail e lista de enviados por município
CREATE INDEX IF NOT EXISTS "emails_tenantId_createdAt_idx" ON "emails"("tenantId", "createdAt");

DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['tenant_mail_settings'] LOOP
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
