-- ============================================================================
-- FASE C MULTI-TENANT - PLATFORM USERS (operadores de plataforma)
-- ============================================================================
-- Identidade separada do espaço de tenant para gestão de municípios
-- (/api/platform). Substitui o uso do role SUPER_ADMIN (que é por tenant)
-- como guardião dos endpoints de plataforma — achado R2 da auditoria.
-- Idempotente (IF NOT EXISTS) — padrão das migrations condicionais das waves.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlatformRole') THEN
    CREATE TYPE "PlatformRole" AS ENUM ('PLATFORM_ADMIN', 'PLATFORM_SUPPORT');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "platform_users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "role" "PlatformRole" NOT NULL DEFAULT 'PLATFORM_ADMIN',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "platform_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "platform_users_email_key" ON "platform_users"("email");
