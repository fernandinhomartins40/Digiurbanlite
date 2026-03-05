UPDATE "citizen_documents"
SET
  "status" = 'APPROVED',
  "reviewedAt" = COALESCE("reviewedAt", NOW()),
  "updatedAt" = NOW()
WHERE
  "sourceType" = 'PROTOCOL'
  AND "status" IN ('PENDING', 'UNDER_REVIEW', 'UPLOADED');
