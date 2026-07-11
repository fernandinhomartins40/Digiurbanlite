-- ============================================================================
-- FASE E MULTI-TENANT - NOT NULL em tenantId (lote 2: família de protocolo)
-- ============================================================================
-- Estende o lote 1 (20260708160000: users, citizens, departments, protocols,
-- services) para as tabelas 100% municipais escritas exclusivamente sob
-- contexto de tenant (a extension sempre carimba; o backfill das ondas 2/4
-- garante o histórico).
--
-- FICAM NULLABLE deliberadamente: audit_logs e notifications (eventos de
-- PLATAFORMA têm tenantId NULL por semântica), document_templates (pode ser
-- seedado pela plataforma) e todas as tabelas com escrita fora de contexto.
--
-- Condicional: só aplica se NÃO houver linhas NULL (não quebra deploy; loga e
-- pula — reexecutar após corrigir o resíduo).

DO $$
DECLARE
  t TEXT;
  nulls INT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'protocol_history_simplified',
    'protocol_evaluations_simplified',
    'protocol_sla',
    'protocol_documents',
    'protocol_interactions',
    'protocol_pendings',
    'protocol_stages',
    'protocol_data_fields',
    'citizen_documents',
    'generated_documents'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'tenantId') THEN
      EXECUTE format('SELECT count(*) FROM %I WHERE "tenantId" IS NULL', t) INTO nulls;
      IF nulls = 0 THEN
        EXECUTE format('ALTER TABLE %I ALTER COLUMN "tenantId" SET NOT NULL', t);
        RAISE NOTICE 'NOT NULL aplicado em %', t;
      ELSE
        RAISE NOTICE 'PULADO % - % linhas com tenantId NULL (corrigir e reexecutar)', t, nulls;
      END IF;
    END IF;
  END LOOP;
END $$;
