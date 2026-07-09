-- ============================================================================
-- FASE 2 MULTI-TENANT - NOT NULL em tenantId (tabelas nucleo)
-- ============================================================================
-- Aplica NOT NULL apenas nas 5 tabelas nucleo, onde 100% dos dados sao de
-- municipio e o backfill das ondas 1 garante preenchimento. Condicional: so
-- aplica se NAO houver linhas com tenantId NULL (nao quebra deploy se sobrou
-- NULL; nesse caso mantem nullable e loga). Tabelas de plataforma e filhas
-- seguem nullable (NULLs legitimos existem).

DO $$
DECLARE
  t TEXT;
  nulls INT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','citizens','departments','protocols_simplified','services_simplified'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'tenantId') THEN
      EXECUTE format('SELECT count(*) FROM %I WHERE "tenantId" IS NULL', t) INTO nulls;
      IF nulls = 0 THEN
        EXECUTE format('ALTER TABLE %I ALTER COLUMN "tenantId" SET NOT NULL', t);
        RAISE NOTICE 'NOT NULL aplicado em %', t;
      ELSE
        RAISE NOTICE 'PULADO % - % linhas com tenantId NULL', t, nulls;
      END IF;
    END IF;
  END LOOP;
END $$;
