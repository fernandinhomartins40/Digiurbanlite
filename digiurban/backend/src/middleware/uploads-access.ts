/**
 * ============================================================================
 * UPLOADS ACCESS MIDDLEWARE (Fase 0 — achado S1 | Fase B — isolamento por tenant)
 * ============================================================================
 * Gate de leitura do diretório estático /uploads.
 *
 * Camadas:
 * 1. Anti-traversal (defesa em profundidade; express.static já confina).
 * 2. Prefixos públicos (branding, avatares) seguem públicos — ativos de baixa
 *    sensibilidade referenciados em contextos sem cookie.
 * 3. Autenticação: JWT válido de admin OU cidadão (cookie httpOnly ou Bearer).
 * 4. ISOLAMENTO (Fase B):
 *    - Layout particionado /t/{tenantId}/...: o tenant do path deve casar com
 *      o claim do token (token legado sem claim = tenant default). Divergência
 *      → 404 (não confirma existência).
 *    - Layout legado /protocols/{protocolId}/...: ownership por lookup — o
 *      tenant do protocolo deve casar com o do requisitante. Se o arquivo já
 *      migrou para o layout novo, a URL antiga é reescrita internamente
 *      (links emitidos por e-mail continuam funcionando após a migração).
 *    - Demais prefixos legados (documents/, generated/...): apenas JWT válido
 *      (resíduo de transição — esvazia com scripts/migrate-uploads-tenant.ts;
 *      remoção do resíduo no gate da Fase H).
 */

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../config/logger.config';
import { DEFAULT_TENANT_ID, runAsPlatform } from '../lib/tenant-context';
import { TENANT_UPLOADS_SEGMENT } from '../config/upload';

const PUBLIC_PREFIXES = ['/avatars/', '/public/', '/branding/'];

/** Prefixo do layout particionado: /t/{tenantId}/... */
const TENANT_PREFIX = `/${TENANT_UPLOADS_SEGMENT}/`;

interface UploadTokenClaims {
  tenantId?: string;
}

/**
 * Tenant efetivo do requisitante: claim do JWT, ou default para token legado
 * sem claim (mesma janela de transição dos middlewares de auth — expira na
 * Fase D).
 */
function requesterTenantId(claims: UploadTokenClaims): string {
  return claims.tenantId || DEFAULT_TENANT_ID;
}

/** Extrai o tenant do path particionado: "/t/{tenantId}/..." → tenantId */
function tenantFromPath(rawPath: string): string | null {
  if (!rawPath.startsWith(TENANT_PREFIX)) return null;
  const rest = rawPath.slice(TENANT_PREFIX.length);
  const slash = rest.indexOf('/');
  if (slash <= 0) return null;
  return rest.slice(0, slash);
}

export const uploadsAccessMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

  let claims: UploadTokenClaims;
  try {
    claims = jwt.verify(token, jwtSecret) as UploadTokenClaims;
  } catch {
    logger.warn('uploads-access: token inválido', { path: rawPath, ip: req.ip });
    res.status(401).json({ error: 'Token inválido ou expirado' });
    return;
  }

  const requester = requesterTenantId(claims);

  // ── Layout particionado: /t/{tenantId}/... — comparação pura, sem banco ──
  const pathTenant = tenantFromPath(rawPath);
  if (pathTenant) {
    if (pathTenant !== requester) {
      logger.warn('uploads-access: acesso cross-tenant negado', {
        path: rawPath,
        requesterTenant: requester,
        ip: req.ip,
      });
      // 404 (não 403): não confirmar a existência do arquivo de outro tenant
      res.status(404).json({ error: 'Arquivo não encontrado' });
      return;
    }
    return next();
  }

  // ── Layout legado /protocols/{protocolId}/... — ownership por lookup ──
  if (rawPath.startsWith('/protocols/')) {
    const segments = rawPath.split('/').filter(Boolean); // ['protocols', pid, file...]
    const protocolId = segments[1];
    if (!protocolId) {
      res.status(404).json({ error: 'Arquivo não encontrado' });
      return;
    }

    try {
      // Import tardio: evita ciclo (prisma → extension → tenant-context)
      const { prisma } = await import('../lib/prisma');
      const protocol = await runAsPlatform(async () =>
        await prisma.protocolSimplified.findFirst({
          where: { id: protocolId },
          select: { tenantId: true },
        })
      );

      const ownerTenant = protocol?.tenantId || DEFAULT_TENANT_ID;
      if (!protocol || ownerTenant !== requester) {
        logger.warn('uploads-access: acesso legado cross-tenant negado', {
          path: rawPath,
          requesterTenant: requester,
          ip: req.ip,
        });
        res.status(404).json({ error: 'Arquivo não encontrado' });
        return;
      }

      // Arquivo já migrado para o layout novo? Reescrever a URL internamente
      // para que links antigos (e-mails, PDFs) continuem funcionando.
      const legacyPhysical = path.join(process.cwd(), 'uploads', rawPath.slice(1));
      if (!fs.existsSync(legacyPhysical)) {
        const rewritten = `/${TENANT_UPLOADS_SEGMENT}/${ownerTenant}${rawPath}`;
        const newPhysical = path.join(process.cwd(), 'uploads', rewritten.slice(1));
        if (fs.existsSync(newPhysical)) {
          req.url = rewritten;
        }
      }
      return next();
    } catch (error) {
      logger.error('uploads-access: falha no lookup de ownership legado', {
        path: rawPath,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: 'Erro ao validar acesso ao arquivo' });
      return;
    }
  }

  // ── Demais prefixos legados: apenas JWT válido (resíduo de transição) ──
  next();
};

export default uploadsAccessMiddleware;
