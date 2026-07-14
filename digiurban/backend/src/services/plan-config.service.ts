/**
 * ============================================================================
 * PLAN CONFIG SERVICE (catálogo de planos da plataforma)
 * ============================================================================
 * CRUD do catálogo de planos SaaS (model PlanConfig), operado no painel
 * super-admin/plataforma. Entidade de PLATAFORMA — todas as operações rodam em
 * runAsPlatform (PlanConfig não tem tenantId, não passa pela extension de
 * isolamento). Fonte única de preço e limites-padrão por plano; substitui o
 * antigo PLAN_MONTHLY_PRICE hardcoded.
 *
 * Contrato de herança: Tenant.plan referencia PlanConfig.code. Município herda
 * maxUsers/maxCitizens/features do plano; grava valores próprios apenas quando
 * quer sobrescrever (override por município — ver tenant-provisioning.service).
 */

import { runAsPlatform } from '../lib/tenant-context';

export interface PlanConfigRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  maxUsers: number;
  maxCitizens: number;
  features: Record<string, boolean> | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Lista planos ordenados (sortOrder, depois preço). Inclui contagem de municípios. */
export async function listPlans(includeInactive = true): Promise<Array<PlanConfigRecord & { tenants: number }>> {
  const { prisma } = await import('../lib/prisma');
  return runAsPlatform(async () => {
    const plans = await prisma.planConfig.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { monthlyPrice: 'asc' }],
    });

    // Quantos municípios usam cada plano (por code; case-insensitive p/ compat
    // com o legado basic/professional/enterprise em minúsculas).
    return Promise.all(
      plans.map(async (p: any) => {
        const tenants = await prisma.tenant.count({
          where: { plan: { equals: p.code, mode: 'insensitive' } },
        });
        return { ...p, tenants } as PlanConfigRecord & { tenants: number };
      })
    );
  });
}

/** Busca um plano pelo code (case-insensitive — casa com Tenant.plan legado). */
export async function getPlanByCode(code: string): Promise<PlanConfigRecord | null> {
  if (!code) return null;
  const { prisma } = await import('../lib/prisma');
  return runAsPlatform(async () =>
    prisma.planConfig.findFirst({
      where: { code: { equals: code, mode: 'insensitive' } },
    })
  ) as Promise<PlanConfigRecord | null>;
}

export interface CreatePlanInput {
  code: string;
  name: string;
  description?: string | null;
  monthlyPrice?: number;
  maxUsers?: number;
  maxCitizens?: number;
  features?: Record<string, boolean> | null;
  isActive?: boolean;
  sortOrder?: number;
}

/** Cria um plano. `code` é normalizado (UPPER, sem espaços) e é imutável. */
export async function createPlan(input: CreatePlanInput): Promise<PlanConfigRecord> {
  const { prisma } = await import('../lib/prisma');
  const code = normalizeCode(input.code);
  return runAsPlatform(async () =>
    prisma.planConfig.create({
      data: {
        code,
        name: input.name,
        description: input.description ?? null,
        monthlyPrice: input.monthlyPrice ?? 0,
        maxUsers: input.maxUsers ?? 10,
        maxCitizens: input.maxCitizens ?? 10000,
        features: (input.features as any) ?? undefined,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
    })
  ) as Promise<PlanConfigRecord>;
}

export interface UpdatePlanInput {
  name?: string;
  description?: string | null;
  monthlyPrice?: number;
  maxUsers?: number;
  maxCitizens?: number;
  features?: Record<string, boolean> | null;
  isActive?: boolean;
  sortOrder?: number;
}

/** Atualiza um plano (o `code` NÃO é editável — é a chave de referência). */
export async function updatePlan(id: string, input: UpdatePlanInput): Promise<PlanConfigRecord> {
  const { prisma } = await import('../lib/prisma');
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.monthlyPrice !== undefined) data.monthlyPrice = input.monthlyPrice;
  if (input.maxUsers !== undefined) data.maxUsers = input.maxUsers;
  if (input.maxCitizens !== undefined) data.maxCitizens = input.maxCitizens;
  if (input.features !== undefined) data.features = input.features as any;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

  return runAsPlatform(async () =>
    prisma.planConfig.update({ where: { id }, data: data as any })
  ) as Promise<PlanConfigRecord>;
}

/**
 * Desativa um plano (soft). Não deletamos planos em uso — municípios
 * referenciam pelo code e a fatura já pode ter sido emitida. Se nenhum
 * município usa o plano, permite hard delete.
 */
export async function removePlan(id: string): Promise<{ deleted: boolean }> {
  const { prisma } = await import('../lib/prisma');
  return runAsPlatform(async () => {
    const plan = await prisma.planConfig.findUnique({ where: { id } });
    if (!plan) {
      const err = new Error('Plano não encontrado') as Error & { code?: string };
      err.code = 'P2025';
      throw err;
    }

    const inUse = await prisma.tenant.count({
      where: { plan: { equals: plan.code, mode: 'insensitive' } },
    });

    if (inUse > 0) {
      await prisma.planConfig.update({ where: { id }, data: { isActive: false } });
      return { deleted: false };
    }

    await prisma.planConfig.delete({ where: { id } });
    return { deleted: true };
  });
}

function normalizeCode(code: string): string {
  return (code || '').trim().toUpperCase().replace(/\s+/g, '_');
}
