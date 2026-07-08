/**
 * ============================================================================
 * TENANT CONTEXT MIDDLEWARE (Fase 1 do plano Multi-Tenant)
 * ============================================================================
 * Estabelece o contexto de tenant para toda requisição HTTP:
 * - popula o AsyncLocalStorage (lib/tenant-context.ts)
 * - anexa `req.tenant` (reativa logFromRequest do audit-logger, que exigia isso)
 *
 * FASE ATUAL (single-tenant em transição): todo host resolve para o tenant
 * default. Na Fase 4 a resolução passa a ser host + claim do JWT (fail-closed).
 *
 * Resiliência transitória: se a migration de tenants ainda não foi aplicada e
 * municipio_config está vazio (instalação nova), a requisição segue com o
 * DEFAULT_TENANT_ID sintético — nenhum enforcement depende disso ainda.
 */

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { runAsTenant } from '../lib/tenant-context';
import { TenantService, DEFAULT_TENANT_ID, TenantRecord } from '../services/tenant.service';
import { logger } from '../config/logger.config';
import { logAuditEvent } from '../utils/audit-logger';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenant?: TenantRecord | null;
      tenantId?: string;
    }
  }
}

export const tenantContextMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  let tenant: TenantRecord | null = null;

  try {
    tenant = await TenantService.getByHost(req.hostname);
  } catch (error) {
    // Transitório (Fase 1): sem enforcement dependente, não derrubar a request.
    // A partir da Fase 3/4 este caminho vira fail-closed (503).
    logger.warn('tenantContextMiddleware: falha ao resolver tenant, usando default sintético', {
      host: req.hostname,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const tenantId = tenant?.id || DEFAULT_TENANT_ID;

  req.tenant = tenant;
  req.tenantId = tenantId;

  // ✅ Fase 4 — CHOKEPOINT de claim de tenant: valida aqui, ANTES de qualquer
  // caminho de auth (a base tem múltiplas verificações JWT — middlewares
  // dedicados E verificações inline em rotas como /me). Token assinado com
  // claim de OUTRO tenant morre aqui, independentemente do caminho seguinte.
  // Token sem claim (legado) e token inválido seguem para o auth normal.
  const presentedToken =
    req.cookies?.digiurban_admin_token ||
    req.cookies?.digiurban_citizen_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.substring(7)
      : undefined);

  if (presentedToken && process.env.JWT_SECRET) {
    try {
      const decoded = jwt.verify(presentedToken, process.env.JWT_SECRET) as {
        userId?: string;
        citizenId?: string;
        tenantId?: string;
      };
      if (decoded.tenantId && decoded.tenantId !== tenantId) {
        logAuditEvent({
          userId: decoded.userId,
          citizenId: decoded.citizenId,
          action: 'tenant_claim_mismatch',
          resource: req.originalUrl || req.path,
          method: req.method,
          details: { tokenTenant: decoded.tenantId, requestTenant: tenantId, context: 'tenant-context-chokepoint' },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          success: false,
          errorMessage: 'JWT de outro tenant'
        }).catch(() => undefined);
        _res.status(401).json({ error: 'Token não pertence a este município' });
        return;
      }
    } catch {
      // Assinatura inválida/expirada: deixar o middleware de auth responder
      // com a mensagem apropriada (aqui só interessa o claim de tenant).
    }
  }

  runAsTenant(tenantId, () => next());
};

export default tenantContextMiddleware;
