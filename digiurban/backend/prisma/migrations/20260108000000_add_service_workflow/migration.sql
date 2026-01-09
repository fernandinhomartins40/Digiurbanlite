-- ============================================================================
-- MIGRATION: Adicionar ServiceWorkflow
-- ============================================================================
--
-- Objetivo: Criar novo modelo ServiceWorkflow para workflows por serviço
-- Permite que TODOS os serviços tenham workflow (não apenas COM_DADOS)
--
-- Estratégia de migração:
-- 1. Criar tabela service_workflows
-- 2. Migrar dados de module_workflows para service_workflows
-- 3. Manter module_workflows temporariamente para compatibilidade
-- 4. Adicionar workflow GENERICO para serviços sem workflow
-- ============================================================================

-- Criar tabela service_workflows
CREATE TABLE IF NOT EXISTS "service_workflows" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stages" JSONB NOT NULL,
    "defaultSLA" INTEGER,
    "rules" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_workflows_pkey" PRIMARY KEY ("id")
);

-- Criar índices
CREATE UNIQUE INDEX "service_workflows_serviceId_key" ON "service_workflows"("serviceId");
CREATE INDEX "service_workflows_isActive_idx" ON "service_workflows"("isActive");

-- Adicionar foreign key para services_simplified
ALTER TABLE "service_workflows"
ADD CONSTRAINT "service_workflows_serviceId_fkey"
FOREIGN KEY ("serviceId")
REFERENCES "services_simplified"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- ============================================================================
-- MIGRAÇÃO DE DADOS: module_workflows → service_workflows
-- ============================================================================

-- Copiar workflows existentes de module_workflows para service_workflows
-- Vinculando ao serviceId através do moduleType
INSERT INTO "service_workflows" ("id", "serviceId", "name", "description", "stages", "defaultSLA", "rules", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text as id,
    s.id as "serviceId",
    mw.name,
    mw.description,
    mw.stages,
    mw."defaultSLA",
    mw.rules,
    mw."createdAt",
    NOW() as "updatedAt"
FROM "module_workflows" mw
INNER JOIN "services_simplified" s ON s."moduleType" = mw."moduleType"
WHERE s."moduleType" IS NOT NULL;

-- ============================================================================
-- CRIAR WORKFLOW GENERICO
-- ============================================================================

-- Inserir workflow genérico que será usado por todos os serviços sem workflow específico
INSERT INTO "service_workflows" ("id", "serviceId", "name", "description", "stages", "defaultSLA", "rules", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    s.id,
    'Workflow Genérico - ' || s.name,
    'Workflow padrão aplicado automaticamente para serviços sem workflow específico',
    '[
        {
            "id": "1",
            "name": "Solicitação Recebida",
            "order": 1,
            "description": "Protocolo recebido e aguardando análise inicial",
            "slaDays": 2,
            "requiredDocumentTypes": [],
            "requiredFormFieldIds": [],
            "allowedActions": ["INICIAR_ANALISE"],
            "canSkip": false
        },
        {
            "id": "2",
            "name": "Análise de Documentos",
            "order": 2,
            "description": "Verificação e validação dos documentos apresentados",
            "slaDays": 3,
            "requiredDocumentTypes": [],
            "requiredFormFieldIds": [],
            "allowedActions": ["APROVAR_DOCUMENTOS", "SOLICITAR_COMPLEMENTACAO"],
            "canSkip": false
        },
        {
            "id": "3",
            "name": "Processamento",
            "order": 3,
            "description": "Processamento da solicitação pelo departamento responsável",
            "slaDays": 5,
            "requiredDocumentTypes": [],
            "requiredFormFieldIds": [],
            "allowedActions": ["PROCESSAR", "ENCAMINHAR"],
            "canSkip": false
        },
        {
            "id": "4",
            "name": "Aprovação Final",
            "order": 4,
            "description": "Aprovação final da solicitação",
            "slaDays": 2,
            "requiredDocumentTypes": [],
            "requiredFormFieldIds": [],
            "allowedActions": ["APROVAR", "REJEITAR"],
            "canSkip": false
        },
        {
            "id": "5",
            "name": "Emissão/Conclusão",
            "order": 5,
            "description": "Emissão do documento ou conclusão do atendimento",
            "slaDays": 1,
            "requiredDocumentTypes": [],
            "requiredFormFieldIds": [],
            "allowedActions": ["CONCLUIR"],
            "canSkip": false
        }
    ]'::jsonb,
    10,
    NULL,
    NOW(),
    NOW()
FROM "services_simplified" s
WHERE s.id NOT IN (
    SELECT "serviceId" FROM "service_workflows"
);

-- ============================================================================
-- COMENTÁRIOS E OBSERVAÇÕES
-- ============================================================================

-- IMPORTANTE: module_workflows NÃO é deletada nesta migration
-- Ela será mantida temporariamente para compatibilidade com código legado
-- Será removida em migration futura após validação completa

COMMENT ON TABLE "service_workflows" IS 'Workflows por serviço - permite que TODOS os serviços tenham workflow customizado';
COMMENT ON COLUMN "service_workflows"."serviceId" IS 'Referência única ao serviço - um serviço tem exatamente um workflow';
COMMENT ON COLUMN "service_workflows"."stages" IS 'Array JSON de etapas do workflow com estrutura completa';
COMMENT ON COLUMN "service_workflows"."isActive" IS 'Flag para desativar workflow sem deletar (permite versionamento futuro)';
