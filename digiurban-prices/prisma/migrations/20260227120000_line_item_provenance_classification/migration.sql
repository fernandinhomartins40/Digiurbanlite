ALTER TABLE "prices_line_items"
ADD COLUMN IF NOT EXISTS "classificationScore" DOUBLE PRECISION;

ALTER TABLE "prices_line_items"
ADD COLUMN IF NOT EXISTS "provenanceHash" TEXT;

ALTER TABLE "prices_line_items"
ADD COLUMN IF NOT EXISTS "inferredFromObject" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "prices_line_items_provenanceHash_idx"
ON "prices_line_items"("provenanceHash");

CREATE INDEX IF NOT EXISTS "prices_line_items_inferredFromObject_idx"
ON "prices_line_items"("inferredFromObject");
