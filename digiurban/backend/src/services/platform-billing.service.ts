/**
 * ============================================================================
 * PLATFORM BILLING & LEADS (painel super-admin / plataforma)
 * ============================================================================
 * Faturamento SaaS por município (Invoice) e captação de leads (Lead).
 * Entidades de PLATAFORMA — operadas em runAsPlatform, filtro por tenant via
 * where explícito (Invoice.tenantId não passa pela extension de isolamento).
 */

import { runAsPlatform } from '../lib/tenant-context';
import { getPlanByCode } from './plan-config.service';

/**
 * Preço-base mensal por plano — FALLBACK apenas. A fonte de verdade é o
 * catálogo PlanConfig (getPlanByCode). Este mapa cobre o caso de o plano do
 * município não existir no catálogo (dado legado), evitando fatura R$ 0.
 */
export const PLAN_MONTHLY_PRICE: Record<string, number> = {
  STARTER: 299,
  PROFESSIONAL: 799,
  ENTERPRISE: 1999,
  // aliases do campo Tenant.plan (basic/professional/enterprise)
  basic: 299,
  professional: 799,
  enterprise: 1999,
};

/** Preço mensal de um plano: catálogo (PlanConfig) → fallback ao mapa legado. */
export async function resolvePlanPrice(plan: string): Promise<number> {
  const cfg = await getPlanByCode(plan);
  if (cfg && typeof cfg.monthlyPrice === 'number') return cfg.monthlyPrice;
  return PLAN_MONTHLY_PRICE[plan] ?? PLAN_MONTHLY_PRICE[(plan || '').toUpperCase()] ?? PLAN_MONTHLY_PRICE.STARTER;
}

function normalizePlanEnum(plan: string): 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' {
  const p = (plan || '').toUpperCase();
  if (p === 'PROFESSIONAL' || p === 'ENTERPRISE' || p === 'STARTER') return p as any;
  if (plan === 'professional') return 'PROFESSIONAL';
  if (plan === 'enterprise') return 'ENTERPRISE';
  return 'STARTER';
}

/** Faturas de um município, mais recentes primeiro. */
export async function listTenantInvoices(tenantId: string): Promise<any[]> {
  const { prisma } = await import('../lib/prisma');
  return runAsPlatform(async () =>
    prisma.invoice.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } })
  );
}

/** Todas as faturas da plataforma (com filtro opcional de status). */
export async function listAllInvoices(status?: string): Promise<any[]> {
  const { prisma } = await import('../lib/prisma');
  return runAsPlatform(async () =>
    prisma.invoice.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
  );
}

export interface CreateInvoiceInput {
  tenantId: string;
  amount?: number;
  plan?: string;
  period?: string; // ex.: "2026-07"
  dueDate?: string | Date;
  description?: string;
}

/** Gera uma fatura para um município (valor derivado do plano se omitido). */
export async function createInvoice(input: CreateInvoiceInput): Promise<any> {
  const { prisma } = await import('../lib/prisma');
  return runAsPlatform(async () => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: input.tenantId },
      select: { plan: true, nomeMunicipio: true },
    });
    if (!tenant) {
      const err = new Error('Município não encontrado') as Error & { code?: string };
      err.code = 'P2025';
      throw err;
    }

    const planStr = input.plan || tenant.plan;
    const planEnum = normalizePlanEnum(planStr);
    const amount = input.amount ?? (await resolvePlanPrice(planStr));
    const now = new Date();
    const period = input.period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dueDate = input.dueDate ? new Date(input.dueDate) : new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const number = `INV-${period.replace('-', '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    return prisma.invoice.create({
      data: {
        tenantId: input.tenantId,
        number,
        amount,
        plan: planEnum,
        period,
        dueDate,
        status: 'PENDING',
        description: input.description || `Assinatura ${planEnum} — ${tenant.nomeMunicipio} (${period})`,
      },
    });
  });
}

/** Marca uma fatura como paga / cancelada. */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'PAID' | 'CANCELLED' | 'FAILED' | 'PENDING' | 'OVERDUE'
): Promise<any> {
  const { prisma } = await import('../lib/prisma');
  return runAsPlatform(async () =>
    prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: status as any, paidAt: status === 'PAID' ? new Date() : null },
    })
  );
}

// ============================================================================
// LEADS (funil de captação → provisionamento)
// ============================================================================

export interface CreateLeadInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  source: string; // LeadSource
  message?: string;
}

/** Registra um lead (endpoint público — landing/demo). */
export async function createLead(input: CreateLeadInput): Promise<any> {
  const { prisma } = await import('../lib/prisma');
  return runAsPlatform(async () =>
    prisma.lead.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        company: input.company,
        position: input.position,
        source: (input.source as any) || 'CONTACT_FORM',
        message: input.message,
        status: 'NEW',
      },
    })
  );
}

/** Lista leads (funil), mais recentes primeiro. */
export async function listLeads(status?: string): Promise<any[]> {
  const { prisma } = await import('../lib/prisma');
  return runAsPlatform(async () =>
    prisma.lead.findMany({
      where: status && status !== 'all' ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
  );
}

/** Atualiza o estágio de um lead no funil (NEW → CONTACTED → QUALIFIED → WON/LOST). */
export async function updateLeadStatus(leadId: string, status: string): Promise<any> {
  const { prisma } = await import('../lib/prisma');
  return runAsPlatform(async () =>
    prisma.lead.update({ where: { id: leadId }, data: { status } })
  );
}
