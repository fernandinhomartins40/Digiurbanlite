-- ============================================================================
-- REGISTRY — MOTOR DE DADOS ORIENTADO A METADADOS (Fase F0)
-- ----------------------------------------------------------------------------
-- Migration ADITIVA e ISOLADA. Cria as 5 tabelas do Registry, o índice GIN no
-- JSONB canônico e estende a política de Row Level Security (multi-tenant).
-- Nenhuma tabela existente é alterada; nenhuma rota consome estas tabelas ainda.
-- Ver plano: PLANO-IMPLEMENTACAO-REGISTRY.md (F0).
--
-- IMPORTANTE: aplicar via MIGRATE_DATABASE_URL (owner). Em runtime a app usa a
-- role digiurban_app, sobre a qual o RLS abaixo passa a valer.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE "entity_types" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'EVENT',
    "department" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "materializesFrom" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entity_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_definitions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "entityTypeId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "validation" JSONB,
    "indexable" BOOLEAN NOT NULL DEFAULT false,
    "filterable" BOOLEAN NOT NULL DEFAULT false,
    "facetable" BOOLEAN NOT NULL DEFAULT false,
    "searchable" BOOLEAN NOT NULL DEFAULT false,
    "isMetric" BOOLEAN NOT NULL DEFAULT false,
    "aggregation" TEXT,
    "isPII" BOOLEAN NOT NULL DEFAULT false,
    "displayInTable" BOOLEAN NOT NULL DEFAULT false,
    "displayInCard" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "entityTypeId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sourceProtocolId" TEXT,
    "citizenId" TEXT,
    "naturalKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entity_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "record_indexes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "recordId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "valueText" TEXT,
    "valueNumber" DOUBLE PRECISION,
    "valueDate" TIMESTAMP(3),
    "valueBool" BOOLEAN,

    CONSTRAINT "record_indexes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_relations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "fromRecordId" TEXT NOT NULL,
    "toRecordId" TEXT NOT NULL,
    "relType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_relations_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- Índices e uniques
-- ---------------------------------------------------------------------------

-- entity_types
CREATE UNIQUE INDEX "entity_types_tenantId_code_key" ON "entity_types"("tenantId", "code");
CREATE INDEX "entity_types_tenantId_idx" ON "entity_types"("tenantId");
CREATE INDEX "entity_types_tenantId_kind_idx" ON "entity_types"("tenantId", "kind");

-- field_definitions
CREATE UNIQUE INDEX "field_definitions_tenantId_entityTypeId_key_key" ON "field_definitions"("tenantId", "entityTypeId", "key");
CREATE INDEX "field_definitions_tenantId_idx" ON "field_definitions"("tenantId");
CREATE INDEX "field_definitions_entityTypeId_idx" ON "field_definitions"("entityTypeId");

-- entity_records
CREATE INDEX "entity_records_tenantId_idx" ON "entity_records"("tenantId");
CREATE INDEX "entity_records_tenantId_entityTypeId_status_idx" ON "entity_records"("tenantId", "entityTypeId", "status");
CREATE INDEX "entity_records_tenantId_entityTypeId_naturalKey_idx" ON "entity_records"("tenantId", "entityTypeId", "naturalKey");
CREATE INDEX "entity_records_sourceProtocolId_idx" ON "entity_records"("sourceProtocolId");
CREATE INDEX "entity_records_citizenId_idx" ON "entity_records"("citizenId");

-- record_indexes
CREATE INDEX "record_indexes_recordId_idx" ON "record_indexes"("recordId");
CREATE INDEX "record_indexes_tenantId_fieldKey_valueText_idx" ON "record_indexes"("tenantId", "fieldKey", "valueText");
CREATE INDEX "record_indexes_tenantId_fieldKey_valueNumber_idx" ON "record_indexes"("tenantId", "fieldKey", "valueNumber");
CREATE INDEX "record_indexes_tenantId_fieldKey_valueDate_idx" ON "record_indexes"("tenantId", "fieldKey", "valueDate");
CREATE INDEX "record_indexes_tenantId_fieldKey_valueBool_idx" ON "record_indexes"("tenantId", "fieldKey", "valueBool");

-- entity_relations
CREATE UNIQUE INDEX "entity_relations_tenantId_fromRecordId_toRecordId_relType_key" ON "entity_relations"("tenantId", "fromRecordId", "toRecordId", "relType");
CREATE INDEX "entity_relations_tenantId_fromRecordId_relType_idx" ON "entity_relations"("tenantId", "fromRecordId", "relType");
CREATE INDEX "entity_relations_tenantId_toRecordId_relType_idx" ON "entity_relations"("tenantId", "toRecordId", "relType");

-- ---------------------------------------------------------------------------
-- Foreign keys
-- ---------------------------------------------------------------------------
ALTER TABLE "entity_types" ADD CONSTRAINT "entity_types_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "field_definitions" ADD CONSTRAINT "field_definitions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "field_definitions" ADD CONSTRAINT "field_definitions_entityTypeId_fkey" FOREIGN KEY ("entityTypeId") REFERENCES "entity_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "entity_records" ADD CONSTRAINT "entity_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "entity_records" ADD CONSTRAINT "entity_records_entityTypeId_fkey" FOREIGN KEY ("entityTypeId") REFERENCES "entity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "record_indexes" ADD CONSTRAINT "record_indexes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "record_indexes" ADD CONSTRAINT "record_indexes_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "entity_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "entity_relations" ADD CONSTRAINT "entity_relations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "entity_relations" ADD CONSTRAINT "entity_relations_fromRecordId_fkey" FOREIGN KEY ("fromRecordId") REFERENCES "entity_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "entity_relations" ADD CONSTRAINT "entity_relations_toRecordId_fkey" FOREIGN KEY ("toRecordId") REFERENCES "entity_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Índice GIN no JSONB canônico (Prisma não modela GIN — SQL bruto)
-- Habilita consulta ad-hoc de contenção (data @> '{...}') para campos que não
-- foram projetados em record_indexes. Rede de segurança para relatórios.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_entity_records_data_gin"
  ON "entity_records" USING GIN ("data" jsonb_path_ops);

-- ---------------------------------------------------------------------------
-- Row Level Security (mesma política PERMISSIVA das ondas multi-tenant).
-- current_tenant_id() já existe (criada na migration 20260708150000). Aqui só
-- habilitamos RLS e criamos a policy nas 5 tabelas novas. Idempotente.
-- ---------------------------------------------------------------------------
-- NOTA: em produção esta migration roda com credencial elevada
-- (MIGRATE_DATABASE_URL, dona das tabelas), então o ENABLE RLS/CREATE POLICY
-- abaixo aplica normalmente — igual às migrations 20260708150000 e ondas 7/8.
-- O handler de insufficient_privilege é uma rede de segurança: em ambientes
-- SEM a credencial elevada (ex.: dev sem RLS), a migration emite aviso e segue
-- em vez de abortar. Não altera o comportamento de produção.
DO $OUTER$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'entity_types',
    'field_definitions',
    'entity_records',
    'record_indexes',
    'entity_relations'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema='public') THEN
      BEGIN
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
        EXECUTE format($f$CREATE POLICY tenant_isolation ON %I USING (current_tenant_id() IS NULL OR current_tenant_id() = '__platform__' OR "tenantId" IS NULL OR "tenantId" = current_tenant_id()) WITH CHECK (current_tenant_id() IS NULL OR current_tenant_id() = '__platform__' OR "tenantId" IS NULL OR "tenantId" = current_tenant_id())$f$, t);
      EXCEPTION
        WHEN insufficient_privilege THEN
          RAISE WARNING 'RLS nao aplicado em % (sem privilegio; defina MIGRATE_DATABASE_URL com credencial owner)', t;
        WHEN undefined_function THEN
          RAISE WARNING 'current_tenant_id() ausente ao proteger % (migration RLS base ainda nao aplicada)', t;
      END;
    END IF;
  END LOOP;
END $OUTER$;
