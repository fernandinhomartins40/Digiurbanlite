-- Atalhos fixados na barra inferior (estilo Dock), por servidor
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "pinnedShortcuts" JSONB;
