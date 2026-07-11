/**
 * 📝 Middleware de Logging de Requisições HTTP
 *
 * Captura todas as requisições com:
 * ✅ Método, URL, status code
 * ✅ Tempo de resposta
 * ✅ IP do cliente
 * ✅ User Agent
 * ✅ Usuário autenticado (se houver)
 * ✅ Tamanho da resposta
 */

import { Request, Response, NextFunction } from 'express';
import { logRequest, httpLogger } from '../config/logger.config';

/**
 * Middleware que loga todas as requisições HTTP
 */
export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Capturar o método original de envio de resposta
  const originalSend = res.send;
  const originalJson = res.json;

  let responseBody: any;

  // Interceptar res.json para capturar o corpo da resposta
  res.json = function (body: any): Response {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // Interceptar res.send para capturar o corpo da resposta
  res.send = function (body: any): Response {
    responseBody = body;
    return originalSend.call(this, body);
  };

  // Quando a resposta é finalizada
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Dados da requisição
    const logData: any = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      contentLength: res.get('content-length'),
      timestamp: new Date().toISOString()
    };

    // Fase F Multi-Tenant: carimbo de tenant em TODA linha de request —
    // pré-requisito de observabilidade por município (dashboards/alertas).
    if ((req as any).tenantId) {
      logData.tenantId = (req as any).tenantId;
    }

    // Adicionar userId se autenticado
    if ((req as any).user?.id) {
      logData.userId = (req as any).user.id;
      logData.userRole = (req as any).user.role;
    }

    // Adicionar departmentId se presente
    if ((req as any).user?.departmentId) {
      logData.departmentId = (req as any).user.departmentId;
    }

    // Log de erro para status >= 400
    if (statusCode >= 400) {
      logData.errorResponse = typeof responseBody === 'string'
        ? responseBody.substring(0, 200) // Limitar tamanho
        : responseBody?.error || responseBody?.message;

      // Log de query params e body para debugging (sanitizado)
      if (req.query && Object.keys(req.query).length > 0) {
        logData.queryParams = req.query;
      }

      if (req.body && Object.keys(req.body).length > 0) {
        // Não logar o body completo em produção (pode ser muito grande)
        logData.hasBody = true;
        logData.bodyKeys = Object.keys(req.body);
      }

      httpLogger.warn('HTTP Error Response', logData);
    }
    // Log normal para sucesso
    else if (statusCode >= 200 && statusCode < 300) {
      httpLogger.info('HTTP Success', logData);
    }
    // Log de redirecionamento
    else if (statusCode >= 300 && statusCode < 400) {
      logData.redirectTo = res.get('location');
      httpLogger.info('HTTP Redirect', logData);
    }
  });

  next();
};

/**
 * Middleware simplificado para rotas que não precisam de logging detalhado
 * Útil para health checks, static files, etc
 */
export const simpleRequestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logRequest(req, res.statusCode, responseTime);
  });

  next();
};

export default requestLoggerMiddleware;
