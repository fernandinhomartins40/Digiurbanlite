/**
 * ============================================================================
 * UPLOADS ACCESS MIDDLEWARE (Fase 0 — achado S1 da auditoria)
 * ============================================================================
 * Fecha o acesso anônimo ao diretório /uploads.
 *
 * Regras:
 * - Prefixos em PUBLIC_PREFIXES continuam públicos (branding, avatares —
 *   ativos de baixa sensibilidade referenciados em contextos sem cookie).
 * - Todo o resto (documents/, protocols/, bot/…) exige JWT válido de admin
 *   OU de cidadão (cookie httpOnly ou Authorization: Bearer).
 *
 * Escopo deliberado: valida autenticidade do token, sem round-trip ao banco —
 * é um gate de leitura de arquivos estáticos. A verificação de OWNERSHIP por
 * arquivo (quem pode baixar o quê) permanece nas rotas de download dedicadas
 * (ex.: /api/protocols/:id/documents/:docId/download) e será generalizada na
 * Fase 6 (particionamento uploads/{tenantId}/ + serviço de arquivos).
 *
 * Traversal: express.static resolve e confina o path; este middleware ainda
 * rejeita padrões de traversal explícitos antes por defesa em profundidade.
 */

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { logger } from '../config/logger.config';

const PUBLIC_PREFIXES = ['/avatars/', '/public/', '/branding/'];

export const uploadsAccessMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Defesa em profundidade contra path traversal (express.static já confina)
  const rawPath = decodeURIComponent(req.path);
  if (rawPath.includes('..') || rawPath.includes('\0')) {
    res.status(400).json({ error: 'Caminho inválido' });
    return;
  }

  if (PUBLIC_PREFIXES.some((prefix) => rawPath.startsWith(prefix))) {
    return next();
  }

  const token =
    req.cookies?.digiurban_admin_token ||
    req.cookies?.digiurban_citizen_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.substring(7)
      : undefined);

  if (!token) {
    res.status(401).json({ error: 'Autenticação necessária para acessar arquivos' });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({ error: 'Configuração de segurança inválida' });
    return;
  }

  try {
    jwt.verify(token, jwtSecret);
    next();
  } catch {
    logger.warn('uploads-access: token inválido', { path: rawPath, ip: req.ip });
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

export default uploadsAccessMiddleware;
