ALTER TABLE "functions"
ADD COLUMN "positionId" TEXT;

WITH "single_position_functions" AS (
  SELECT
    "functionId",
    MIN("positionId") AS "positionId"
  FROM "employee_assignments"
  WHERE "functionId" IS NOT NULL
    AND "positionId" IS NOT NULL
  GROUP BY "functionId"
  HAVING COUNT(DISTINCT "positionId") = 1
)
UPDATE "functions" AS "f"
SET "positionId" = "single_position_functions"."positionId"
FROM "single_position_functions"
WHERE "f"."id" = "single_position_functions"."functionId"
  AND "f"."positionId" IS NULL;

CREATE INDEX "functions_positionId_idx" ON "functions"("positionId");

ALTER TABLE "functions"
ADD CONSTRAINT "functions_positionId_fkey"
FOREIGN KEY ("positionId") REFERENCES "positions"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
