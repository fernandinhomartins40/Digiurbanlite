/**
 * ============================================================================
 * TENANT ITERATOR (Fase A do plano de evolução Multi-Tenant)
 * ============================================================================
 * Padrão único para jobs/crons que processam dados POR TENANT.
 *
 * Sem isto, um job sem contexto cai no fail-soft da Prisma extension e opera
 * exclusivamente sobre o tenant default — SLA, lembretes e notificações nunca
 * rodariam para o 2º município em diante (risco R1 da auditoria multi-tenant).
 *
 * Regras:
 * - Executa fn dentro de runAsTenant(tenant.id) para cada tenant ACTIVE/TRIAL.
 * - Falha em um tenant NÃO aborta os demais (try/catch individual + log).
 * - Resiliência de transição: tabela tenants ausente ou vazia → itera apenas o
 *   DEFAULT_TENANT_ID (instalação single-tenant ou migrations pendentes).
 *
 * ⚠️ Mesmo gotcha do runAsTenant: PrismaPromise é lazy — todo await deve
 * acontecer DENTRO do callback fn.
 */

import { TenantStatus } from '@prisma/client';
import { prisma } from './prisma';
import {
  runAsTenant,
  runAsPlatform,
  DEFAULT_TENANT_ID,
  DEFAULT_TENANT_SLUG,
} from './tenant-context';
import { logger } from '../config/logger.config';

export interface ActiveTenantRef {
  id: string;
  slug: string;
}

export interface TenantJobSummary {
  total: number;
  succeeded: number;
  failed: Array<{ tenantId: string; slug: string; error: string }>;
}

/**
 * Lista os tenants em operação (ACTIVE e TRIAL). Suspensos/cancelados ficam de
 * fora — jobs não devem processar municípios bloqueados pelo tenantStatus.
 */
export async function listActiveTenants(): Promise<ActiveTenantRef[]> {
  try {
    const tenants = await runAsPlatform(
      async () =>
        await prisma.tenant.findMany({
          where: { status: { in: [TenantStatus.ACTIVE, TenantStatus.TRIAL] } },
          select: { id: true, slug: true },
          orderBy: { createdAt: 'asc' },
        })
    );
    if (tenants.length > 0) return tenants;
    logger.warn('tenant-iterator: nenhum tenant ativo encontrado — iterando o default (transição)');
  } catch (error) {
    logger.warn('tenant-iterator: falha ao listar tenants — iterando o default (transição)', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  return [{ id: DEFAULT_TENANT_ID, slug: DEFAULT_TENANT_SLUG }];
}

/**
 * Executa fn uma vez por tenant ativo, com contexto de tenant estabelecido.
 *
 *   await forEachActiveTenant('sla-expiring', async () => {
 *     await NotificationTriggers.checkSLAExpiring();
 *   });
 */
export async function forEachActiveTenant(
  jobLabel: string,
  fn: (tenant: ActiveTenantRef) => Promise<void>
): Promise<TenantJobSummary> {
  const tenants = await listActiveTenants();
  const summary: TenantJobSummary = { total: tenants.length, succeeded: 0, failed: [] };

  for (const tenant of tenants) {
    try {
      await runAsTenant(tenant.id, async () => {
        await fn(tenant);
      });
      summary.succeeded++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      summary.failed.push({ tenantId: tenant.id, slug: tenant.slug, error: message });
      logger.error(`tenant-iterator: job "${jobLabel}" falhou para o tenant ${tenant.slug}`, {
        tenantId: tenant.id,
        error: message,
      });
    }
  }

  if (summary.failed.length > 0) {
    logger.warn(`tenant-iterator: job "${jobLabel}" concluído com falhas`, summary);
  } else {
    logger.info(`tenant-iterator: job "${jobLabel}" concluído`, {
      total: summary.total,
      succeeded: summary.succeeded,
    });
  }

  return summary;
}

export default forEachActiveTenant;
