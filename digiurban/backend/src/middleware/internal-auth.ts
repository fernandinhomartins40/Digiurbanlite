import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de autenticação para chamadas internas de serviços
 * Valida o token de serviço configurado no .env
 */
export const internalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const expectedToken = process.env.DIGIURBAN_SERVICE_TOKEN;

    if (!expectedToken) {
      console.error('[internalAuthMiddleware] DIGIURBAN_SERVICE_TOKEN not configured');
      return res.status(500).json({ error: 'Service token not configured' });
    }

    if (!token) {
      return res.status(401).json({ error: 'Service token required' });
    }

    if (token !== expectedToken) {
      console.error('[internalAuthMiddleware] Invalid service token');
      return res.status(401).json({ error: 'Invalid service token' });
    }

    // Token válido, prosseguir
    next();
  } catch (error) {
    console.error('[internalAuthMiddleware] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default internalAuthMiddleware;
