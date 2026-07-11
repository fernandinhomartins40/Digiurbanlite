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
import { requiresTokenClaim, reportTenantFailSoft } from '../lib/tenant-telemetry';

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
    // 1) Resolução por HOST (subdomínio/domínio custom). Se o host identifica
    //    um tenant ESPECÍFICO (não o default), ele tem precedência absoluta —
    //    ninguém troca de município via header estando num subdomínio próprio.
    tenant = await TenantService.getByHost(req.hostname);

    // 2) Se o host caiu no DEFAULT (domínio raiz / localhost), a SELEÇÃO do
    //    cidadão vale: header X-Tenant-Slug (seletor do portal) ou cookie.
    //    Assim um único domínio serve todos os municípios via dropdown.
    const isDefaultHost = !tenant || tenant.id === DEFAULT_TENANT_ID;
    if (isDefaultHost) {
      const selected =
        (req.headers['x-tenant-slug'] as string | undefined)?.trim() ||
        req.cookies?.digiurban_tenant_slug;
      if (selected) {
        const bySelection = await TenantService.getBySlug(selected);
        if (bySelection && bySelection.status === 'ACTIVE') {
          tenant = bySelection;
        }
      }
    }
  } catch (error) {
    // Transitório: sem enforcement dependente, não derrubar a request.
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
        type?: string;
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

      // ✅ Fase D — fim da janela de dupla aceitação: token VÁLIDO sem claim
      // de tenant é sessão do modo single-tenant. Telemetria sempre; com
      // TENANT_REQUIRE_TOKEN_CLAIM=1 exige novo login (o login novo emite o
      // claim). Tokens type='platform' não têm claim POR DESIGN — isentos.
      if (!decoded.tenantId && decoded.type !== 'platform') {
        reportTenantFailSoft('jwt-sem-claim', {
          path: req.originalUrl || req.path,
          tokenType: decoded.type,
        });
        if (requiresTokenClaim()) {
          _res.status(401).json({
            error: 'Sessão expirada',
            message: 'Sua sessão é anterior à atualização do sistema. Faça login novamente.',
            code: 'TENANT_CLAIM_REQUIRED',
          });
          return;
        }
      }
    } catch {
      // Assinatura inválida/expirada: deixar o middleware de auth responder
      // com a mensagem apropriada (aqui só interessa o claim de tenant).
    }
  }

  runAsTenant(tenantId, () => next());
};

export default tenantContextMiddleware;
