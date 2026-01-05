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
