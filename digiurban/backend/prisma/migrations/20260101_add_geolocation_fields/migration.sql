-- Add geolocation fields to services_simplified
ALTER TABLE "services_simplified"
ADD COLUMN IF NOT EXISTS "requiresSpecificLocation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "locationLabel" TEXT,
ADD COLUMN IF NOT EXISTS "enableMapSelection" BOOLEAN NOT NULL DEFAULT false;

-- Add geolocation fields to protocols_simplified
ALTER TABLE "protocols_simplified"
ADD COLUMN IF NOT EXISTS "specificLocation" TEXT,
ADD COLUMN IF NOT EXISTS "locationType" TEXT,
ADD COLUMN IF NOT EXISTS "geocodingProvider" TEXT;
