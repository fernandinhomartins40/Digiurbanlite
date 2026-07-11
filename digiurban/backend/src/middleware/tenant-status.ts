/**
 * ============================================================================
 * TENANT STATUS + USAGE LIMITS (Fase 3/8 Multi-Tenant)
 * ============================================================================
 * Reativa — agora por tenant e fail-closed — a lógica que existia inerte em
 * `municipio-status.ts` (achado P3 da auditoria: middleware nunca registrado).
 *
 * Fonte de verdade: o tenant já resolvido pelo tenantContextMiddleware
 * (req.tenant). NÃO consulta o banco de novo — o TenantService já cacheia.
 *
 * Diferença crítica em relação ao middleware morto anterior:
 *   - opera sobre `Tenant` (não sobre o singleton municipio_config);
 *   - fail-CLOSED: se o tenant não resolve, bloqueia (o anterior era fail-open).
 * Rotas públicas e de plataforma (super-admin) ficam de fora para permitir
 * regularização e operação da plataforma sobre tenants suspensos.
 */

import { Request, Response, NextFunction } from 'express';
import { TenantRecord } from '../services/tenant.service';

// Prefixos liberados mesmo com tenant suspenso/inadimplente.
const BYPASS_PREFIXES = [
  '/api/public/',
  '/api/platform', // console de plataforma (Fase C) opera sobre tenant suspenso
  '/api/super-admin', // legado — dupla aceitação até o corte (Fase D/H)
  '/api/admin/auth/login',
  '/api/admin/auth/logout',
  '/api/citizen/auth/login',
  '/api/citizen/auth/logout',
  '/health',
];

const SUSPENDED_STATUSES = new Set(['SUSPENDED', 'CANCELLED', 'EXPIRED']);

export const tenantStatusMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Usar originalUrl (caminho completo): montado com app.use('/api', ...),
  // req.path seria relativo ao ponto de montagem e não bateria com os prefixos.
  const fullPath = (req.originalUrl || req.url).split('?')[0];
  if (BYPASS_PREFIXES.some((p) => fullPath.startsWith(p))) {
    return next();
  }

  const tenant = (req as any).tenant as TenantRecord | null | undefined;

  // FAIL-CLOSED: sem tenant resolvido, não há como garantir isolamento/plano.
  // (Em transição, hosts conhecidos sempre resolvem o default; um miss aqui é
  // sinal de host desconhecido ou tenants indisponível — bloquear é o correto.)
  if (!tenant) {
    res.status(503).json({
      error: 'Município não identificado',
      message: 'Não foi possível identificar o município desta requisição.',
      code: 'TENANT_UNRESOLVED',
    });
    return;
  }

  if (SUSPENDED_STATUSES.has(tenant.status) || tenant.paymentStatus === 'suspended') {
    res.status(403).json({
      error: 'Município suspenso',
      message:
        tenant.suspensionReason ||
        'O acesso ao sistema foi temporariamente suspenso. Entre em contato com o suporte.',
      code: 'TENANT_SUSPENDED',
    });
    return;
  }

  if (tenant.status === 'INACTIVE') {
    res.status(403).json({
      error: 'Município inativo',
      message: 'O acesso ao sistema está desativado. Entre em contato com o suporte.',
      code: 'TENANT_INACTIVE',
    });
    return;
  }

  // Pagamento em atraso: avisa mas não bloqueia (grace period).
  if (tenant.paymentStatus === 'overdue') {
    res.set('X-Payment-Warning', 'overdue');
  }

  next();
};

export default tenantStatusMiddleware;
