/**
 * ============================================================================
 * REQUIRE FEATURE (Fase 7 Multi-Tenant — feature gating server-side)
 * ============================================================================
 * Metade "API nega" do princípio do plano ("UI esconde, API nega"): mesmo que
 * um menu escape no frontend, a rota do módulo é bloqueada se a feature não
 * estiver habilitada no plano do tenant.
 *
 * Contrato de `tenant.features` (JSON): ausência de mapa OU ausência da chave =
 * HABILITADO (compat single-tenant); só desabilita com `false` EXPLÍCITO — o
 * mesmo contrato do `useTenantFeature` do frontend, para não divergirem.
 *
 * Fonte: req.tenant (já resolvido/cacheado pelo tenantContextMiddleware) — sem
 * I/O extra.
 */

import { Request, Response, NextFunction } from 'express';
import { TenantRecord } from '../services/tenant.service';

export function isFeatureEnabled(tenant: TenantRecord | null | undefined, feature: string): boolean {
  const features = tenant?.features;
  if (!features || typeof features !== 'object') return true;
  const value = (features as Record<string, unknown>)[feature];
  return value !== false;
}

/**
 * Factory de middleware: bloqueia (403) se a feature estiver desabilitada para
 * o tenant da requisição.
 *
 *   router.use('/saude', requireFeature('saude'), saudeRoutes)
 */
export function requireFeature(feature: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const tenant = (req as any).tenant as TenantRecord | null | undefined;

    if (!isFeatureEnabled(tenant, feature)) {
      res.status(403).json({
        error: 'Módulo indisponível',
        message: `O módulo "${feature}" não está habilitado no plano deste município.`,
        code: 'FEATURE_DISABLED',
        feature,
      });
      return;
    }

    next();
  };
}

export default requireFeature;
