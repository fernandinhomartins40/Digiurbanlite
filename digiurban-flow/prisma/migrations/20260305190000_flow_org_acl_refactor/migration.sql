-- ============================================================================
-- Flow refactor: centralized organogram fields + immutable workflow snapshots
-- ============================================================================

-- ---------------------------------------------------------------------------
-- flow_processes
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flow_processes' AND column_name = 'originSectorId'
  ) THEN
    ALTER TABLE "flow_processes" RENAME COLUMN "originSectorId" TO "originOrganizationalUnitId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flow_processes' AND column_name = 'originSectorName'
  ) THEN
    ALTER TABLE "flow_processes" RENAME COLUMN "originSectorName" TO "originOrganizationalUnitName";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flow_processes' AND column_name = 'currentSectorId'
  ) THEN
    ALTER TABLE "flow_processes" RENAME COLUMN "currentSectorId" TO "currentOrganizationalUnitId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flow_processes' AND column_name = 'currentSectorName'
  ) THEN
    ALTER TABLE "flow_processes" RENAME COLUMN "currentSectorName" TO "currentOrganizationalUnitName";
  END IF;
END $$;

ALTER TABLE "flow_processes"
  ADD COLUMN IF NOT EXISTS "originDepartmentId" TEXT,
  ADD COLUMN IF NOT EXISTS "currentDepartmentId" TEXT;

-- Backfill departments from centralized organizational units
UPDATE "flow_processes" p
SET "originDepartmentId" = u."departmentId"
FROM "organizational_units" u
WHERE p."originDepartmentId" IS NULL
  AND p."originOrganizationalUnitId" = u."id";

UPDATE "flow_processes" p
SET "currentDepartmentId" = u."departmentId"
FROM "organizational_units" u
WHERE p."currentDepartmentId" IS NULL
  AND p."currentOrganizationalUnitId" = u."id";

DROP INDEX IF EXISTS "flow_processes_currentSectorId_idx";
CREATE INDEX IF NOT EXISTS "flow_processes_originDepartmentId_idx"
  ON "flow_processes"("originDepartmentId");
CREATE INDEX IF NOT EXISTS "flow_processes_currentDepartmentId_idx"
  ON "flow_processes"("currentDepartmentId");
CREATE INDEX IF NOT EXISTS "flow_processes_currentOrganizationalUnitId_idx"
  ON "flow_processes"("currentOrganizationalUnitId");

-- ---------------------------------------------------------------------------
-- flow_process_history
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flow_process_history' AND column_name = 'fromSectorId'
  ) THEN
    ALTER TABLE "flow_process_history" RENAME COLUMN "fromSectorId" TO "fromOrganizationalUnitId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flow_process_history' AND column_name = 'fromSectorName'
  ) THEN
    ALTER TABLE "flow_process_history" RENAME COLUMN "fromSectorName" TO "fromOrganizationalUnitName";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flow_process_history' AND column_name = 'toSectorId'
  ) THEN
    ALTER TABLE "flow_process_history" RENAME COLUMN "toSectorId" TO "toOrganizationalUnitId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flow_process_history' AND column_name = 'toSectorName'
  ) THEN
    ALTER TABLE "flow_process_history" RENAME COLUMN "toSectorName" TO "toOrganizationalUnitName";
  END IF;
END $$;

ALTER TABLE "flow_process_history"
  ADD COLUMN IF NOT EXISTS "fromDepartmentId" TEXT,
  ADD COLUMN IF NOT EXISTS "toDepartmentId" TEXT;

UPDATE "flow_process_history" h
SET "fromDepartmentId" = u."departmentId"
FROM "organizational_units" u
WHERE h."fromDepartmentId" IS NULL
  AND h."fromOrganizationalUnitId" = u."id";

UPDATE "flow_process_history" h
SET "toDepartmentId" = u."departmentId"
FROM "organizational_units" u
WHERE h."toDepartmentId" IS NULL
  AND h."toOrganizationalUnitId" = u."id";

-- ---------------------------------------------------------------------------
-- flow_dispatches
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flow_dispatches' AND column_name = 'fromSectorId'
  ) THEN
    ALTER TABLE "flow_dispatches" RENAME COLUMN "fromSectorId" TO "fromOrganizationalUnitId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flow_dispatches' AND column_name = 'fromSectorName'
  ) THEN
    ALTER TABLE "flow_dispatches" RENAME COLUMN "fromSectorName" TO "fromOrganizationalUnitName";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flow_dispatches' AND column_name = 'toSectorId'
  ) THEN
    ALTER TABLE "flow_dispatches" RENAME COLUMN "toSectorId" TO "toOrganizationalUnitId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flow_dispatches' AND column_name = 'toSectorName'
  ) THEN
    ALTER TABLE "flow_dispatches" RENAME COLUMN "toSectorName" TO "toOrganizationalUnitName";
  END IF;
END $$;

ALTER TABLE "flow_dispatches"
  ADD COLUMN IF NOT EXISTS "fromDepartmentId" TEXT,
  ADD COLUMN IF NOT EXISTS "toDepartmentId" TEXT;

UPDATE "flow_dispatches" d
SET "fromDepartmentId" = u."departmentId"
FROM "organizational_units" u
WHERE d."fromDepartmentId" IS NULL
  AND d."fromOrganizationalUnitId" = u."id";

UPDATE "flow_dispatches" d
SET "toDepartmentId" = u."departmentId"
FROM "organizational_units" u
WHERE d."toDepartmentId" IS NULL
  AND d."toOrganizationalUnitId" = u."id";

DROP INDEX IF EXISTS "flow_dispatches_toSectorId_idx";
CREATE INDEX IF NOT EXISTS "flow_dispatches_toDepartmentId_idx"
  ON "flow_dispatches"("toDepartmentId");
CREATE INDEX IF NOT EXISTS "flow_dispatches_toOrganizationalUnitId_idx"
  ON "flow_dispatches"("toOrganizationalUnitId");

-- ---------------------------------------------------------------------------
-- flow_workflow_instances: immutable template snapshot
-- ---------------------------------------------------------------------------
ALTER TABLE "flow_workflow_instances"
  ADD COLUMN IF NOT EXISTS "templateVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "templateName" TEXT,
  ADD COLUMN IF NOT EXISTS "stepsSnapshot" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "transitionsSnapshot" JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE "flow_workflow_instances" wi
SET
  "templateVersion" = COALESCE(wt."version", wi."templateVersion", 1),
  "templateName" = COALESCE(wt."name", wi."templateName", 'Template removido'),
  "stepsSnapshot" = CASE
    WHEN wi."stepsSnapshot" IS NULL OR wi."stepsSnapshot" = '[]'::jsonb THEN COALESCE(wt."steps", '[]'::jsonb)
    ELSE wi."stepsSnapshot"
  END,
  "transitionsSnapshot" = CASE
    WHEN wi."transitionsSnapshot" IS NULL OR wi."transitionsSnapshot" = '[]'::jsonb THEN COALESCE(wt."transitions", '[]'::jsonb)
    ELSE wi."transitionsSnapshot"
  END
FROM "flow_workflow_templates" wt
WHERE wi."templateId" = wt."id";

UPDATE "flow_workflow_instances"
SET "templateName" = COALESCE("templateName", 'Template removido')
WHERE "templateName" IS NULL;

ALTER TABLE "flow_workflow_instances"
  ALTER COLUMN "templateName" SET NOT NULL;
