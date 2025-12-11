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
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Determinar status code
  const statusCode = (err as any).statusCode || (err as any).status || 500;

  // ✅ LOG ESTRUTURADO com Winston (persistido em arquivo)
  logError(err, req, {
    statusCode,
    body: req.body,
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
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro inesperado',
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
