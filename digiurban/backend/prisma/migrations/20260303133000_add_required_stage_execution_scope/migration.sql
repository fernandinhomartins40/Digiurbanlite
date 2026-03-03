ALTER TYPE "WorkflowStageSupportTargetType" ADD VALUE 'DEPARTMENT';

ALTER TYPE "WorkflowStageSupportMode" ADD VALUE 'REQUIRED_EXECUTION';

ALTER TABLE "workflow_stage_support_assignments"
ADD COLUMN "departmentId" TEXT;

CREATE INDEX "wssa_department_idx" ON "workflow_stage_support_assignments"("departmentId");

ALTER TABLE "workflow_stage_support_assignments"
ADD CONSTRAINT "workflow_stage_support_assignments_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
