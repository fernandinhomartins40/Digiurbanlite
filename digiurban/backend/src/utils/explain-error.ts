/**
 * Resposta de erro que EXPLICA o motivo para quem está na tela, sem vazar
 * detalhe interno. As rotas da Saúde respondiam só "Erro ao ..." (500) para
 * qualquer problema — a pessoa não sabia se faltou um campo, se o registro
 * já existia ou se o sistema caiu.
 *
 * Regra:
 *  - erro de regra lançado pelos serviços (`throw new Error('Turma sem vagas')`)
 *    → 400 com a própria mensagem;
 *  - erros conhecidos do banco viram frase em português (repetido, não achado,
 *    item que não existe mais, campo faltando);
 *  - o resto continua 500 com a frase genérica da rota.
 */

import { Response } from 'express';
import { isInternalErrorMessage } from '../middleware/sanitize-error-response';

export interface ExplainedError {
  status: number;
  message: string;
}

export function explainError(error: unknown, fallback: string): ExplainedError {
  const anyError = error as any;
  const code = typeof anyError?.code === 'string' ? anyError.code : '';
  const name = String(anyError?.name || anyError?.constructor?.name || '');
  const message = typeof anyError?.message === 'string' ? anyError.message : '';

  if (code === 'P2002') return { status: 409, message: 'Já existe um registro com esses dados.' };
  if (code === 'P2025') return { status: 404, message: 'Registro não encontrado (pode ter sido apagado).' };
  if (code === 'P2003') return { status: 400, message: 'Um dos itens escolhidos não existe mais. Atualize a tela e escolha de novo.' };
  if (name === 'PrismaClientValidationError') {
    return { status: 400, message: `${fallback}: confira se todos os campos obrigatórios foram preenchidos.` };
  }
  if (/^P\d{4}$/.test(code) || name.startsWith('PrismaClient') || isInternalErrorMessage(message)) {
    return { status: 500, message: fallback };
  }
  // Erro de regra escrito para a pessoa ler (curto, uma linha). Só o `Error`
  // comum: TypeError/ReferenceError são defeito do sistema, não recado.
  if (name === 'Error' && message && message.length <= 300 && !message.includes('\n')) {
    return { status: 400, message };
  }
  return { status: 500, message: fallback };
}

/** Responde `{ error }` com o motivo explicado. */
export function sendError(res: Response, error: unknown, fallback: string) {
  const explained = explainError(error, fallback);
  return res.status(explained.status).json({ error: explained.message });
}
