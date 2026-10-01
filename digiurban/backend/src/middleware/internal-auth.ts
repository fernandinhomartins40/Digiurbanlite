import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { acceptedInternalTokens, KNOWN_DEFAULT_TOKENS } from '../services/platform-secrets.service';

/**
 * Autenticação das chamadas internas (messages-server → backend).
 *
 * Token aceito, em ordem:
 *   1. o gerado pelo painel (Super-admin › Chaves de API › Comunicação interna),
 *      guardado cifrado no banco — e o anterior por 10 min durante a troca;
 *   2. sem token do painel: DIGIURBAN_SERVICE_TOKEN do .env (compatibilidade).
 * Depois que o painel gera um token, o valor padrão público do compose
 * ("ultrazend-messages-service-token") deixa de ser aceito.
 */

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export const internalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    if (!token) {
      return res.status(401).json({ error: 'Service token required' });
    }

    const { db, hasDbToken } = await acceptedInternalTokens();
    const envToken = process.env.DIGIURBAN_SERVICE_TOKEN || '';
    const accepted = hasDbToken
      ? [...db, ...(envToken && !KNOWN_DEFAULT_TOKENS.includes(envToken) ? [envToken] : [])]
      : envToken
        ? [envToken]
        : [];

    if (accepted.length === 0) {
      console.error('[internalAuthMiddleware] nenhum token interno configurado (gere um no painel)');
      return res.status(500).json({ error: 'Service token not configured' });
    }

    if (!accepted.some((t) => safeEqual(token, t))) {
      console.error('[internalAuthMiddleware] Invalid service token');
      return res.status(401).json({ error: 'Invalid service token' });
    }

    next();
  } catch (error) {
    console.error('[internalAuthMiddleware] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default internalAuthMiddleware;
