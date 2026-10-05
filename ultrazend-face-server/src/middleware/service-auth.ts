import type { NextFunction, Request, Response } from 'express';
import { acceptedServiceTokens, isPublicDefaultToken, safeEqual } from '../utils/secrets';
import logger from '../utils/logger';

let warnedPublicDefault = false;

/**
 * Só o backend (com o token interno) chama este serviço. Toda chamada de
 * município traz X-Tenant-Id: as consultas são sempre filtradas por ele.
 */
export async function serviceAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer /, '') || '';
  if (!token) {
    return res.status(401).json({ error: 'Token de serviço obrigatório' });
  }

  const accepted = await acceptedServiceTokens();
  if (!accepted.some((candidate) => safeEqual(candidate, token))) {
    return res.status(401).json({ error: 'Token de serviço inválido' });
  }

  if (isPublicDefaultToken(token) && !warnedPublicDefault) {
    warnedPublicDefault = true;
    logger.warn('Serviço facial usando o token PADRÃO do código. Gere um novo em Super-admin › Chaves de API › Comunicação interna.');
  }

  next();
}

/** Rotas de município: exige o município da chamada */
export function requireTenant(req: Request, res: Response, next: NextFunction) {
  const tenantId = String(req.headers['x-tenant-id'] || '').trim();
  if (!tenantId) {
    return res.status(400).json({ error: 'Município da requisição não informado' });
  }
  (req as any).tenantId = tenantId;
  next();
}

export default serviceAuthMiddleware;
