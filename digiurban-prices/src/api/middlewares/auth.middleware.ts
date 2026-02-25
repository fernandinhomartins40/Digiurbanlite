import { Request, Response, NextFunction } from 'express';
import { config } from '../../config/config';
import { logger } from '../../utils/logger';

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key =
    req.headers['x-digiurban-key'] ??
    req.headers['authorization']?.replace('Bearer ', '');

  if (!config.security.apiKey) {
    logger.warn('[Auth] DIGIURBAN_API_KEY not configured — blocking request');
    res.status(503).json({ error: 'Service not configured' });
    return;
  }

  if (!key || key !== config.security.apiKey) {
    res.status(401).json({ error: 'Unauthorized: invalid or missing API key' });
    return;
  }

  next();
}

// Middleware para rotas de ingestão (proteção extra)
export function ingestAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const adminKey = req.headers['x-digiurban-admin-key'] ?? req.headers['x-digiurban-key'];
  if (!adminKey || adminKey !== config.security.apiKey) {
    res.status(401).json({ error: 'Unauthorized: ingest endpoint requires valid API key' });
    return;
  }
  next();
}
