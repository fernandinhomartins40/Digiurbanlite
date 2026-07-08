-- ============================================================================
-- FASE 2 MULTI-TENANT — ONDA 5: tenantId em 56 tabelas-raiz de módulos
-- (saúde, educação, assistência social, organograma, agenda, categorias,
--  certificados, chamados)
-- ============================================================================
-- Fecha o vazamento cross-tenant nos módulos: sem a coluna, a extension não
-- filtra — um admin do município B veria dados do A nesses domínios.
-- Padrão das ondas 1-4: coluna nullable → FK → backfill p/ tenant default
-- (produção é single-tenant; todos os dados pertencem ao default) → índice.
-- Condicional por tabela (drift de db push pode fazer alguma faltar — lição
-- da wave3/audit_logs).
--
-- Conversões de unique global → composta [tenantId, x] nesta onda:
--   turnos_trabalho.nome, turmas.codigo, matriculas.numeroMatricula,
--   professores.cpf, programas_sociais.nome, citizen_categories.code,
--   admin_tickets.number (sequência CH-YYYY-N gerada por findFirst escopado —
--   sem a composta, o 2º tenant colidiria no primeiro chamado).
-- ProtocolSimplified.number permanece global: a geração usa $queryRaw (máximo
-- global) — sem risco de colisão; escopar a sequência fica para onda futura.

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'unidades_saude',
    'agendas_medicas',
    'consultas_agendadas',
    'atendimentos_medicos',
    'consultas_medicas',
    'atendimentos_odontologicos',
    'acompanhamento_pre_natal',
    'visitas_domiciliares',
    'prescricoes',
    'exames_solicitados',
    'atestados',
    'encaminhamentos',
    'medicamentos',
    'estoque_medicamentos',
    'dispensacao_medicamentos',
    'lote_medicamento',
    'transferencia_estoque',
    'alerta_estoque',
    'solicitacoes_tfd',
    'viagens_tfd',
    'veiculos_tfd',
    'motoristas_tfd',
    'equipes_saude',
    'microareas',
    'fila_atendimento',
    'escutas_iniciais',
    'triagens_enfermagem',
    'atividades_coletivas',
    'configuracoes_agenda',
    'salas_consultorios',
    'turnos_trabalho',
    'configuracoes_atendimento',
    'unidades_educacao',
    'inscricoes_matricula',
    'matriculas',
    'turmas',
    'veiculos_escolares',
    'rotas_escolares',
    'professores',
    'unidades_cras',
    'programas_sociais',
    'cadunico_familias',
    'inscricoes_programas_sociais',
    'organizational_units',
    'positions',
    'functions',
    'employee_assignments',
    'teams',
    'agenda_events',
    'central_calendars',
    'central_calendar_events',
    'citizen_categories',
    'digital_certificates',
    'external_documents',
    'certificate_requests',
    'admin_tickets'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t) THEN
      -- a) coluna
      EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS "tenantId" TEXT', t);
      -- b) FK
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = t || '_tenantId_fkey'
      ) THEN
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE', t, t || '_tenantId_fkey');
      END IF;
      -- c) backfill
      IF EXISTS (SELECT 1 FROM "tenants" WHERE "id" = 'tenant-default') THEN
        EXECUTE format('UPDATE %I SET "tenantId" = ''tenant-default'' WHERE "tenantId" IS NULL', t);
      END IF;
      -- d) índice
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I ("tenantId")', t || '_tenantId_idx', t);
    END IF;
  END LOOP;
END $$;

-- ===== Conversões de unique (constraint OU index, idempotente) =====
DO $$
DECLARE
  pair RECORD;
BEGIN
  FOR pair IN
    SELECT * FROM (VALUES
      ('turnos_trabalho', 'turnos_trabalho_nome_key'),
      ('turmas', 'turmas_codigo_key'),
      ('matriculas', 'matriculas_numeroMatricula_key'),
      ('professores', 'professores_cpf_key'),
      ('programas_sociais', 'programas_sociais_nome_key'),
      ('citizen_categories', 'citizen_categories_code_key'),
      ('admin_tickets', 'admin_tickets_number_key')
    ) AS x(tbl, idx)
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = pair.tbl) THEN
      IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = pair.tbl AND constraint_name = pair.idx) THEN
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', pair.tbl, pair.idx);
      ELSIF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = pair.idx) THEN
        EXECUTE format('DROP INDEX %I', pair.idx);
      END IF;
    END IF;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "turnos_trabalho_tenantId_nome_key" ON "turnos_trabalho"("tenantId", "nome");
CREATE UNIQUE INDEX IF NOT EXISTS "turmas_tenantId_codigo_key" ON "turmas"("tenantId", "codigo");
CREATE UNIQUE INDEX IF NOT EXISTS "matriculas_tenantId_numeroMatricula_key" ON "matriculas"("tenantId", "numeroMatricula");
CREATE UNIQUE INDEX IF NOT EXISTS "professores_tenantId_cpf_key" ON "professores"("tenantId", "cpf");
CREATE UNIQUE INDEX IF NOT EXISTS "programas_sociais_tenantId_nome_key" ON "programas_sociais"("tenantId", "nome");
CREATE UNIQUE INDEX IF NOT EXISTS "citizen_categories_tenantId_code_key" ON "citizen_categories"("tenantId", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "admin_tickets_tenantId_number_key" ON "admin_tickets"("tenantId", "number");
