import prisma from '../utils/prisma';

type CountRow = {
  total: bigint | number;
};

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toNumber(value: bigint | number | null | undefined): number {
  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return 0;
}

async function querySingleCount(sql: TemplateStringsArray, ...values: unknown[]): Promise<number> {
  const rows = await prisma.$queryRaw<CountRow[]>(sql, ...values);
  return toNumber(rows[0]?.total);
}

export class ApplicationDataService {
  async query(query: string): Promise<Record<string, unknown>> {
    const normalized = normalizeText(query);
    const asksForProtocols =
      normalized.includes('protocolo') || normalized.includes('protocolos');
    const asksForTickets =
      normalized.includes('chamado') || normalized.includes('chamados') || normalized.includes('ticket');

    if (asksForProtocols && !asksForTickets) {
      return this.getProtocolStats();
    }

    if (asksForTickets && !asksForProtocols) {
      return this.getTicketStats();
    }

    return this.getApplicationOverview();
  }

  private async getProtocolStats(): Promise<Record<string, unknown>> {
    const [total, inProgress, pending, update, completed, cancelled] = await Promise.all([
      querySingleCount`SELECT COUNT(*)::bigint AS total FROM "protocols_simplified"`,
      querySingleCount`SELECT COUNT(*)::bigint AS total FROM "protocols_simplified" WHERE "status" = 'PROGRESSO'`,
      querySingleCount`SELECT COUNT(*)::bigint AS total FROM "protocols_simplified" WHERE "status" = 'PENDENCIA'`,
      querySingleCount`SELECT COUNT(*)::bigint AS total FROM "protocols_simplified" WHERE "status" = 'ATUALIZACAO'`,
      querySingleCount`SELECT COUNT(*)::bigint AS total FROM "protocols_simplified" WHERE "status" = 'CONCLUIDO'`,
      querySingleCount`SELECT COUNT(*)::bigint AS total FROM "protocols_simplified" WHERE "status" = 'CANCELADO'`,
    ]);

    return {
      ok: true,
      entity: 'protocols',
      source: 'database',
      sourceLabel: 'Tabela protocols_simplified',
      measuredAt: new Date().toISOString(),
      totals: {
        total,
        active: total - completed - cancelled,
        inProgress,
        pending,
        needsUpdate: update,
        completed,
        cancelled,
      },
    };
  }

  private async getTicketStats(): Promise<Record<string, unknown>> {
    const [total, pending, accepted, protocolCreated, rejected, cancelled] = await Promise.all([
      querySingleCount`SELECT COUNT(*)::bigint AS total FROM "admin_tickets"`,
      querySingleCount`SELECT COUNT(*)::bigint AS total FROM "admin_tickets" WHERE "status" = 'PENDING'`,
      querySingleCount`SELECT COUNT(*)::bigint AS total FROM "admin_tickets" WHERE "status" = 'ACCEPTED'`,
      querySingleCount`SELECT COUNT(*)::bigint AS total FROM "admin_tickets" WHERE "status" = 'PROTOCOL_CREATED'`,
      querySingleCount`SELECT COUNT(*)::bigint AS total FROM "admin_tickets" WHERE "status" = 'REJECTED'`,
      querySingleCount`SELECT COUNT(*)::bigint AS total FROM "admin_tickets" WHERE "status" = 'CANCELLED'`,
    ]);

    return {
      ok: true,
      entity: 'admin_tickets',
      source: 'database',
      sourceLabel: 'Tabela admin_tickets',
      measuredAt: new Date().toISOString(),
      totals: {
        total,
        pending,
        accepted,
        protocolCreated,
        rejected,
        cancelled,
      },
    };
  }

  private async getApplicationOverview(): Promise<Record<string, unknown>> {
    const [protocols, tickets] = await Promise.all([
      this.getProtocolStats(),
      this.getTicketStats(),
    ]);

    return {
      ok: true,
      entity: 'application_overview',
      source: 'database',
      sourceLabel: 'Tabelas protocols_simplified e admin_tickets',
      measuredAt: new Date().toISOString(),
      protocols: protocols.totals,
      adminTickets: tickets.totals,
    };
  }
}

export const applicationDataService = new ApplicationDataService();
