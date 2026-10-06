/**
 * Gate de leitura de /uploads (documentos e imagens enviados no chat e ao bot).
 *
 * Histórico: antes era público (LGPD art. 46); depois passou a exigir login —
 * mas QUALQUER login abria QUALQUER arquivo (os nomes antigos são previsíveis).
 *
 * Agora o arquivo precisa estar numa mensagem de uma conversa que a pessoa
 * pode ver:
 *  - cidadão: conversas em que ele participa;
 *  - servidor: conversas do próprio município;
 *  - equipe da plataforma: qualquer uma (suporte).
 * Arquivo que não está em mensagem nenhuma (ex.: temporário do bot) não abre.
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { verifyToken } from '../utils/jwt';
import { normalizeChatPayload, pickSessionToken, portalFrom } from '../utils/authToken';
import { DEFAULT_TENANT_ID } from '../utils/tenant';

interface Holder {
  tenantId: string | null;
  participant1Id: string;
  participant1Type: string;
  participant2Id: string;
  participant2Type: string;
}

export async function uploadsAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  let rawPath = '';
  try {
    rawPath = decodeURIComponent(req.path);
  } catch {
    res.status(400).json({ error: 'Caminho inválido' });
    return;
  }
  // "%" é curinga do LIKE abaixo; os arquivos gerados não usam
  if (rawPath.includes('..') || rawPath.includes('\0') || rawPath.includes('%')) {
    res.status(400).json({ error: 'Caminho inválido' });
    return;
  }
  if (rawPath.startsWith('/bot-temp/')) {
    res.status(404).end();
    return;
  }

  const auth = req.headers.authorization;
  const token =
    (auth?.startsWith('Bearer ') ? auth.substring(7) : undefined) ||
    pickSessionToken(req.cookies || {}, portalFrom(undefined, req.get('referer')));

  if (!token) {
    res.status(401).json({ error: 'Faça login para ver este arquivo' });
    return;
  }
  let user: any;
  try {
    user = normalizeChatPayload(verifyToken(token) as any);
  } catch {
    res.status(401).json({ error: 'Sessão expirada' });
    return;
  }

  if (!user.isPlatformOperator) {
    const needle = `%/uploads${rawPath.replace(/\\/g, '').replace(/_/g, '\\_')}%`;
    let holders: Holder[] = [];
    try {
      holders = await prisma.$queryRaw<Holder[]>`
      SELECT c."tenantId", c."participant1Id", c."participant1Type", c."participant2Id", c."participant2Type"
      FROM messages m
      JOIN conversations c ON c.id = m."conversationId"
      WHERE m.attachments::text LIKE ${needle}
      LIMIT 20
    `;
    } catch {
      res.status(500).json({ error: 'Não foi possível conferir o acesso ao arquivo' });
      return;
    }
    const tenant = user.tenantId || DEFAULT_TENANT_ID;
    const allowed = holders.some((h) =>
      user.userType === 'CITIZEN'
        ? (h.participant1Id === user.userId && h.participant1Type === 'CITIZEN') ||
          (h.participant2Id === user.userId && h.participant2Type === 'CITIZEN')
        : (h.tenantId || DEFAULT_TENANT_ID) === tenant
    );
    if (!allowed) {
      res.status(404).json({ error: 'Arquivo não encontrado' });
      return;
    }
  }

  // Documento pessoal: nunca em cache compartilhado (proxy/CDN)
  res.setHeader('Cache-Control', 'private, no-store');
  next();
}
