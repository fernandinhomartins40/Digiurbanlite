-- ============================================================================
-- MIGRATION: SISTEMA DE CATEGORIZAÇÃO 100% DINÂMICO
-- ============================================================================
-- Remove triggerServices estático e implementa sistema inteligente
-- ============================================================================

-- ============================================================================
-- 1. REMOVER CAMPO ESTÁTICO triggerServices
-- ============================================================================

ALTER TABLE "citizen_categories" DROP COLUMN IF EXISTS "triggerServices";

-- ============================================================================
-- 2. ADICIONAR CAMPOS PARA MATCHING INTELIGENTE
-- ============================================================================

-- Sistema de matching por padrões
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "matchingEnabled" BOOLEAN DEFAULT true;
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "autoAssignThreshold" INTEGER DEFAULT 85;
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "suggestThreshold" INTEGER DEFAULT 60;

-- Padrões regex para match
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "exactPatterns" TEXT[] DEFAULT '{}';
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "regexPatterns" JSONB DEFAULT '[]';

-- Regras semânticas
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "semanticRules" JSONB DEFAULT '{}';

-- ============================================================================
-- 3. CRIAR TABELA: ServiceSimplified Tags (Sistema de Tags)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "service_tags" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "serviceId" TEXT NOT NULL,
  "tag" TEXT NOT NULL,
  "source" TEXT DEFAULT 'MANUAL', -- 'MANUAL', 'AUTO', 'AI'
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_service_tags_service"
    FOREIGN KEY ("serviceId")
    REFERENCES "services_simplified"("id")
    ON DELETE CASCADE,

  CONSTRAINT "unique_service_tag"
    UNIQUE ("serviceId", "tag")
);

CREATE INDEX IF NOT EXISTS "idx_service_tags_service" ON "service_tags"("serviceId");
CREATE INDEX IF NOT EXISTS "idx_service_tags_tag" ON "service_tags"("tag");

-- ============================================================================
-- 4. CRIAR TABELA: Category Match Rules (Regras de Match)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "citizen_category_match_rules" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  "categoryId" TEXT NOT NULL,

  -- Tipo de regra
  "ruleType" TEXT NOT NULL, -- 'EXACT', 'PATTERN', 'SEMANTIC', 'CUSTOM'

  -- Configuração da regra
  "pattern" TEXT, -- Para EXACT ou PATTERN
  "regex" TEXT,   -- Para PATTERN
  "semanticConfig" JSONB, -- Para SEMANTIC
  "customLogic" JSONB, -- Para CUSTOM

  -- Score e prioridade
  "confidence" INTEGER DEFAULT 80, -- 0-100
  "priority" INTEGER DEFAULT 5,

  -- Configuração
  "active" BOOLEAN DEFAULT true,
  "description" TEXT,

  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_match_rule_category"
    FOREIGN KEY ("categoryId")
    REFERENCES "citizen_categories"("id")
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_match_rule_category" ON "citizen_category_match_rules"("categoryId");
CREATE INDEX IF NOT EXISTS "idx_match_rule_type" ON "citizen_category_match_rules"("ruleType");
CREATE INDEX IF NOT EXISTS "idx_match_rule_active" ON "citizen_category_match_rules"("active");

-- ============================================================================
-- 5. CRIAR TABELA: Category Match Suggestions
-- ============================================================================

CREATE TABLE IF NOT EXISTS "citizen_category_match_suggestions" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  -- Relacionamentos
  "serviceId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,

  -- Informações do match
  "matchType" TEXT NOT NULL, -- 'EXACT', 'PATTERN', 'SEMANTIC', 'MANUAL'
  "confidence" INTEGER NOT NULL, -- 0-100
  "matchDetails" JSONB,
  "matchedRuleId" TEXT, -- Regra que gerou o match

  -- Status da sugestão
  "status" TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'AUTO_ASSIGNED'

  -- Revisão
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewNotes" TEXT,

  -- Metadata
  "wasAutoAssigned" BOOLEAN DEFAULT false,
  "assignedToCitizensCount" INTEGER DEFAULT 0,

  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_suggestion_service"
    FOREIGN KEY ("serviceId")
    REFERENCES "services_simplified"("id")
    ON DELETE CASCADE,

  CONSTRAINT "fk_suggestion_category"
    FOREIGN KEY ("categoryId")
    REFERENCES "citizen_categories"("id")
    ON DELETE CASCADE,

  CONSTRAINT "unique_service_category_suggestion"
    UNIQUE ("serviceId", "categoryId")
);

CREATE INDEX IF NOT EXISTS "idx_suggestion_service" ON "citizen_category_match_suggestions"("serviceId");
CREATE INDEX IF NOT EXISTS "idx_suggestion_category" ON "citizen_category_match_suggestions"("categoryId");
CREATE INDEX IF NOT EXISTS "idx_suggestion_status" ON "citizen_category_match_suggestions"("status");
CREATE INDEX IF NOT EXISTS "idx_suggestion_match_type" ON "citizen_category_match_suggestions"("matchType");

-- ============================================================================
-- 6. CRIAR TABELA: Service Category Assignments (Vínculo Dinâmico)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "service_category_assignments" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  "serviceId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,

  -- Origem da atribuição
  "assignmentType" TEXT NOT NULL, -- 'AUTO', 'MANUAL', 'APPROVED_SUGGESTION'
  "confidence" INTEGER, -- Score quando auto-atribuído
  "matchRuleId" TEXT, -- Regra que gerou (se auto)

  -- Quem atribuiu
  "assignedBy" TEXT,
  "assignedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  -- Configuração
  "active" BOOLEAN DEFAULT true,
  "metadata" JSONB,

  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_service_category_service"
    FOREIGN KEY ("serviceId")
    REFERENCES "services_simplified"("id")
    ON DELETE CASCADE,

  CONSTRAINT "fk_service_category_category"
    FOREIGN KEY ("categoryId")
    REFERENCES "citizen_categories"("id")
    ON DELETE CASCADE,

  CONSTRAINT "unique_service_category"
    UNIQUE ("serviceId", "categoryId")
);

CREATE INDEX IF NOT EXISTS "idx_service_category_service" ON "service_category_assignments"("serviceId");
CREATE INDEX IF NOT EXISTS "idx_service_category_category" ON "service_category_assignments"("categoryId");
CREATE INDEX IF NOT EXISTS "idx_service_category_active" ON "service_category_assignments"("active");
CREATE INDEX IF NOT EXISTS "idx_service_category_type" ON "service_category_assignments"("assignmentType");

-- ============================================================================
-- 7. CRIAR TABELA: Category Learning Data (Machine Learning)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "citizen_category_learning_data" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  "categoryId" TEXT NOT NULL,

  -- Dados de aprendizado
  "commonPatterns" JSONB DEFAULT '[]', -- Padrões que frequentemente resultam em match
  "commonTags" JSONB DEFAULT '[]',     -- Tags mais comuns
  "commonDepartments" TEXT[] DEFAULT '{}',
  "avgConfidence" DECIMAL(5,2),

  -- Estatísticas
  "totalAutoAssignments" INTEGER DEFAULT 0,
  "totalManualAssignments" INTEGER DEFAULT 0,
  "totalRejections" INTEGER DEFAULT 0,
  "successRate" DECIMAL(5,2),

  "lastUpdated" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_learning_category"
    FOREIGN KEY ("categoryId")
    REFERENCES "citizen_categories"("id")
    ON DELETE CASCADE,

  CONSTRAINT "unique_learning_category"
    UNIQUE ("categoryId")
);

CREATE INDEX IF NOT EXISTS "idx_learning_category" ON "citizen_category_learning_data"("categoryId");

-- ============================================================================
-- 8. CRIAR VIEW: Service Category Matches (Para consultas rápidas)
-- ============================================================================

CREATE OR REPLACE VIEW "service_category_matches" AS
SELECT
  s.id as "serviceId",
  s."moduleType",
  s.name as "serviceName",
  s."departmentId",
  c.id as "categoryId",
  c.code as "categoryCode",
  c.name as "categoryName",
  sca."assignmentType",
  sca.confidence,
  sca.active,
  sca."assignedAt"
FROM "services_simplified" s
LEFT JOIN "service_category_assignments" sca ON sca."serviceId" = s.id
LEFT JOIN "citizen_categories" c ON c.id = sca."categoryId"
WHERE sca.active = true;

-- ============================================================================
-- 9. CRIAR FUNÇÃO: Auto-análise de novos serviços
-- ============================================================================

-- Função que será chamada via trigger quando serviço é criado/atualizado
CREATE OR REPLACE FUNCTION analyze_service_for_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir job na fila para análise assíncrona
  INSERT INTO "background_jobs" ("type", "payload", "status", "createdAt")
  VALUES (
    'ANALYZE_SERVICE_CATEGORIES',
    jsonb_build_object('serviceId', NEW.id, 'moduleType', NEW."moduleType"),
    'PENDING',
    CURRENT_TIMESTAMP
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. CRIAR TRIGGER: Auto-análise ao criar serviço
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_analyze_service ON "services_simplified";

CREATE TRIGGER trigger_analyze_service
AFTER INSERT OR UPDATE OF "moduleType", "departmentId", name
ON "services_simplified"
FOR EACH ROW
WHEN (NEW."moduleType" IS NOT NULL)
EXECUTE FUNCTION analyze_service_for_categories();

-- ============================================================================
-- 11. CRIAR TABELA: Background Jobs (Fila de processamento)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "background_jobs" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
  "result" JSONB,
  "error" TEXT,
  "attempts" INTEGER DEFAULT 0,
  "maxAttempts" INTEGER DEFAULT 3,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_background_jobs_status" ON "background_jobs"("status");
CREATE INDEX IF NOT EXISTS "idx_background_jobs_type" ON "background_jobs"("type");
CREATE INDEX IF NOT EXISTS "idx_background_jobs_created" ON "background_jobs"("createdAt");

-- ============================================================================
-- MIGRATION COMPLETA - SISTEMA 100% DINÂMICO
-- ============================================================================
