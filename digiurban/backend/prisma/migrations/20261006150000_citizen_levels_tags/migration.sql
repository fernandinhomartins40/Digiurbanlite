-- Nível mínimo do cidadão para pedir o serviço (BRONZE = qualquer cidadão)
ALTER TABLE "services_simplified" ADD COLUMN IF NOT EXISTS "minLevel" TEXT NOT NULL DEFAULT 'BRONZE';

-- Etiquetas ligadas aos serviços escolhidos na tela (por id, não pelo código técnico)
ALTER TABLE "citizen_categories" ADD COLUMN IF NOT EXISTS "triggerServiceIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
