-- ModuleWorkflow.moduleType: unique global → unique por município [tenantId, moduleType]
--
-- Antes: services_simplified já era único por tenant (20260708120000), mas o
-- fluxo de etapas criado junto com cada serviço COM_DADOS continuava único na
-- plataforma inteira. Um município não conseguia criar um serviço que outro
-- município já tinha com o mesmo nome (P2002 / 409 "workflow já existe").
--
-- Aditiva e idempotente: a composta nunca conflita com dados em que a global
-- já era respeitada.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'module_workflows' AND constraint_name = 'module_workflows_moduleType_key'
  ) THEN
    ALTER TABLE "module_workflows" DROP CONSTRAINT "module_workflows_moduleType_key";
  ELSIF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'module_workflows_moduleType_key') THEN
    DROP INDEX "module_workflows_moduleType_key";
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "module_workflows_tenantId_moduleType_key" ON "module_workflows"("tenantId", "moduleType");
