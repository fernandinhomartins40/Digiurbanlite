/**
 * Middleware de Rate Limiting
 * Proteção contra ataques de força bruta e DDoS
 */

import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '../config/security';

/**
 * Rate limiter para rotas de login
 * Limita tentativas de login para prevenir força bruta
 */
export const loginRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_ATTEMPTS,
  message: {
    error: 'Too many requests',
    message: RATE_LIMIT.MESSAGE,
    retryAfter: Math.ceil(RATE_LIMIT.WINDOW_MS / 1000 / 60), // em minutos
  },
  standardHeaders: true, // Retorna rate limit info nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
  skipSuccessfulRequests: false, // Conta requisições bem-sucedidas
  skipFailedRequests: false, // Conta requisições que falharam
  handler: (req, res) => {
    console.warn(`[SECURITY] Rate limit exceeded for IP: ${req.ip}, Tenant: ${(req as any).tenant?.id}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: RATE_LIMIT.MESSAGE,
      retryAfter: Math.ceil(RATE_LIMIT.WINDOW_MS / 1000 / 60)
        });
  }
        });

/**
 * Rate limiter mais permissivo para rotas gerais de API
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requisições por minuto
  message: {
    error: 'Too many requests',
    message: 'Muitas requisições. Por favor, aguarde um momento.'
        },
  standardHeaders: true,
  legacyHeaders: false
        });

/**
 * Rate limiter para rotas de registro
 * Mais restritivo para prevenir spam
 */
export const registerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 registros por 15 minutos
  message: {
    error: 'Too many registrations',
    message: 'Muitas tentativas de cadastro. Tente novamente em 15 minutos.'
        },
  standardHeaders: true,
  legacyHeaders: false
        });

/**
 * Rate limiter para operações sensíveis (mudança de senha, etc)
 */
export const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 operações por hora
  message: {
    error: 'Too many sensitive operations',
    message: 'Muitas operações sensíveis. Tente novamente em 1 hora.'
        },
  standardHeaders: true,
  legacyHeaders: false
        });

/**
 * Rate limiter para reset de senha
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // 3 tentativas
  message: {
    error: 'Too many password reset attempts',
    message: 'Muitas tentativas de reset de senha. Tente novamente em 15 minutos.'
        },
  standardHeaders: true,
  legacyHeaders: false
        });

/**
 * Rate limiter para exportação de dados (LGPD)
 */
export const dataExportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: 5, // 5 exportações por dia
  message: {
    error: 'Too many export requests',
    message: 'Limite de exportações diárias atingido. Tente novamente amanhã.'
        },
  standardHeaders: true,
  legacyHeaders: false
        });
