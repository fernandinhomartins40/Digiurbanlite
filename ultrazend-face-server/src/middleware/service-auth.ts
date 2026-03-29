import type { NextFunction, Request, Response } from 'express';

export function serviceAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const expectedToken = process.env.FACE_PLATFORM_SERVICE_TOKEN;

  if (!expectedToken) {
    return res.status(500).json({ error: 'Face service token not configured' });
  }

  if (!token) {
    return res.status(401).json({ error: 'Service token required' });
  }

  if (token !== expectedToken) {
    return res.status(401).json({ error: 'Invalid service token' });
  }

  next();
}

export default serviceAuthMiddleware;
