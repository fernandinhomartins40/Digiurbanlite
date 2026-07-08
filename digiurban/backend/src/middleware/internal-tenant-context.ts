/**
 * ============================================================================
 * INTERNAL TENANT CONTEXT (Fase 6 Multi-Tenant — lado backend)
 * ============================================================================
 * O Messages Server chama /api/internal com host interno (backend:3001) — a
 * resolução por host cairia sempre no tenant default, fazendo o bot ler/gravar
 * no município errado. Este middleware corrige o contexto POR REQUISIÇÃO:
 *
 *   1. Header `X-Tenant-Id` (quando o Messages Server passar a enviá-lo —
 *      o JWT do cidadão já carrega o claim desde a Fase 4);
 *   2. Derivação pelo citizenId presente no body/params/query (99% dos
 *      endpoints internos): lookup de plataforma → tenant do cidadão.
 *   3. Sem pista: mantém o contexto atual (default) — endpoints de entrada
 *      sem citizenId (ex.: busca por CPF) só funcionam multi-tenant quando o
 *      Messages Server enviar o header (pendência documentada da Fase 6).
 *
 * Sempre roda APÓS internalAuthMiddleware (token de serviço já validado).
 */

import { Request, Response, NextFunction } from 'express';
import { runAsTenant, runAsPlatform, tryGetTenantId, DEFAULT_TENANT_ID } from '../lib/tenant-context';
import { prisma } from '../lib/prisma';
import { logger } from '../config/logger.config';

function extractCitizenId(req: Request): string | undefined {
  const candidates = [
    (req.body as Record<string, unknown> | undefined)?.citizenId,
    req.params?.citizenId,
    req.query?.citizenId,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c;
  }
  return undefined;
}

export const internalTenantContextMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  let tenantId: string | undefined;

  // 1) Header explícito (Messages Server com Fase 6 completa)
  const header = req.headers['x-tenant-id'];
  if (typeof header === 'string' && header.length > 0) {
    tenantId = header;
  }

  // 2) Derivar do cidadão referenciado na chamada
  if (!tenantId) {
    const citizenId = extractCitizenId(req);
    if (citizenId) {
      try {
        const citizen = await runAsPlatform(async () =>
          await prisma.citizen.findFirst({ where: { id: citizenId }, select: { tenantId: true } })
        );
        tenantId = citizen?.tenantId || undefined;
      } catch (error) {
        logger.warn('internal-tenant-context: falha ao derivar tenant do cidadão', {
          citizenId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  // 3) Fallback: contexto já estabelecido (host interno → default)
  const effective = tenantId || tryGetTenantId() || DEFAULT_TENANT_ID;
  (req as any).tenantId = effective;

  runAsTenant(effective, () => next());
};

export default internalTenantContextMiddleware;
