ALTER TABLE "ai_provider_settings"
  ALTER COLUMN "provider" SET DEFAULT 'LLAMACPP';

UPDATE "ai_provider_settings"
SET
  "provider" = 'LLAMACPP',
  "fallbackProvider" = NULL;

ALTER TABLE "ai_provider_settings"
  DROP COLUMN IF EXISTS "openrouter_api_key_encrypted",
  DROP COLUMN IF EXISTS "openrouter_api_key_last4",
  DROP COLUMN IF EXISTS "openrouter_base_url";
