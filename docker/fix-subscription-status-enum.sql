-- Adicionar novos valores ao enum SubscriptionStatus se não existirem
DO $$
DECLARE
    enum_oid OID;
BEGIN
    -- Obter OID do tipo SubscriptionStatus
    SELECT oid INTO enum_oid FROM pg_type WHERE typname = 'SubscriptionStatus';

    -- Adicionar TRIAL
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'TRIAL' AND enumtypid = enum_oid) THEN
        ALTER TYPE "SubscriptionStatus" ADD VALUE 'TRIAL';
    END IF;

    -- Adicionar SUSPENDED
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUSPENDED' AND enumtypid = enum_oid) THEN
        ALTER TYPE "SubscriptionStatus" ADD VALUE 'SUSPENDED';
    END IF;

    -- Adicionar CANCELLED
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CANCELLED' AND enumtypid = enum_oid) THEN
        ALTER TYPE "SubscriptionStatus" ADD VALUE 'CANCELLED';
    END IF;

    -- Adicionar EXPIRED
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'EXPIRED' AND enumtypid = enum_oid) THEN
        ALTER TYPE "SubscriptionStatus" ADD VALUE 'EXPIRED';
    END IF;
END $$;
