-- ============================================================================
-- FASE E MULTI-TENANT - FORCE ROW LEVEL SECURITY (armar o RLS de verdade)
-- ============================================================================
-- ACHADO (smoke da Fase E): sem FORCE, o DONO da tabela ignora RLS — e a
-- aplicação conecta como o mesmo usuário que roda as migrations (dono). Ou
-- seja: a política tenant_isolation NUNCA se aplicava à própria app.
--
-- FORCE é seguro aqui porque a política é permissiva com GUC vazio
-- (current_tenant_id() IS NULL → passa tudo): migrations, seeds e operação
-- normal sem GUC seguem intactas; a política só filtra quando a app seta
-- app.tenant_id via withTenantTransaction.
--
-- ⚠️ LIMITAÇÃO OPERACIONAL: SUPERUSER ignora RLS SEMPRE (nem FORCE se aplica).
-- O POSTGRES_USER bootstrap da imagem (digiurban) é superuser — para o RLS
-- valer em produção, a app deve conectar com um role NÃO-superuser
-- (scripts/setup-app-role.sql cria `digiurban_app`; trocar o DATABASE_URL).
--
-- Idempotente: aplica FORCE em toda tabela que já tem a política.

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT DISTINCT tablename FROM pg_policies
    WHERE schemaname = 'public' AND policyname = 'tenant_isolation'
  LOOP
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
