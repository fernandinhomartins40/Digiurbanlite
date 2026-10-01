/**
 * Gate de leitura de /uploads (documentos e imagens enviados ao bot).
 *
 * Antes, express.static servia a pasta SEM autenticação e a porta 9001 é
 * exposta — documentos de cidadãos (RG, comprovantes) ficavam acessíveis a
 * quem acertasse o nome do arquivo (timestamp + 6 caracteres). LGPD art. 46.
 *
 * Agora: exige JWT válido (cidadão, servidor ou equipe da plataforma) por
 * cookie httpOnly ou Bearer. Arquivos novos usam UUID (impossível adivinhar).
 * Como no backend (middleware/uploads-access.ts), path traversal é barrado.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export function uploadsAccess(req: Request, res: Response, next: NextFunction): void {
  let rawPath = '';
  try {
    rawPath = decodeURIComponent(req.path);
  } catch {
    res.status(400).json({ error: 'Caminho inválido' });
    return;
  }
  if (rawPath.includes('..') || rawPath.includes('\0')) {
    res.status(400).json({ error: 'Caminho inválido' });
    return;
  }

  const auth = req.headers.authorization;
  const token =
    (auth?.startsWith('Bearer ') ? auth.substring(7) : undefined) ||
    req.cookies?.digiurban_admin_token ||
    req.cookies?.digiurban_citizen_token ||
    req.cookies?.digiurban_platform_token;

  if (!token) {
    res.status(401).json({ error: 'Faça login para ver este arquivo' });
    return;
  }
  try {
    verifyToken(token);
  } catch {
    res.status(401).json({ error: 'Sessão expirada' });
    return;
  }

  // Documento pessoal: nunca em cache compartilhado (proxy/CDN)
  res.setHeader('Cache-Control', 'private, no-store');
  next();
}
