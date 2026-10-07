-- Quem faz cada etapa: além da unidade, o servidor que recebe (opcional)
ALTER TABLE "internal_process_role_units" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "internal_process_role_units" ADD COLUMN IF NOT EXISTS "userName" TEXT;
