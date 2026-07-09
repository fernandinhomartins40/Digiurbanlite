/**
 * ============================================================================
 * TENANT CONTEXT (Fase 1/3 do plano Multi-Tenant)
 * ============================================================================
 * Contexto de tenant por requisição via AsyncLocalStorage.
 *
 * - HTTP: populado pelo tenantContextMiddleware (middleware/tenant-context.ts)
 * - Jobs/seeds/workers: usar runAsTenant(tenantId, fn) explicitamente
 * - Operações de plataforma (cross-tenant): usar runAsPlatform(fn) — auditável
 *
 * REGRA (fail-closed): getTenantId() lança erro se não houver contexto.
 * Código que legitimamente opera sem tenant deve usar tryGetTenantId().
 */

import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  /** true quando executando como operador de plataforma (cross-tenant) */
  isPlatform: boolean;
}

const storage = new AsyncLocalStorage<TenantContext>();

/** Sentinela para operações de plataforma (nunca deve chegar a uma query filtrada) */
export const PLATFORM_CONTEXT_ID = '__platform__';

/**
 * Identidade do tenant default (município migrado do modo single-tenant).
 * Definido aqui (módulo sem dependências) para evitar ciclos de import entre
 * lib/prisma, a extension de tenant e o TenantService.
 */
export const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || 'tenant-default';
export const DEFAULT_TENANT_SLUG = 'default';

/**
 * Executa fn dentro do contexto de um tenant específico.
 * Uso obrigatório em jobs BullMQ, crons e seeds.
 *
 * ⚠️ GOTCHA (PrismaPromise é lazy): operações Prisma só executam no await.
 * SEMPRE await DENTRO do callback, senão a query roda fora do contexto:
 *   ✗ runAsTenant(id, () => prisma.x.create(...))          // contexto perdido
 *   ✓ runAsTenant(id, async () => await prisma.x.create(...))
 */
export function runAsTenant<T>(tenantId: string, fn: () => T): T {
  if (!tenantId) {
    throw new Error('runAsTenant: tenantId é obrigatório');
  }
  return storage.run({ tenantId, isPlatform: false }, fn);
}

/**
 * Executa fn como operação de plataforma (sem escopo de tenant).
 * Toda chamada deve ser justificável em auditoria — usar com parcimônia.
 */
export function runAsPlatform<T>(fn: () => T): T {
  return storage.run({ tenantId: PLATFORM_CONTEXT_ID, isPlatform: true }, fn);
}

/**
 * Retorna o tenantId do contexto atual.
 * FAIL-CLOSED: lança erro se não houver contexto estabelecido.
 */
export function getTenantId(): string {
  const ctx = storage.getStore();
  if (!ctx) {
    throw new Error(
      'Tenant context ausente. Requisições HTTP devem passar pelo tenantContextMiddleware; ' +
        'jobs devem usar runAsTenant()/runAsPlatform().'
    );
  }
  return ctx.tenantId;
}

/** Retorna o tenantId atual ou undefined (para código tolerante a ausência de contexto). */
export function tryGetTenantId(): string | undefined {
  return storage.getStore()?.tenantId;
}

/**
 * Executa uma transação com o GUC `app.tenant_id` setado, ativando o RLS do
 * PostgreSQL (Fase 3) DENTRO da transação — use para blocos com `$queryRaw`
 * sensível, onde a Prisma extension não filtra. `SET LOCAL` é escopado à
 * transação (correto com connection pooling / PgBouncer transaction mode).
 *
 *   await withTenantTransaction(prisma, async (tx) => {
 *     return tx.$queryRaw`SELECT ... FROM protocols_simplified WHERE ...`;
 *   });
 */
export async function withTenantTransaction<T>(
  prisma: { $transaction: <R>(fn: (tx: any) => Promise<R>) => Promise<R> },
  fn: (tx: any) => Promise<T>
): Promise<T> {
  const ctx = storage.getStore();
  const tenantId = ctx?.tenantId ?? PLATFORM_CONTEXT_ID;
  return prisma.$transaction(async (tx: any) => {
    // set_config com is_local=true => vale só nesta transação
    await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', $1, true)`, tenantId);
    return fn(tx);
  });
}

/** Retorna o contexto completo ou undefined. */
export function tryGetTenantContext(): TenantContext | undefined {
  return storage.getStore();
}
