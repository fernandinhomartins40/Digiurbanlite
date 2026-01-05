-- Criar enums se não existirem
DO $$ BEGIN
  CREATE TYPE "EmailPlan" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Alterar coluna plan de text para enum
ALTER TABLE email_subscriptions
  ALTER COLUMN plan TYPE "EmailPlan" USING plan::"EmailPlan";

-- Alterar coluna status de text para enum
ALTER TABLE email_subscriptions
  ALTER COLUMN status TYPE "SubscriptionStatus" USING status::"SubscriptionStatus";

-- Ajustar default value
ALTER TABLE email_subscriptions
  ALTER COLUMN status SET DEFAULT 'ACTIVE'::"SubscriptionStatus";
