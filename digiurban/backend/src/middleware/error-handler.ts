/**
 * ============================================================================
 * MIDDLEWARE GLOBAL DE TRATAMENTO DE ERROS
 * ============================================================================
 * Garante que TODOS os erros retornam JSON ao invés de HTML
 * Previne o erro "Unexpected token <" no frontend
 * ✅ Integrado com Winston Logger para persistência de logs
 */

import { Request, Response, NextFunction } from 'express';
import { logError, logger } from '../config/logger.config';

/**
 * Middleware de erro global
 * IMPORTANTE: Deve ser registrado por último no app.ts (depois de todas as rotas)
 */
/**
 * O corpo da requisição vai para o arquivo de log: nunca gravar fotos (biometria,
 * documentos), senhas nem tokens — dado sensível em log é vazamento (LGPD art. 46).
 */
function redactBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const sensitive = /password|senha|token|secret|frames?|image|base64|embedding|vector|cpf|document/i;
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (sensitive.test(key)) output[key] = '[omitido]';
    else if (typeof value === 'string' && value.length > 300) output[key] = `[texto com ${value.length} caracteres]`;
    else output[key] = value;
  }
  return output;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Determinar status code
  const statusCode = (err as any).statusCode || (err as any).status || 500;
  const shouldExposeMessage =
    process.env.NODE_ENV === 'development' ||
    (statusCode >= 400 && statusCode < 500) ||
    (statusCode === 503 && (err as any).details !== undefined);

  // ✅ LOG ESTRUTURADO com Winston (persistido em arquivo)
  logError(err, req, {
    statusCode,
    body: redactBody(req.body),
    params: req.params,
    query: req.query
  });

  // Se headers já foram enviados, delegar para handler padrão do Express
  if (res.headersSent) {
    return next(err);
  }

  // ✅ SEMPRE retorna JSON (nunca HTML)
  res.status(statusCode).json({
    success: false,
    // erro "do usuário" (4xx): a tela mostra o motivo real (antes: "Erro interno do servidor")
    error: statusCode >= 400 && statusCode < 500 ? err.message : 'Erro interno do servidor',
    message: shouldExposeMessage ? err.message : 'Ocorreu um erro inesperado',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: {
        path: req.path,
        method: req.method
      }
    })
  });
};

/**
 * Middleware para capturar erros assíncronos
 * Wrap para funções async que não usam try/catch
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
