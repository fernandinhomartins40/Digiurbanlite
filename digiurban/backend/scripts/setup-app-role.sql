-- ============================================================================
-- ROLE DE APLICAÇÃO NÃO-SUPERUSER (Fase E Multi-Tenant — armar o RLS)
-- ============================================================================
-- SUPERUSER ignora RLS incondicionalmente. Para a política tenant_isolation
-- valer para a própria aplicação, ela deve conectar com este role.
--
-- Uso (como superuser, uma vez por ambiente):
--   psql "$DATABASE_URL" -v app_password='SENHA_FORTE' -f scripts/setup-app-role.sql
-- Depois trocar o DATABASE_URL da app para:
--   postgresql://digiurban_app:SENHA_FORTE@postgres:5432/digiurban
--
-- Migrations (prisma migrate deploy) CONTINUAM rodando com o usuário
-- superuser/dono — só a app muda de credencial.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'digiurban_app') THEN
    EXECUTE format('CREATE ROLE digiurban_app LOGIN PASSWORD %L', current_setting('app.role_password', true));
  END IF;
END $$;

-- Senha via -v app_password=... (psql converte para GUC não; então:)
-- Se preferir, defina manualmente:
--   ALTER ROLE digiurban_app PASSWORD 'SENHA_FORTE';

GRANT USAGE ON SCHEMA public TO digiurban_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO digiurban_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO digiurban_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO digiurban_app;

-- Objetos criados por migrations futuras herdam os grants:
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO digiurban_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO digiurban_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO digiurban_app;
