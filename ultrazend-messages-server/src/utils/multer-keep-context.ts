/**
 * O multer (recebimento de arquivos) termina o trabalho em eventos de stream,
 * FORA do AsyncLocalStorage da requisição — o município (tenant) se perdia e
 * tudo depois do upload rodava no município padrão. Visto em 2026-10-02: o bot
 * de Palmital confirmava um pedido com documentos e o sistema respondia
 * "Service not found" (procurava o serviço no município padrão).
 *
 * Correção central: todo middleware criado pelo multer devolve o controle
 * (next) no MESMO contexto em que foi chamado. Importar uma vez, antes das rotas.
 */

import { AsyncResource } from 'async_hooks';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');

const proto = Object.getPrototypeOf(multer({ storage: multer.memoryStorage() }));

if (proto && typeof proto._makeMiddleware === 'function' && !proto.__keepsContext) {
  const original = proto._makeMiddleware;
  proto._makeMiddleware = function patched(this: unknown, ...args: unknown[]) {
    const middleware = original.apply(this, args);
    return function keepContext(req: unknown, res: unknown, next: (err?: unknown) => void) {
      return middleware(req, res, AsyncResource.bind(next));
    };
  };
  proto.__keepsContext = true;
}

export {};
