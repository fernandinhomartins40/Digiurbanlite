/**
 * Primeiros passos do município (M5): junta os números que já existem no banco
 * e entrega a lista de ativação. Tudo no município da requisição (a extension
 * escopa as tabelas com tenantId; o Tenant e o e-mail são lidos pelo id).
 */

import { prisma } from '../../lib/prisma';
import { tryGetTenantId } from '../../lib/tenant-context';
import { getTenantMailSettings } from '../mail/mail-settings.service';
import { ActivationFacts, buildActivationSteps, DismissibleCard, withDismissedCard } from './activation-rules';

// Diferença mínima entre criação e alteração para contar como "mexido pela prefeitura"
const EDIT_MARGIN_MS = 60_000;

async function departmentsReviewed(): Promise<boolean> {
  const rows = await prisma.department.findMany({ select: { isActive: true, createdAt: true, updatedAt: true } });
  return rows.some((d) => !d.isActive || d.updatedAt.getTime() - d.createdAt.getTime() > EDIT_MARGIN_MS);
}

export async function getActivationFacts(): Promise<ActivationFacts> {
  const tenantId = tryGetTenantId();
  // Uma fonte que falhar conta como "não feito" e a lista segue
  const safe = <T>(p: Promise<T>, fallback: T) => p.catch(() => fallback);

  const [tenant, reviewed, activeUsers, assigned, activeServices, reviewedServices, bot, mail, roles, protocols] =
    await Promise.all([
      tenantId ? safe(prisma.tenant.findUnique({ where: { id: tenantId }, select: { branding: true } }), null) : Promise.resolve(null),
      safe(departmentsReviewed(), false),
      safe(prisma.user.count({ where: { isActive: true, role: { not: 'SUPER_ADMIN' } } }), 0),
      safe(prisma.employeeAssignment.findMany({ where: { situacao: 'ATIVO' }, distinct: ['userId'], select: { userId: true }, take: 2 }), []),
      safe(prisma.serviceSimplified.count({ where: { isActive: true } }), 0),
      safe(prisma.serviceSimplified.count({ where: { isActive: true, OR: [{ catalogKey: null }, { catalogHash: null }] } }), 0),
      safe(prisma.botSettings.findFirst({ select: { version: true, publishedBy: true } }), null),
      safe(getTenantMailSettings(tenantId), null),
      safe(prisma.internalProcessRoleUnit.count(), 0),
      safe(prisma.protocolSimplified.count(), 0),
    ]);

  const branding = (tenant?.branding || {}) as Record<string, unknown>;
  return {
    hasLogo: typeof branding.logoUrl === 'string' && branding.logoUrl.length > 0,
    departmentsReviewed: reviewed,
    activeUsers,
    usersWithAssignment: assigned.length,
    activeServices,
    reviewedServices,
    botPublished: !!bot && (bot.version > 1 || !!bot.publishedBy),
    hasMailSender: !!mail?.senderName?.trim(),
    linkedProcessRoles: roles,
    protocols,
  };
}

export async function getActivation() {
  return buildActivationSteps(await getActivationFacts());
}

/** Cartões do Início já dispensados pela pessoa (`dashboardLayout.dismissedCards`). */
export async function getDismissedCards(userId: string): Promise<string[]> {
  const pref = await prisma.userPreferences.findUnique({ where: { userId }, select: { dashboardLayout: true } });
  const layout = pref?.dashboardLayout as Record<string, unknown> | null;
  return Array.isArray(layout?.dismissedCards) ? (layout!.dismissedCards as unknown[]).filter((c): c is string => typeof c === 'string') : [];
}

export async function dismissCard(userId: string, card: DismissibleCard): Promise<string[]> {
  const pref = await prisma.userPreferences.findUnique({ where: { userId }, select: { dashboardLayout: true } });
  const dashboardLayout = withDismissedCard(pref?.dashboardLayout, card);
  await prisma.userPreferences.upsert({ where: { userId }, create: { userId, dashboardLayout }, update: { dashboardLayout } });
  return dashboardLayout.dismissedCards;
}
