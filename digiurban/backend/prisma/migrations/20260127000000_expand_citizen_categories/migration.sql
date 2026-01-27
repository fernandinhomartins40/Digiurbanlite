-- ============================================================================
-- MIGRATION: EXPANSÃO COMPLETA DO SISTEMA DE CATEGORIZAÇÃO DE CIDADÃOS
-- ============================================================================
-- Data: 2026-01-27
-- Descrição: Adiciona histórico, relacionamentos, progressão, validade e auditoria
-- ============================================================================

-- ============================================================================
-- 1. ADICIONAR NOVOS CAMPOS À TABELA CitizenCategory
-- ============================================================================

-- Campos de relacionamento entre categorias
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "parentCategoryId" TEXT;
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "level" INTEGER DEFAULT 1;
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "prerequisiteCategories" TEXT[] DEFAULT '{}';
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "complementaryCategories" TEXT[] DEFAULT '{}';
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "conflictingCategories" TEXT[] DEFAULT '{}';

-- Campos de validade e renovação
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "hasValidity" BOOLEAN DEFAULT false;
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "validityDays" INTEGER;
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "requiresRenewal" BOOLEAN DEFAULT false;
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "renewalReminderDays" INTEGER DEFAULT 30;
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "autoDeactivateOnExpiry" BOOLEAN DEFAULT false;

-- Campos de progressão e gamificação
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "hasProgression" BOOLEAN DEFAULT false;
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "nextLevelCategory" TEXT;
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "progressionCriteria" JSONB;

-- Campos de metadata avançada
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "categoryType" TEXT DEFAULT 'STANDARD';
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "priority" INTEGER DEFAULT 5;
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN DEFAULT true;
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "requiresApproval" BOOLEAN DEFAULT false;
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "benefits" JSONB;
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "restrictions" JSONB;

-- ============================================================================
-- 2. ADICIONAR NOVOS CAMPOS À TABELA CitizenCategoryAssignment
-- ============================================================================

-- Campos de validade
ALTER TABLE "citizen_category_assignments" ADD COLUMN IF NOT EXISTS "validFrom" TIMESTAMP(3);
ALTER TABLE "citizen_category_assignments" ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP(3);
ALTER TABLE "citizen_category_assignments" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "citizen_category_assignments" ADD COLUMN IF NOT EXISTS "isExpired" BOOLEAN DEFAULT false;
ALTER TABLE "citizen_category_assignments" ADD COLUMN IF NOT EXISTS "lastRenewalDate" TIMESTAMP(3);
ALTER TABLE "citizen_category_assignments" ADD COLUMN IF NOT EXISTS "renewalCount" INTEGER DEFAULT 0;

-- Campos de progressão
ALTER TABLE "citizen_category_assignments" ADD COLUMN IF NOT EXISTS "level" INTEGER DEFAULT 1;
ALTER TABLE "citizen_category_assignments" ADD COLUMN IF NOT EXISTS "experiencePoints" INTEGER DEFAULT 0;
ALTER TABLE "citizen_category_assignments" ADD COLUMN IF NOT EXISTS "badges" JSONB DEFAULT '[]';
ALTER TABLE "citizen_category_assignments" ADD COLUMN IF NOT EXISTS "achievements" JSONB DEFAULT '[]';

-- Campos estatísticos
ALTER TABLE "citizen_category_assignments" ADD COLUMN IF NOT EXISTS "protocolCount" INTEGER DEFAULT 0;
ALTER TABLE "citizen_category_assignments" ADD COLUMN IF NOT EXISTS "lastProtocolDate" TIMESTAMP(3);
ALTER TABLE "citizen_category_assignments" ADD COLUMN IF NOT EXISTS "statistics" JSONB DEFAULT '{}';

-- Campos de auditoria expandida
ALTER TABLE "citizen_category_assignments" ADD COLUMN IF NOT EXISTS "activationCount" INTEGER DEFAULT 1;
ALTER TABLE "citizen_category_assignments" ADD COLUMN IF NOT EXISTS "deactivationCount" INTEGER DEFAULT 0;
ALTER TABLE "citizen_category_assignments" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- ============================================================================
-- 3. CRIAR TABELA: CitizenCategoryProtocolHistory
-- ============================================================================
-- Histórico completo de todos os protocolos que geraram/modificaram categorias

CREATE TABLE IF NOT EXISTS "citizen_category_protocol_history" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  -- Relacionamentos
  "assignmentId" TEXT NOT NULL,
  "protocolId" TEXT NOT NULL,
  "citizenId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,

  -- Dados do evento
  "eventType" TEXT NOT NULL, -- 'ASSIGNED', 'RENEWED', 'UPGRADED', 'REACTIVATED'
  "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Dados do protocolo
  "protocolNumber" TEXT,
  "moduleType" TEXT,
  "serviceName" TEXT,

  -- Metadata do evento
  "metadata" JSONB,

  -- Auditoria
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Índices
  CONSTRAINT "fk_protocol_history_assignment"
    FOREIGN KEY ("assignmentId")
    REFERENCES "citizen_category_assignments"("id")
    ON DELETE CASCADE,

  CONSTRAINT "fk_protocol_history_protocol"
    FOREIGN KEY ("protocolId")
    REFERENCES "protocols_simplified"("id")
    ON DELETE CASCADE,

  CONSTRAINT "fk_protocol_history_citizen"
    FOREIGN KEY ("citizenId")
    REFERENCES "citizens"("id")
    ON DELETE CASCADE,

  CONSTRAINT "fk_protocol_history_category"
    FOREIGN KEY ("categoryId")
    REFERENCES "citizen_categories"("id")
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_protocol_history_assignment" ON "citizen_category_protocol_history"("assignmentId");
CREATE INDEX IF NOT EXISTS "idx_protocol_history_protocol" ON "citizen_category_protocol_history"("protocolId");
CREATE INDEX IF NOT EXISTS "idx_protocol_history_citizen" ON "citizen_category_protocol_history"("citizenId");
CREATE INDEX IF NOT EXISTS "idx_protocol_history_category" ON "citizen_category_protocol_history"("categoryId");
CREATE INDEX IF NOT EXISTS "idx_protocol_history_event_type" ON "citizen_category_protocol_history"("eventType");
CREATE INDEX IF NOT EXISTS "idx_protocol_history_event_date" ON "citizen_category_protocol_history"("eventDate");

-- ============================================================================
-- 4. CRIAR TABELA: CitizenCategoryAuditLog
-- ============================================================================
-- Log completo de todas mudanças em categorias (ativação, desativação, etc)

CREATE TABLE IF NOT EXISTS "citizen_category_audit_log" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  -- Relacionamentos
  "assignmentId" TEXT NOT NULL,
  "citizenId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,

  -- Tipo de ação
  "action" TEXT NOT NULL, -- 'ASSIGNED', 'ACTIVATED', 'DEACTIVATED', 'RENEWED', 'UPGRADED', 'EXPIRED'
  "actionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Quem realizou a ação
  "performedBy" TEXT,
  "performedByType" TEXT, -- 'SYSTEM', 'ADMIN', 'CITIZEN'

  -- Dados da ação
  "reason" TEXT,
  "previousState" JSONB,
  "newState" JSONB,
  "metadata" JSONB,

  -- Auditoria
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_audit_log_assignment"
    FOREIGN KEY ("assignmentId")
    REFERENCES "citizen_category_assignments"("id")
    ON DELETE CASCADE,

  CONSTRAINT "fk_audit_log_citizen"
    FOREIGN KEY ("citizenId")
    REFERENCES "citizens"("id")
    ON DELETE CASCADE,

  CONSTRAINT "fk_audit_log_category"
    FOREIGN KEY ("categoryId")
    REFERENCES "citizen_categories"("id")
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_audit_log_assignment" ON "citizen_category_audit_log"("assignmentId");
CREATE INDEX IF NOT EXISTS "idx_audit_log_citizen" ON "citizen_category_audit_log"("citizenId");
CREATE INDEX IF NOT EXISTS "idx_audit_log_category" ON "citizen_category_audit_log"("categoryId");
CREATE INDEX IF NOT EXISTS "idx_audit_log_action" ON "citizen_category_audit_log"("action");
CREATE INDEX IF NOT EXISTS "idx_audit_log_action_date" ON "citizen_category_audit_log"("actionDate");

-- ============================================================================
-- 5. CRIAR TABELA: CitizenCategoryRelationship
-- ============================================================================
-- Relacionamentos explícitos entre categorias (hierarquia, dependências)

CREATE TABLE IF NOT EXISTS "citizen_category_relationships" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  -- Categorias relacionadas
  "sourceCategoryId" TEXT NOT NULL,
  "targetCategoryId" TEXT NOT NULL,

  -- Tipo de relacionamento
  "relationshipType" TEXT NOT NULL, -- 'PARENT', 'CHILD', 'PREREQUISITE', 'COMPLEMENTARY', 'CONFLICTING', 'UPGRADE'

  -- Configuração
  "isRequired" BOOLEAN DEFAULT false,
  "autoAssign" BOOLEAN DEFAULT false,
  "weight" INTEGER DEFAULT 1,
  "metadata" JSONB,

  -- Auditoria
  "active" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_relationship_source"
    FOREIGN KEY ("sourceCategoryId")
    REFERENCES "citizen_categories"("id")
    ON DELETE CASCADE,

  CONSTRAINT "fk_relationship_target"
    FOREIGN KEY ("targetCategoryId")
    REFERENCES "citizen_categories"("id")
    ON DELETE CASCADE,

  CONSTRAINT "unique_category_relationship"
    UNIQUE ("sourceCategoryId", "targetCategoryId", "relationshipType")
);

CREATE INDEX IF NOT EXISTS "idx_relationship_source" ON "citizen_category_relationships"("sourceCategoryId");
CREATE INDEX IF NOT EXISTS "idx_relationship_target" ON "citizen_category_relationships"("targetCategoryId");
CREATE INDEX IF NOT EXISTS "idx_relationship_type" ON "citizen_category_relationships"("relationshipType");

-- ============================================================================
-- 6. CRIAR TABELA: CitizenCategoryBadge
-- ============================================================================
-- Sistema de badges/conquistas para cidadãos

CREATE TABLE IF NOT EXISTS "citizen_category_badges" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  -- Relacionamento com categoria
  "categoryId" TEXT NOT NULL,

  -- Dados do badge
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "color" TEXT,

  -- Critérios para conquistar
  "criteria" JSONB NOT NULL,
  "requiredProtocolCount" INTEGER,
  "requiredExperiencePoints" INTEGER,
  "requiredDays" INTEGER,

  -- Configuração
  "isPublic" BOOLEAN DEFAULT true,
  "active" BOOLEAN DEFAULT true,
  "priority" INTEGER DEFAULT 5,

  -- Auditoria
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_badge_category"
    FOREIGN KEY ("categoryId")
    REFERENCES "citizen_categories"("id")
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_badge_category" ON "citizen_category_badges"("categoryId");
CREATE INDEX IF NOT EXISTS "idx_badge_active" ON "citizen_category_badges"("active");

-- ============================================================================
-- 7. ADICIONAR FOREIGN KEYS PARA NOVOS CAMPOS
-- ============================================================================

-- Adicionar FK para parentCategoryId
ALTER TABLE "citizen_categories"
  ADD CONSTRAINT "fk_category_parent"
  FOREIGN KEY ("parentCategoryId")
  REFERENCES "citizen_categories"("id")
  ON DELETE SET NULL;

-- ============================================================================
-- 8. CRIAR ÍNDICES ADICIONAIS
-- ============================================================================

CREATE INDEX IF NOT EXISTS "idx_category_parent" ON "citizen_categories"("parentCategoryId");
CREATE INDEX IF NOT EXISTS "idx_category_level" ON "citizen_categories"("level");
CREATE INDEX IF NOT EXISTS "idx_category_type" ON "citizen_categories"("categoryType");
CREATE INDEX IF NOT EXISTS "idx_category_has_validity" ON "citizen_categories"("hasValidity");
CREATE INDEX IF NOT EXISTS "idx_category_has_progression" ON "citizen_categories"("hasProgression");

CREATE INDEX IF NOT EXISTS "idx_assignment_expires_at" ON "citizen_category_assignments"("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_assignment_is_expired" ON "citizen_category_assignments"("isExpired");
CREATE INDEX IF NOT EXISTS "idx_assignment_level" ON "citizen_category_assignments"("level");
CREATE INDEX IF NOT EXISTS "idx_assignment_last_protocol" ON "citizen_category_assignments"("lastProtocolDate");

-- ============================================================================
-- 9. CRIAR VIEW: Categorias Vencidas/A Vencer
-- ============================================================================

CREATE OR REPLACE VIEW "citizen_categories_expiring" AS
SELECT
  cca.id,
  cca."citizenId",
  cca."categoryId",
  cc.name as "categoryName",
  cc.code as "categoryCode",
  cca."expiresAt",
  cca."isExpired",
  cca.active,
  CASE
    WHEN cca."expiresAt" IS NULL THEN NULL
    WHEN cca."expiresAt" < CURRENT_TIMESTAMP THEN 0
    ELSE EXTRACT(DAY FROM cca."expiresAt" - CURRENT_TIMESTAMP)::INTEGER
  END as "daysUntilExpiry"
FROM "citizen_category_assignments" cca
JOIN "citizen_categories" cc ON cc.id = cca."categoryId"
WHERE
  cca."expiresAt" IS NOT NULL
  AND cca.active = true
  AND (
    cca."isExpired" = true
    OR cca."expiresAt" < (CURRENT_TIMESTAMP + INTERVAL '30 days')
  );

-- ============================================================================
-- 10. CRIAR VIEW: Estatísticas de Categorias
-- ============================================================================

CREATE OR REPLACE VIEW "citizen_category_statistics" AS
SELECT
  cc.id as "categoryId",
  cc.code,
  cc.name,
  cc.department,
  COUNT(DISTINCT cca."citizenId") as "totalCitizens",
  COUNT(DISTINCT CASE WHEN cca.active = true THEN cca."citizenId" END) as "activeCitizens",
  COUNT(DISTINCT CASE WHEN cca."isExpired" = true THEN cca."citizenId" END) as "expiredCitizens",
  AVG(cca."protocolCount") as "avgProtocolsPerCitizen",
  SUM(cca."protocolCount") as "totalProtocols",
  MAX(cca."lastProtocolDate") as "lastActivity"
FROM "citizen_categories" cc
LEFT JOIN "citizen_category_assignments" cca ON cca."categoryId" = cc.id
WHERE cc.active = true
GROUP BY cc.id, cc.code, cc.name, cc.department;

-- ============================================================================
-- MIGRATION COMPLETA
-- ============================================================================
