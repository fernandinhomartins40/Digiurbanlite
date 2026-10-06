/**
 * Revenda de IA: carteira de créditos por município, pacotes, pedidos e o
 * relatório de custo × receita da plataforma.
 *
 * Cobrança de uma chamada:
 *   créditos = max(mínimo, custoUSD × cotação × margem ÷ valorDoCrédito)
 * Ex.: decisão do JEV com 400 tokens ≈ US$ 0,000034 → abaixo do mínimo →
 * cobra 0,1 crédito (R$ 0,001). Resposta do DeepSeek com 1.500 tokens ≈
 * US$ 0,0009 × 5,5 × 3 ÷ 0,01 ≈ 1,5 crédito (R$ 0,015).
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { runAsPlatform, runAsTenant } from '../../lib/tenant-context';
import { createInvoice } from '../platform-billing.service';
import { PACKAGE_DEFAULTS } from './catalog';

export class NoCreditsError extends Error {
  status = 402;
  constructor() {
    super('O município está sem créditos de IA. Compre um pacote em Configurações › IA.');
  }
}

export async function getBillingSettings() {
  return runAsPlatform(async () =>
    prisma.aiBillingSettings.upsert({ where: { id: 'singleton' }, create: { id: 'singleton' }, update: {} })
  );
}

export async function updateBillingSettings(data: Partial<{ usdToBrl: number; markup: number; creditValueBrl: number; minChargeCredits: number; allowChinaHosted: boolean; redactPii: boolean; lowBalanceCredits: number }>) {
  return runAsPlatform(async () =>
    prisma.aiBillingSettings.upsert({ where: { id: 'singleton' }, create: { id: 'singleton', ...data }, update: data })
  );
}

export async function getWallet(tenantId: string) {
  return runAsPlatform(async () =>
    prisma.aiTenantWallet.upsert({ where: { tenantId }, create: { tenantId }, update: {} })
  );
}

export async function assertHasCredits(tenantId: string): Promise<void> {
  const wallet = await getWallet(tenantId);
  if (Number(wallet.balance) <= 0) throw new NoCreditsError();
}

export function creditsForCost(costUsd: number, s: { usdToBrl: number; markup: number; creditValueBrl: number; minChargeCredits: number }): number {
  const credits = (costUsd * s.usdToBrl * s.markup) / s.creditValueBrl;
  return Math.max(s.minChargeCredits, Math.round(credits * 10000) / 10000);
}

export interface UsageEntry {
  tenantId: string;
  task: string;
  source: string;
  provider: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
}

/** Debita o consumo (atômico) e registra no extrato. Saldo nunca fica negativo. */
export async function chargeUsage(entry: UsageEntry): Promise<{ credits: number; balance: number }> {
  const s = await getBillingSettings();
  const credits = creditsForCost(entry.costUsd, s);
  return runAsPlatform(async () =>
    prisma.$transaction(async (tx) => {
      const wallet = await tx.aiTenantWallet.upsert({ where: { tenantId: entry.tenantId }, create: { tenantId: entry.tenantId }, update: {} });
      const charged = Math.min(credits, Math.max(0, Number(wallet.balance)));
      const updated = await tx.aiTenantWallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: charged }, totalConsumed: { increment: charged } },
      });
      await tx.aiCreditLedger.create({
        data: {
          tenantId: entry.tenantId,
          kind: 'USAGE',
          credits: new Prisma.Decimal(-charged),
          balanceAfter: updated.balance,
          task: entry.task,
          source: entry.source,
          provider: entry.provider,
          modelId: entry.modelId,
          inputTokens: entry.inputTokens,
          outputTokens: entry.outputTokens,
          costUsd: new Prisma.Decimal(entry.costUsd.toFixed(8)),
          revenueBrl: new Prisma.Decimal((charged * s.creditValueBrl).toFixed(4)),
          latencyMs: entry.latencyMs,
        },
      });
      return { credits: charged, balance: Number(updated.balance) };
    })
  ).then((r) => {
    void checkLowBalance(entry.tenantId, r.balance).catch((e) => console.error('[ai-billing] aviso de saldo', e));
    return r;
  });
}

// ---------------------------------------------------------------- aviso de saldo baixo

export async function lowBalanceThresholdOf(tenantId: string): Promise<number> {
  const [wallet, s] = await Promise.all([getWallet(tenantId), getBillingSettings()]);
  return wallet.lowBalanceThreshold ?? s.lowBalanceCredits;
}

/**
 * Avisa os administradores do município UMA vez quando o saldo cai abaixo do
 * limite (notificação no sininho do painel). Volta a avisar depois que o saldo
 * for recarregado acima do limite.
 */
export async function checkLowBalance(tenantId: string, balance: number): Promise<void> {
  const threshold = await lowBalanceThresholdOf(tenantId);
  if (threshold <= 0 || balance >= threshold) return;
  // marca de forma atômica: só quem conseguir marcar envia (evita aviso duplicado em chamadas simultâneas)
  const marked = await runAsPlatform(async () =>
    prisma.aiTenantWallet.updateMany({ where: { tenantId, lowBalanceNotifiedAt: null }, data: { lowBalanceNotifiedAt: new Date() } })
  );
  if (marked.count === 0) return;
  await runAsTenant(tenantId, async () => {
    const admins = await prisma.user.findMany({
      where: { tenantId, isActive: true, role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true },
      take: 50,
    });
    const empty = balance <= 0;
    if (!admins.length) return;
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        tenantId,
        userId: a.id,
        title: empty ? 'Créditos de IA esgotados' : 'Créditos de IA acabando',
        message: empty
          ? 'O município ficou sem créditos de IA. O DigiBot e o Assistente funcionam sem IA até a recarga. Compre um pacote em Créditos de IA.'
          : `Restam ${Math.floor(balance)} créditos de IA. Compre um pacote em Créditos de IA para não interromper o DigiBot e o Assistente.`,
        type: 'AI_CREDITS_LOW',
        channel: 'WEB',
        metadata: { balance, threshold, link: '/admin/ia-creditos' },
        sentAt: new Date(),
      })),
    });
    // e-mail aos administradores (o sininho só aparece para quem abre o painel)
    const { default: notificationService } = await import('../notification.service');
    for (const admin of admins) {
      await notificationService
        .notify({
          recipientType: 'user',
          recipientId: admin.id,
          type: 'AI_CREDITS_LOW',
          title: empty ? 'Créditos de IA esgotados' : 'Créditos de IA acabando',
          message: empty
            ? 'O município ficou sem créditos de IA. O DigiBot e o Assistente funcionam sem IA até a recarga.'
            : `Restam ${Math.floor(balance)} créditos de IA. Compre um pacote para não interromper o DigiBot e o Assistente.`,
          data: { url: '/admin/ia-creditos' },
          channels: ['email'],
          priority: 'high',
        })
        .catch((error) => console.error('[ai-billing] Falha ao enviar e-mail de saldo baixo:', error));
    }
  });
}

/** Limite do aviso definido pelo próprio município (null = padrão da plataforma) */
export async function setLowBalanceThreshold(tenantId: string, threshold: number | null) {
  await getWallet(tenantId);
  return runAsPlatform(async () =>
    prisma.aiTenantWallet.update({ where: { tenantId }, data: { lowBalanceThreshold: threshold, lowBalanceNotifiedAt: null } })
  );
}

/** Entrada de créditos (compra paga, bônus, ajuste) */
export async function addCredits(tenantId: string, credits: number, kind: 'PURCHASE' | 'GRANT' | 'ADJUST' | 'REFUND', description: string, extra: { orderId?: string; createdById?: string; revenueBrl?: number } = {}) {
  return runAsPlatform(async () =>
    prisma.$transaction(async (tx) => {
      const wallet = await tx.aiTenantWallet.upsert({ where: { tenantId }, create: { tenantId }, update: {} });
      const updated = await tx.aiTenantWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: credits },
          ...(kind === 'PURCHASE' ? { totalPurchased: { increment: credits } } : {}),
        },
      });
      await tx.aiCreditLedger.create({
        data: {
          tenantId,
          kind,
          credits: new Prisma.Decimal(credits),
          balanceAfter: updated.balance,
          description,
          orderId: extra.orderId,
          createdById: extra.createdById,
          revenueBrl: new Prisma.Decimal(extra.revenueBrl ?? 0),
        },
      });
      return updated;
    })
  ).then(async (updated) => {
    if (updated.lowBalanceNotifiedAt && Number(updated.balance) >= (await lowBalanceThresholdOf(tenantId).catch(() => 0))) {
      await runAsPlatform(async () => prisma.aiTenantWallet.update({ where: { id: updated.id }, data: { lowBalanceNotifiedAt: null } })).catch(() => undefined);
    }
    return updated;
  });
}

// ---------------------------------------------------------------- pacotes

export async function listPackages(onlyActive = false) {
  return runAsPlatform(async () => {
    if ((await prisma.aiCreditPackage.count()) === 0) {
      await prisma.aiCreditPackage.createMany({ data: PACKAGE_DEFAULTS, skipDuplicates: true });
    }
    return prisma.aiCreditPackage.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { priceBrl: 'asc' }],
    });
  });
}

export async function upsertPackage(data: { id?: string; code: string; name: string; description?: string | null; credits: number; priceBrl: number; isActive?: boolean; sortOrder?: number }) {
  const { id, ...rest } = data;
  return runAsPlatform(async () =>
    id ? prisma.aiCreditPackage.update({ where: { id }, data: rest }) : prisma.aiCreditPackage.create({ data: rest })
  );
}

// ---------------------------------------------------------------- pedidos

/** Município pede um pacote → pedido + fatura. Créditos entram quando a fatura é paga. */
export async function createOrder(tenantId: string, packageId: string, requestedById?: string) {
  return runAsPlatform(async () => {
    const pkg = await prisma.aiCreditPackage.findFirst({ where: { id: packageId, isActive: true } });
    if (!pkg) throw Object.assign(new Error('Pacote indisponível'), { status: 404 });
    const order = await prisma.aiCreditOrder.create({
      data: { tenantId, packageId: pkg.id, packageName: pkg.name, credits: pkg.credits, priceBrl: pkg.priceBrl, requestedById },
    });
    const invoice = await createInvoice({
      tenantId,
      amount: pkg.priceBrl,
      description: `Créditos de IA — ${pkg.name} (${pkg.credits.toLocaleString('pt-BR')} créditos)`,
    });
    await prisma.invoice.update({ where: { id: invoice.id }, data: { metadata: { kind: 'ai_credits', orderId: order.id } } });
    return prisma.aiCreditOrder.update({ where: { id: order.id }, data: { invoiceId: invoice.id } });
  });
}

/**
 * Gancho do faturamento: chamado quando uma fatura muda de status.
 * PAID → libera os créditos do pedido (uma vez só); CANCELLED → cancela o pedido.
 */
export async function onInvoiceStatusChanged(invoiceId: string, status: string): Promise<void> {
  await runAsPlatform(async () => {
    const order = await prisma.aiCreditOrder.findFirst({ where: { invoiceId } });
    if (!order || order.status === 'PAID') return;
    if (status === 'PAID') {
      const claimed = await prisma.aiCreditOrder.updateMany({
        where: { id: order.id, status: { not: 'PAID' } },
        data: { status: 'PAID', paidAt: new Date() },
      });
      if (claimed.count === 1 && order.tenantId) {
        await addCredits(order.tenantId, order.credits, 'PURCHASE', `Pacote ${order.packageName} (fatura paga)`, {
          orderId: order.id,
          revenueBrl: order.priceBrl,
        });
      }
    } else if (status === 'CANCELLED') {
      await prisma.aiCreditOrder.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
    }
  });
}

// ---------------------------------------------------------------- relatórios

export async function tenantUsage(tenantId: string, days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  return runAsPlatform(async () => {
    const [wallet, ledger, byTask, orders] = await Promise.all([
      getWallet(tenantId),
      prisma.aiCreditLedger.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.aiCreditLedger.groupBy({
        by: ['task'],
        where: { tenantId, kind: 'USAGE', createdAt: { gte: since } },
        _sum: { credits: true },
        _count: { _all: true },
      }),
      prisma.aiCreditOrder.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);
    const s = await getBillingSettings();
    const threshold = wallet.lowBalanceThreshold ?? s.lowBalanceCredits;
    return {
      wallet: { balance: Number(wallet.balance), totalPurchased: Number(wallet.totalPurchased), totalConsumed: Number(wallet.totalConsumed) },
      lowBalance: { threshold, custom: wallet.lowBalanceThreshold != null, platformDefault: s.lowBalanceCredits, isLow: threshold > 0 && Number(wallet.balance) < threshold },
      byTask: byTask.map((t) => ({ task: t.task, calls: t._count._all, credits: -Number(t._sum.credits || 0) })),
      ledger: ledger.map((l) => ({ ...l, credits: Number(l.credits), balanceAfter: Number(l.balanceAfter), costUsd: undefined, revenueBrl: undefined })),
      orders,
    };
  });
}

/** Painel da plataforma: carteiras, custo pago aos provedores × receita */
export async function platformReport(days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  return runAsPlatform(async () => {
    const [wallets, usage, purchases, tenants, s] = await Promise.all([
      prisma.aiTenantWallet.findMany(),
      prisma.aiCreditLedger.groupBy({
        by: ['tenantId'],
        where: { kind: 'USAGE', createdAt: { gte: since } },
        _sum: { costUsd: true, revenueBrl: true, credits: true },
        _count: { _all: true },
      }),
      prisma.aiCreditLedger.aggregate({ where: { kind: 'PURCHASE', createdAt: { gte: since } }, _sum: { revenueBrl: true } }),
      prisma.tenant.findMany({ select: { id: true, nomeMunicipio: true, ufMunicipio: true, status: true } }),
      getBillingSettings(),
    ]);
    const usageBy = new Map(usage.map((u) => [u.tenantId, u]));
    const walletBy = new Map(wallets.map((w) => [w.tenantId, w]));
    const rows = tenants.map((t) => {
      const u = usageBy.get(t.id);
      const w = walletBy.get(t.id);
      const costBrl = Number(u?._sum.costUsd || 0) * s.usdToBrl;
      const revenueBrl = Number(u?._sum.revenueBrl || 0);
      return {
        tenantId: t.id,
        name: `${t.nomeMunicipio}/${t.ufMunicipio}`,
        status: t.status,
        balance: Number(w?.balance || 0),
        calls: u?._count._all || 0,
        creditsUsed: -Number(u?._sum.credits || 0),
        costBrl,
        revenueBrl,
        marginBrl: revenueBrl - costBrl,
      };
    });
    const totals = rows.reduce(
      (acc, r) => ({ calls: acc.calls + r.calls, costBrl: acc.costBrl + r.costBrl, revenueBrl: acc.revenueBrl + r.revenueBrl, marginBrl: acc.marginBrl + r.marginBrl }),
      { calls: 0, costBrl: 0, revenueBrl: 0, marginBrl: 0 }
    );
    return { days, rows, totals, packagesSoldBrl: Number(purchases._sum.revenueBrl || 0) };
  });
}
