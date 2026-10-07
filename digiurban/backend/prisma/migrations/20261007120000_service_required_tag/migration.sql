-- Serviço só para quem tem a etiqueta (ex.: renovação de cadastro de produtor só para Produtor Rural)
ALTER TABLE "services_simplified" ADD COLUMN IF NOT EXISTS "requiredTagId" TEXT;
