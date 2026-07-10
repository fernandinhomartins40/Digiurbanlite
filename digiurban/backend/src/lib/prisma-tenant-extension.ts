/**
 * ============================================================================
 * PRISMA TENANT EXTENSION (Fases 2/3 do plano Multi-Tenant)
 * ============================================================================
 * Para todos os models que possuem o campo tenantId (detectados via DMMF —
 * cada nova onda da Fase 2 é coberta automaticamente):
 *
 * ESCRITA (Fase 2): injeta o tenantId do contexto (AsyncLocalStorage) em
 *   create / createMany / upsert.create — nenhuma rota precisa lembrar.
 *   Um tenantId explícito no payload NUNCA é sobrescrito.
 *
 * LEITURA (Fase 3): injeta o filtro de tenant em findMany / findFirst(/OrThrow)
 *   / count / aggregate / groupBy / updateMany / deleteMany.
 *   findUnique(/OrThrow) é reescrito como findFirst com o filtro — necessário
 *   porque o where unique não aceita colunas extras.
 *
 * MUTAÇÃO POR CHAVE ÚNICA (Fase 3): update / delete / upsert fazem preflight
 *   de ownership — alvo existente em OUTRO tenant → erro (mesma mensagem de
 *   "não encontrado", sem vazar existência).
 *
 * EXCEÇÕES: contexto de plataforma (runAsPlatform) não filtra nem injeta.
 *   Sem contexto algum: fail-soft para o tenant default (transição Fase 2/3
 *   com 1 tenant; vira fail-closed quando a Fase 4 ativar tenant por request).
 *
 * ⚠️ Cobertura: queries $queryRaw/$executeRaw NÃO passam por aqui — a camada
 *   RLS do PostgreSQL (etapa seguinte da Fase 3) cobre esse resíduo.
 */

import { Prisma } from '@prisma/client';
import { tryGetTenantId, tryGetTenantContext, DEFAULT_TENANT_ID } from './tenant-context';

/** Models (nomes Prisma, ex.: "User") que possuem campo escalar tenantId. */
const TENANT_SCOPED_MODELS: Set<string> = new Set(
  Prisma.dmmf.datamodel.models
    .filter((m) => m.name !== 'Tenant' && m.fields.some((f) => f.name === 'tenantId' && f.kind === 'scalar'))
    .map((m) => m.name)
);

/** Exportado para diagnóstico/smoke tests. */
export function getTenantScopedModels(): string[] {
  return [...TENANT_SCOPED_MODELS].sort();
}

/** tenantId efetivo para a operação atual, ou undefined para não escopar. */
function resolveTenantId(): string | undefined {
  const ctx = tryGetTenantContext();
  if (ctx?.isPlatform) return undefined; // plataforma: sem escopo
  // Transição (1 tenant): fail-soft para o default; fail-closed chega na Fase 4
  return tryGetTenantId() || DEFAULT_TENANT_ID;
}

function injectIntoData(data: unknown, tenantId: string): void {
  if (!data || typeof data !== 'object') return;
  const record = data as Record<string, unknown>;
  if (record.tenantId !== undefined || record.tenant !== undefined) return;
  record.tenantId = tenantId;
}

/** Mescla o filtro de tenant preservando o where original (via AND). */
function scopeWhere(where: unknown, tenantId: string): Record<string, unknown> {
  if (!where || typeof where !== 'object' || Object.keys(where as object).length === 0) {
    return { tenantId };
  }
  return { AND: [where, { tenantId }] };
}

function notFoundError(model: string): Error {
  // Mesma semântica do P2025 do Prisma: não revela se o registro existe em
  // outro tenant.
  const err = new Error(
    `Registro de ${model} não encontrado no tenant atual (tenant-isolation).`
  ) as Error & { code?: string };
  err.code = 'P2025';
  return err;
}

export const tenantExtension = Prisma.defineExtension((client) =>
  client.$extends({
    name: 'tenant-isolation',
    query: {
      $allModels: {
        // ================= ESCRITA (Fase 2) =================
        async create({ model, args, query }) {
          const tenantId = resolveTenantId();
          if (tenantId && TENANT_SCOPED_MODELS.has(model)) {
            injectIntoData((args as { data?: unknown }).data, tenantId);
          }
          return query(args);
        },
        async createMany({ model, args, query }) {
          const tenantId = resolveTenantId();
          if (tenantId && TENANT_SCOPED_MODELS.has(model)) {
            const data = (args as { data?: unknown }).data;
            if (Array.isArray(data)) {
              for (const item of data) injectIntoData(item, tenantId);
            } else {
              injectIntoData(data, tenantId);
            }
          }
          return query(args);
        },

        // ================= LEITURA (Fase 3) =================
        async findMany({ model, args, query }) {
          const tenantId = resolveTenantId();
          if (tenantId && TENANT_SCOPED_MODELS.has(model)) {
            (args as { where?: unknown }).where = scopeWhere((args as { where?: unknown }).where, tenantId);
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          const tenantId = resolveTenantId();
          if (tenantId && TENANT_SCOPED_MODELS.has(model)) {
            (args as { where?: unknown }).where = scopeWhere((args as { where?: unknown }).where, tenantId);
          }
          return query(args);
        },
        async findFirstOrThrow({ model, args, query }) {
          const tenantId = resolveTenantId();
          if (tenantId && TENANT_SCOPED_MODELS.has(model)) {
            (args as { where?: unknown }).where = scopeWhere((args as { where?: unknown }).where, tenantId);
          }
          return query(args);
        },
        async count({ model, args, query }) {
          const tenantId = resolveTenantId();
          if (tenantId && TENANT_SCOPED_MODELS.has(model)) {
            (args as { where?: unknown }).where = scopeWhere((args as { where?: unknown }).where, tenantId);
          }
          return query(args);
        },
        async aggregate({ model, args, query }) {
          const tenantId = resolveTenantId();
          if (tenantId && TENANT_SCOPED_MODELS.has(model)) {
            (args as { where?: unknown }).where = scopeWhere((args as { where?: unknown }).where, tenantId);
          }
          return query(args);
        },
        async groupBy({ model, args, query }) {
          const tenantId = resolveTenantId();
          if (tenantId && TENANT_SCOPED_MODELS.has(model)) {
            (args as { where?: unknown }).where = scopeWhere((args as { where?: unknown }).where, tenantId);
          }
          return query(args);
        },
        async updateMany({ model, args, query }) {
          const tenantId = resolveTenantId();
          if (tenantId && TENANT_SCOPED_MODELS.has(model)) {
            (args as { where?: unknown }).where = scopeWhere((args as { where?: unknown }).where, tenantId);
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          const tenantId = resolveTenantId();
          if (tenantId && TENANT_SCOPED_MODELS.has(model)) {
            (args as { where?: unknown }).where = scopeWhere((args as { where?: unknown }).where, tenantId);
          }
          return query(args);
        },

        // findUnique não aceita colunas extras no where → reescrito p/ findFirst
        async findUnique({ model, args, query }) {
          const tenantId = resolveTenantId();
          if (tenantId && TENANT_SCOPED_MODELS.has(model)) {
            const delegate = (client as unknown as Record<string, any>)[
              model.charAt(0).toLowerCase() + model.slice(1)
            ];
            const { where, ...rest } = args as { where?: unknown };
            return delegate.findFirst({ ...rest, where: scopeWhere(where, tenantId) });
          }
          return query(args);
        },
        async findUniqueOrThrow({ model, args, query }) {
          const tenantId = resolveTenantId();
          if (tenantId && TENANT_SCOPED_MODELS.has(model)) {
            const delegate = (client as unknown as Record<string, any>)[
              model.charAt(0).toLowerCase() + model.slice(1)
            ];
            const { where, ...rest } = args as { where?: unknown };
            return delegate.findFirstOrThrow({ ...rest, where: scopeWhere(where, tenantId) });
          }
          return query(args);
        },

        // ======= MUTAÇÃO POR CHAVE ÚNICA: preflight de ownership =======
        async update({ model, args, query }) {
          const tenantId = resolveTenantId();
          if (tenantId && TENANT_SCOPED_MODELS.has(model)) {
            await assertOwnership(client, model, (args as { where?: unknown }).where, tenantId);
          }
          return query(args);
        },
        async delete({ model, args, query }) {
          const tenantId = resolveTenantId();
          if (tenantId && TENANT_SCOPED_MODELS.has(model)) {
            await assertOwnership(client, model, (args as { where?: unknown }).where, tenantId);
          }
          return query(args);
        },
        async upsert({ model, args, query }) {
          const tenantId = resolveTenantId();
          if (tenantId && TENANT_SCOPED_MODELS.has(model)) {
            injectIntoData((args as { create?: unknown }).create, tenantId);
            // Se o alvo do where existir em OUTRO tenant, o caminho de update
            // sequestraria registro alheio — bloquear.
            await assertNoCrossTenantTarget(client, model, (args as { where?: unknown }).where, tenantId);
          }
          return query(args);
        },
      },
    },
  })
);

/**
 * Bloqueia update/delete/upsert cujo alvo pertence a OUTRO tenant.
 *
 * Semântica FAIL-SAFE p/ transações: só lança se o registro EXISTE e é de outro
 * tenant. Se não for encontrado, NÃO lança — pode ser um registro criado na
 * MESMA transação ainda não commitada (o preflight roda no client base, fora do
 * tx), e nesse caso o where por id já é seguro + o RLS cobre o resíduo. Antes,
 * lançar em "não encontrado" quebrava todo create+update na mesma transação
 * (ex.: registro de cidadão → syncCitizenPersonIdentity).
 *
 * Usa o client da camada anterior (sem re-entrar nesta extension).
 */
async function assertOwnership(
  client: unknown,
  model: string,
  where: unknown,
  tenantId: string
): Promise<void> {
  const delegate = (client as Record<string, any>)[model.charAt(0).toLowerCase() + model.slice(1)];
  const target = await delegate.findFirst({ where, select: { tenantId: true } });
  // target === null: não visível fora do tx (registro da própria transação) OU
  // não existe → deixar a operação seguir (segura pelo where único + RLS).
  // target de outro tenant → bloquear.
  if (target && target.tenantId != null && target.tenantId !== tenantId) {
    throw notFoundError(model);
  }
}

/** upsert: permite create (alvo inexistente), bloqueia update cross-tenant. */
async function assertNoCrossTenantTarget(
  client: unknown,
  model: string,
  where: unknown,
  tenantId: string
): Promise<void> {
  const delegate = (client as Record<string, any>)[model.charAt(0).toLowerCase() + model.slice(1)];
  const target = await delegate.findFirst({ where, select: { tenantId: true } });
  if (target && target.tenantId != null && target.tenantId !== tenantId) throw notFoundError(model);
}

/** @deprecated nome antigo — mantido para compat de import */
export const tenantWriteExtension = tenantExtension;

export default tenantExtension;
