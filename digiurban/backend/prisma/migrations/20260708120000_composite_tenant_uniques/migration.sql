-- ============================================================================
-- FASE 2 MULTI-TENANT — CONVERSÃO: uniques globais → compostas [tenantId, x]
-- ============================================================================
-- Destrava os CADASTROS do segundo município (achado B2 da auditoria):
--   users:    email, cpf, matricula   → por tenant
--   citizens: cpf                     → por tenant
--   departments: name, code           → por tenant
--   services_simplified: moduleType   → por tenant
--
-- Segurança em produção: 1 tenant e 0 tenantId NULL nas tabelas núcleo
-- (verificado 2026-07-08) — criar a composta nunca conflita com dados atuais.
-- Nota transição: linhas com tenantId NULL escapam da unicidade (NULLs são
-- distintos no Postgres); NOT NULL chega em onda futura.
-- Nenhuma FK referencia estas colunas (todas as relações usam id).
--
-- Robustez: cada unique antigo pode existir como CONSTRAINT ou como INDEX
-- (depende de como o banco foi construído — migrations vs db push) — o helper
-- trata os dois casos e é no-op se já não existir.

DO $$
DECLARE
  pair RECORD;
BEGIN
  FOR pair IN
    SELECT * FROM (VALUES
      ('users', 'users_email_key'),
      ('users', 'users_cpf_key'),
      ('users', 'users_matricula_key'),
      ('citizens', 'citizens_cpf_key'),
      ('departments', 'departments_name_key'),
      ('departments', 'departments_code_key'),
      ('services_simplified', 'services_simplified_moduleType_key')
    ) AS t(tbl, idx)
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = pair.tbl AND constraint_name = pair.idx
    ) THEN
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', pair.tbl, pair.idx);
    ELSIF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = pair.idx) THEN
      EXECUTE format('DROP INDEX %I', pair.idx);
    END IF;
  END LOOP;
END $$;

-- Uniques compostas por tenant
CREATE UNIQUE INDEX IF NOT EXISTS "users_tenantId_email_key" ON "users"("tenantId", "email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_tenantId_cpf_key" ON "users"("tenantId", "cpf");
CREATE UNIQUE INDEX IF NOT EXISTS "users_tenantId_matricula_key" ON "users"("tenantId", "matricula");
CREATE UNIQUE INDEX IF NOT EXISTS "citizens_tenantId_cpf_key" ON "citizens"("tenantId", "cpf");
CREATE UNIQUE INDEX IF NOT EXISTS "departments_tenantId_name_key" ON "departments"("tenantId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "departments_tenantId_code_key" ON "departments"("tenantId", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "services_simplified_tenantId_moduleType_key" ON "services_simplified"("tenantId", "moduleType");
