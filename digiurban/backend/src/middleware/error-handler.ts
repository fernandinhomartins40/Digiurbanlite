/**
 * ============================================================================
 * MIDDLEWARE GLOBAL DE TRATAMENTO DE ERROS
 * ============================================================================
 * Garante que TODOS os erros retornam JSON ao invés de HTML
 * Previne o erro "Unexpected token <" no frontend
 */

import { Request, Response, NextFunction } from 'express';

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
  // Log do erro para debug
  console.error('🔥 [ERROR HANDLER] Erro capturado:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });

  // Se headers já foram enviados, delegar para handler padrão do Express
  if (res.headersSent) {
    return next(err);
  }

  // Determinar status code
  const statusCode = (err as any).statusCode || (err as any).status || 500;

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
