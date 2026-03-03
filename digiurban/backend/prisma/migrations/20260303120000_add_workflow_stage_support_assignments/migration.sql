CREATE TYPE "WorkflowStageSupportTargetType" AS ENUM ('USER', 'ORGANIZATIONAL_UNIT');

CREATE TYPE "WorkflowStageSupportMode" AS ENUM ('REFERENCE_ONLY', 'SUGGEST_ASSIGNMENT');

CREATE TABLE "workflow_stage_support_assignments" (
    "id" TEXT NOT NULL,
    "serviceWorkflowId" TEXT NOT NULL,
    "workflowStageId" TEXT NOT NULL,
    "targetType" "WorkflowStageSupportTargetType" NOT NULL,
    "mode" "WorkflowStageSupportMode" NOT NULL DEFAULT 'REFERENCE_ONLY',
    "userId" TEXT,
    "organizationalUnitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_stage_support_assignments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "wssa_workflow_stage_idx" ON "workflow_stage_support_assignments"("serviceWorkflowId", "workflowStageId");

CREATE INDEX "wssa_workflow_stage_target_idx" ON "workflow_stage_support_assignments"("serviceWorkflowId", "workflowStageId", "targetType");

CREATE INDEX "wssa_user_idx" ON "workflow_stage_support_assignments"("userId");

CREATE INDEX "wssa_org_unit_idx" ON "workflow_stage_support_assignments"("organizationalUnitId");

ALTER TABLE "workflow_stage_support_assignments"
ADD CONSTRAINT "workflow_stage_support_assignments_serviceWorkflowId_fkey"
FOREIGN KEY ("serviceWorkflowId") REFERENCES "service_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_stage_support_assignments"
ADD CONSTRAINT "workflow_stage_support_assignments_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "workflow_stage_support_assignments"
ADD CONSTRAINT "workflow_stage_support_assignments_organizationalUnitId_fkey"
FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
