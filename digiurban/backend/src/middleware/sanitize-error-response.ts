/**
 * Centenas de rotas respondem `{ error: error.message }`. Quando o erro vem do
 * Prisma, a mensagem traz a consulta montada (tabelas, filtros, tenantId) —
 * vazamento de detalhe interno para o cliente.
 *
 * Em produção, este middleware intercepta res.json e troca mensagens internas
 * do Prisma por uma mensagem genérica, registrando o original no log. Em
 * desenvolvimento a resposta segue completa para depuração.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.config';

const INTERNAL_ERROR_PATTERN = /Invalid `prisma\.|prisma\.\w+\.\w+\(\)` invocation|PrismaClient\w*Error/;
const GENERIC_MESSAGE = 'Não foi possível concluir a operação. Verifique os dados informados e tente novamente.';
const MESSAGE_KEYS = ['error', 'message', 'details'] as const;

export function isInternalErrorMessage(value: unknown): boolean {
  return typeof value === 'string' && INTERNAL_ERROR_PATTERN.test(value);
}

export function sanitizeErrorBody(body: any): { body: any; sanitized: string[] } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { body, sanitized: [] };

  const sanitized: string[] = [];
  let copy: any = body;
  for (const key of MESSAGE_KEYS) {
    if (isInternalErrorMessage(body[key])) {
      if (copy === body) copy = { ...body };
      sanitized.push(body[key]);
      copy[key] = GENERIC_MESSAGE;
    }
  }
  return { body: copy, sanitized };
}

export function sanitizeErrorResponse(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== 'production') return next();

  const originalJson = res.json.bind(res);
  res.json = ((body: any) => {
    const { body: safeBody, sanitized } = sanitizeErrorBody(body);
    if (sanitized.length > 0) {
      logger.error('Erro interno ocultado da resposta', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        detail: sanitized[0].slice(0, 2000)
      });
    }
    return originalJson(safeBody);
  }) as Response['json'];

  next();
}
