-- ============================================================================
-- FASE E MULTI-TENANT - ONDA 7 de tenantId (30 tabelas)
-- ============================================================================
-- Grupos: sessão/credencial (4), família/privacidade (3), biometria facial
-- LGPD (5), analytics/BI (13), workflow (5).
--
-- Backfill: deriva do REGISTRO DONO quando há vínculo (userId/citizenId/
-- serviceId/identityId/...); resíduo herda o tenant default (histórico do modo
-- single-tenant — mesmo critério das ondas 1-6).
--
-- RLS: as 30 tabelas entram na política tenant_isolation (mesma política
-- permissiva das demais — endurecimento fica para o gate da Fase H).
--
-- Fora desta onda (decisão documentada): FlowDefinition/BotAnalytics/
-- MessageTemplate — escopar o bot exige mudanças coordenadas no Messages
-- Server (seeder por tenant, unique composta [tenantId, name]); metade do
-- trabalho aqui quebraria o admin de fluxos sem ganhar isolamento.
--
-- Idempotente e condicional por tabela (padrão das waves 5/6).

DO $wave7$
DECLARE
  t TEXT;
  default_tenant TEXT;
BEGIN
  SELECT id INTO default_tenant FROM tenants ORDER BY "createdAt" ASC LIMIT 1;
  IF default_tenant IS NULL THEN
    default_tenant := 'tenant-default';
  END IF;

  -- ── 1. Coluna + índice em todas as tabelas da onda ─────────────────────
  FOREACH t IN ARRAY ARRAY[
    'user_sessions','password_reset_tokens','push_subscriptions','notification_preferences',
    'family_compositions','family_invites','citizen_privacy_settings',
    'face_enrollments','face_embeddings','face_recognition_events','face_devices','face_zones',
    'analytics','protocol_metrics','service_metrics','protocol_bottlenecks','kpis','reports',
    'report_executions','dashboards','alerts','alert_triggers','metric_cache','benchmarks','predictions',
    'service_workflows','module_workflows','workflow_definitions','workflow_instances','workflow_history'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS "tenantId" TEXT', t);
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I ("tenantId")', t || '_tenantId_idx', t);
    END IF;
  END LOOP;

  -- ── 2. Backfill derivado do dono (só linhas ainda NULL) ────────────────
  -- Sessão/credencial
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user_sessions') THEN
    UPDATE user_sessions s SET "tenantId" = u."tenantId"
      FROM users u WHERE s."tenantId" IS NULL AND s."userId" = u.id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='password_reset_tokens') THEN
    UPDATE password_reset_tokens p SET "tenantId" = u."tenantId"
      FROM users u WHERE p."tenantId" IS NULL AND p."userId" IS NOT NULL AND p."userId" = u.id;
    UPDATE password_reset_tokens p SET "tenantId" = c."tenantId"
      FROM citizens c WHERE p."tenantId" IS NULL AND p."citizenId" IS NOT NULL AND p."citizenId" = c.id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='push_subscriptions') THEN
    UPDATE push_subscriptions p SET "tenantId" = u."tenantId"
      FROM users u WHERE p."tenantId" IS NULL AND p."userId" IS NOT NULL AND p."userId" = u.id;
    UPDATE push_subscriptions p SET "tenantId" = c."tenantId"
      FROM citizens c WHERE p."tenantId" IS NULL AND p."citizenId" IS NOT NULL AND p."citizenId" = c.id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notification_preferences') THEN
    UPDATE notification_preferences p SET "tenantId" = u."tenantId"
      FROM users u WHERE p."tenantId" IS NULL AND p."userId" IS NOT NULL AND p."userId" = u.id;
    UPDATE notification_preferences p SET "tenantId" = c."tenantId"
      FROM citizens c WHERE p."tenantId" IS NULL AND p."citizenId" IS NOT NULL AND p."citizenId" = c.id;
  END IF;

  -- Família / privacidade (dono = cidadão titular)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='family_compositions') THEN
    UPDATE family_compositions f SET "tenantId" = c."tenantId"
      FROM citizens c WHERE f."tenantId" IS NULL AND f."headId" = c.id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='family_invites') THEN
    UPDATE family_invites f SET "tenantId" = c."tenantId"
      FROM citizens c WHERE f."tenantId" IS NULL AND f."headId" = c.id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='citizen_privacy_settings') THEN
    UPDATE citizen_privacy_settings p SET "tenantId" = c."tenantId"
      FROM citizens c WHERE p."tenantId" IS NULL AND p."citizenId" = c.id;
  END IF;

  -- Biometria facial (identidade → depois dispositivo; ordem importa)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='face_devices') THEN
    UPDATE face_devices d SET "tenantId" = ue."tenantId"
      FROM unidades_educacao ue
      WHERE d."tenantId" IS NULL AND d."unidadeEducacaoId" IS NOT NULL AND d."unidadeEducacaoId" = ue.id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='face_enrollments') THEN
    UPDATE face_enrollments e SET "tenantId" = i."tenantId"
      FROM face_recognition_identities i WHERE e."tenantId" IS NULL AND e."identityId" = i.id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='face_embeddings') THEN
    UPDATE face_embeddings e SET "tenantId" = i."tenantId"
      FROM face_recognition_identities i WHERE e."tenantId" IS NULL AND e."identityId" = i.id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='face_recognition_events') THEN
    UPDATE face_recognition_events e SET "tenantId" = i."tenantId"
      FROM face_recognition_identities i
      WHERE e."tenantId" IS NULL AND e."identityId" IS NOT NULL AND e."identityId" = i.id;
    UPDATE face_recognition_events e SET "tenantId" = d."tenantId"
      FROM face_devices d
      WHERE e."tenantId" IS NULL AND e."deviceId" IS NOT NULL AND e."deviceId" = d.id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='face_zones') THEN
    UPDATE face_zones z SET "tenantId" = d."tenantId"
      FROM face_devices d WHERE z."tenantId" IS NULL AND z."deviceId" = d.id;
  END IF;

  -- Analytics/BI e workflow com dono derivável
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='service_metrics') THEN
    UPDATE service_metrics m SET "tenantId" = s."tenantId"
      FROM services_simplified s WHERE m."tenantId" IS NULL AND m."serviceId" = s.id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='service_workflows') THEN
    UPDATE service_workflows w SET "tenantId" = s."tenantId"
      FROM services_simplified s WHERE w."tenantId" IS NULL AND w."serviceId" = s.id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='workflow_instances') THEN
    UPDATE workflow_instances w SET "tenantId" = c."tenantId"
      FROM citizens c WHERE w."tenantId" IS NULL AND w."citizenId" IS NOT NULL AND w."citizenId" = c.id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='workflow_history') THEN
    UPDATE workflow_history h SET "tenantId" = w."tenantId"
      FROM workflow_instances w WHERE h."tenantId" IS NULL AND h."instanceId" = w.id;
  END IF;

  -- ── 3. Resíduo → tenant default (histórico single-tenant) ──────────────
  FOREACH t IN ARRAY ARRAY[
    'user_sessions','password_reset_tokens','push_subscriptions','notification_preferences',
    'family_compositions','family_invites','citizen_privacy_settings',
    'face_enrollments','face_embeddings','face_recognition_events','face_devices','face_zones',
    'analytics','protocol_metrics','service_metrics','protocol_bottlenecks','kpis','reports',
    'report_executions','dashboards','alerts','alert_triggers','metric_cache','benchmarks','predictions',
    'service_workflows','module_workflows','workflow_definitions','workflow_instances','workflow_history'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
      EXECUTE format('UPDATE %I SET "tenantId" = %L WHERE "tenantId" IS NULL', t, default_tenant);
    END IF;
  END LOOP;

  -- ── 4. RLS (mesma política permissiva das ondas anteriores) ────────────
  FOREACH t IN ARRAY ARRAY[
    'user_sessions','password_reset_tokens','push_subscriptions','notification_preferences',
    'family_compositions','family_invites','citizen_privacy_settings',
    'face_enrollments','face_embeddings','face_recognition_events','face_devices','face_zones',
    'analytics','protocol_metrics','service_metrics','protocol_bottlenecks','kpis','reports',
    'report_executions','dashboards','alerts','alert_triggers','metric_cache','benchmarks','predictions',
    'service_workflows','module_workflows','workflow_definitions','workflow_instances','workflow_history'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
      EXECUTE format($f$CREATE POLICY tenant_isolation ON %I USING (current_tenant_id() IS NULL OR current_tenant_id() = '__platform__' OR "tenantId" IS NULL OR "tenantId" = current_tenant_id()) WITH CHECK (current_tenant_id() IS NULL OR current_tenant_id() = '__platform__' OR "tenantId" IS NULL OR "tenantId" = current_tenant_id())$f$, t);
    END IF;
  END LOOP;
END $wave7$;
