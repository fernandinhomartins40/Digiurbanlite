-- ============================================================================
-- FASES 3/4 DO PLANO 2026-07-13 - ONDA 8 de tenantId (26 tabelas)
-- ============================================================================
-- Grupos:
--   - Catálogos/cadastros municipais (achado A4 da re-auditoria 2026-07-13):
--     especialidades, tipos, destinos TFD, espaços públicos, viaturas, guias,
--     programas, e-SUS etc. Eram GLOBAIS — CRUD de um município afetava todos.
--   - AlunoRota (junction transporte escolar): stats e mutações eram globais.
--   - FlowDefinition (achado A3 / Fase 4): fluxos do bot passam a ser POR
--     TENANT, com unicidade composta [tenantId, name] (o índice único global
--     de name é removido). Coordenado com o FlowDefinitionSeeder do Messages
--     Server (seed por tenant) e com o provisionamento de municípios.
--
-- Backfill: AlunoRota deriva da rota (rotas_escolares.tenantId); o restante
-- herda o tenant default (histórico do modo single-tenant — mesmo critério
-- das ondas 1-7).
--
-- RLS: todas entram na política tenant_isolation permissiva + FORCE (padrão
-- das migrations 20260708150000/20260710160000).
--
-- Idempotente e condicional por tabela (padrão das waves 5/6/7).

DO $wave8$
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
    'especialidades_medicas','destinos_tfd','especialidades_tfd','tipos_documento',
    'procedimentos_odonto','configuracoes_esus','transmissoes_esus',
    'conjuntos_habitacionais','programas_habitacionais',
    'espacos_publicos','parques_pracas','viaturas_seguranca','tipos_ocorrencia',
    'estabelecimentos_turisticos','tipos_estabelecimento_turistico','guias_turisticos',
    'modalidades_esportivas','tipos_atividade_cultural','cursos_profissionalizantes',
    'programas_ambientais','especies_arvore','tipos_producao_agricola','maquinas_agricolas',
    'tipos_obra_servico','alunos_rotas','flow_definitions'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS "tenantId" TEXT', t);
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I ("tenantId")', t || '_tenantId_idx', t);
    END IF;
  END LOOP;

  -- ── 2. Backfill derivado do dono quando há vínculo ─────────────────────
  -- AlunoRota herda o tenant da rota escolar (já escopada em onda anterior)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='alunos_rotas')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='rotas_escolares') THEN
    UPDATE alunos_rotas ar SET "tenantId" = r."tenantId"
      FROM rotas_escolares r WHERE ar."tenantId" IS NULL AND ar."rotaId" = r.id;
  END IF;

  -- ── 2b. Conversas/mensagens do Messages Server (Fase 5 do plano) ───────
  -- Criadas com tenantId NULL antes desta fase — derivar do cidadão
  -- participante; mensagens herdam da conversa; resíduo → default.
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='conversations')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='citizens') THEN
    UPDATE conversations c SET "tenantId" = ct."tenantId"
      FROM citizens ct
      WHERE c."tenantId" IS NULL AND c."participant1Type" = 'CITIZEN' AND c."participant1Id" = ct.id;
    UPDATE conversations c SET "tenantId" = ct."tenantId"
      FROM citizens ct
      WHERE c."tenantId" IS NULL AND c."participant2Type" = 'CITIZEN' AND c."participant2Id" = ct.id;
    UPDATE conversations SET "tenantId" = default_tenant WHERE "tenantId" IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='messages')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='conversations') THEN
    UPDATE messages m SET "tenantId" = c."tenantId"
      FROM conversations c
      WHERE m."tenantId" IS NULL AND m."conversationId" = c.id;
    UPDATE messages SET "tenantId" = default_tenant WHERE "tenantId" IS NULL;
  END IF;

  -- ── 3. Resíduo: tenant default (dados do modo single-tenant) ───────────
  FOREACH t IN ARRAY ARRAY[
    'especialidades_medicas','destinos_tfd','especialidades_tfd','tipos_documento',
    'procedimentos_odonto','configuracoes_esus','transmissoes_esus',
    'conjuntos_habitacionais','programas_habitacionais',
    'espacos_publicos','parques_pracas','viaturas_seguranca','tipos_ocorrencia',
    'estabelecimentos_turisticos','tipos_estabelecimento_turistico','guias_turisticos',
    'modalidades_esportivas','tipos_atividade_cultural','cursos_profissionalizantes',
    'programas_ambientais','especies_arvore','tipos_producao_agricola','maquinas_agricolas',
    'tipos_obra_servico','alunos_rotas','flow_definitions'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
      EXECUTE format('UPDATE %I SET "tenantId" = %L WHERE "tenantId" IS NULL', t, default_tenant);
    END IF;
  END LOOP;

  -- ── 4. FlowDefinition: unique global de name → composta [tenantId, name] ─
  -- (Fase 4: cada município tem seus próprios fluxos com os mesmos nomes.)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='flow_definitions') THEN
    -- índice único gerado pelo Prisma para `name @unique`
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='flow_definitions' AND indexname='flow_definitions_name_key') THEN
      EXECUTE 'DROP INDEX flow_definitions_name_key';
    END IF;
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS "flow_definitions_tenantId_name_key" ON flow_definitions ("tenantId", "name")';
  END IF;

  -- ── 4b. Uniques globais dos catálogos → compostas [tenantId, x] ────────
  -- (Sem isto, o 2º município não consegue ter o mesmo catálogo padrão.)
  -- DROP do índice único gerado pelo Prisma + CREATE da composta.
  DECLARE
    pair TEXT[];
  BEGIN
    FOREACH pair SLICE 1 IN ARRAY ARRAY[
      ARRAY['viaturas_seguranca','codigo'],
      ARRAY['tipos_obra_servico','nome'],
      ARRAY['especialidades_medicas','nome'],
      ARRAY['tipos_producao_agricola','nome'],
      ARRAY['maquinas_agricolas','identificacao'],
      ARRAY['especies_arvore','nomeComum'],
      ARRAY['tipos_estabelecimento_turistico','nome'],
      ARRAY['modalidades_esportivas','nome'],
      ARRAY['tipos_atividade_cultural','nome'],
      ARRAY['tipos_ocorrencia','nome'],
      ARRAY['cursos_profissionalizantes','nome'],
      ARRAY['programas_habitacionais','nome'],
      ARRAY['programas_ambientais','nome'],
      ARRAY['guias_turisticos','cpf'],
      ARRAY['guias_turisticos','cadastur'],
      ARRAY['tipos_documento','nome'],
      ARRAY['especialidades_tfd','nome']
    ] LOOP
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = pair[1] AND table_schema = 'public') THEN
        EXECUTE format('DROP INDEX IF EXISTS %I', pair[1] || '_' || pair[2] || '_key');
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I ("tenantId", %I)',
          pair[1] || '_tenantId_' || pair[2] || '_key', pair[1], pair[2]);
      END IF;
    END LOOP;
  END;

  -- DestinoTFD: composta [cidade,estado,hospital] → [tenantId,cidade,estado,hospital]
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='destinos_tfd') THEN
    DROP INDEX IF EXISTS "destinos_tfd_cidade_estado_hospital_key";
    CREATE UNIQUE INDEX IF NOT EXISTS "destinos_tfd_tenantId_cidade_estado_hospital_key"
      ON destinos_tfd ("tenantId", cidade, estado, hospital);
  END IF;

  -- ── 5. RLS: política tenant_isolation + FORCE nas tabelas da onda ──────
  FOREACH t IN ARRAY ARRAY[
    'especialidades_medicas','destinos_tfd','especialidades_tfd','tipos_documento',
    'procedimentos_odonto','configuracoes_esus','transmissoes_esus',
    'conjuntos_habitacionais','programas_habitacionais',
    'espacos_publicos','parques_pracas','viaturas_seguranca','tipos_ocorrencia',
    'estabelecimentos_turisticos','tipos_estabelecimento_turistico','guias_turisticos',
    'modalidades_esportivas','tipos_atividade_cultural','cursos_profissionalizantes',
    'programas_ambientais','especies_arvore','tipos_producao_agricola','maquinas_agricolas',
    'tipos_obra_servico','alunos_rotas','flow_definitions'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
      EXECUTE format($f$CREATE POLICY tenant_isolation ON %I USING (current_tenant_id() IS NULL OR current_tenant_id() = '__platform__' OR "tenantId" IS NULL OR "tenantId" = current_tenant_id()) WITH CHECK (current_tenant_id() IS NULL OR current_tenant_id() = '__platform__' OR "tenantId" IS NULL OR "tenantId" = current_tenant_id())$f$, t);
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $wave8$;
