-- Assistencia remota: modo de operacao (VER | CONTROLAR) e janela de controle.
--
-- As acoes executadas durante o controle continuam sendo do usuario assistido
-- (mesma sessao, mesmos cookies). O que estas colunas registram e' QUANDO o
-- operador esteve no comando, para a auditoria conseguir cruzar depois com o
-- log de protocolos. O conteudo da tela e o chat seguem nao sendo persistidos.
ALTER TABLE "remote_assist_sessions"
  ADD COLUMN IF NOT EXISTS "modo" TEXT NOT NULL DEFAULT 'VER',
  ADD COLUMN IF NOT EXISTS "controleConcedidoEm" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "controleRetomadoEm" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "controleRetomadas" INTEGER NOT NULL DEFAULT 0;
