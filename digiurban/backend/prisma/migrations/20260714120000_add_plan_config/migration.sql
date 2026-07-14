-- ============================================================================
-- PLAN CONFIG — catálogo de planos da plataforma (configurável no super-admin)
-- ============================================================================
-- Entidade de PLATAFORMA (sem tenantId, igual a "leads"/"invoices"): NÃO entra
-- na extension de isolamento nem no RLS de tenant. Substitui o PLAN_MONTHLY_PRICE
-- hardcoded. Municípios referenciam pelo `code` e herdam limites/features.
-- Idempotente.

CREATE TABLE IF NOT EXISTS "plan_configs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxUsers" INTEGER NOT NULL DEFAULT 10,
    "maxCitizens" INTEGER NOT NULL DEFAULT 10000,
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "plan_configs_code_key" ON "plan_configs" ("code");

-- Seed dos 3 planos atuais (valores herdados do PLAN_MONTHLY_PRICE legado).
-- Limites: STARTER conservador; ENTERPRISE ilimitado (-1). features NULL =
-- todos os módulos habilitados (contrato: ausência da chave = habilitado).
INSERT INTO "plan_configs" ("id", "code", "name", "description", "monthlyPrice", "maxUsers", "maxCitizens", "features", "isActive", "sortOrder", "updatedAt")
VALUES
  ('plan-starter',      'STARTER',      'Starter',      'Plano inicial para municípios pequenos.',        299,   10,   10000, NULL, true, 1, CURRENT_TIMESTAMP),
  ('plan-professional', 'PROFESSIONAL', 'Profissional', 'Plano intermediário para municípios médios.',    799,   50,   50000, NULL, true, 2, CURRENT_TIMESTAMP),
  ('plan-enterprise',   'ENTERPRISE',   'Enterprise',   'Plano completo, sem limites de usuários/cidadãos.', 1999,  -1,   -1,    NULL, true, 3, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
