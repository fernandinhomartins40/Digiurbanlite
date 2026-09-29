-- Fase 2 (ARQUITETURA-DE-PRODUTO.md): porta de entrada do pedido.
-- PORTAL | BOT | BALCAO. Aditiva e idempotente; protocolos antigos ficam NULL.
ALTER TABLE "protocols_simplified" ADD COLUMN IF NOT EXISTS "channel" TEXT;
