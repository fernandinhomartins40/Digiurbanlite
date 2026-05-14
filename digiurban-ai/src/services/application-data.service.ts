import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';

type CountRow = {
  total: bigint | number;
};

type ProtocolListRow = {
  number: string;
  title: string;
  status: string;
  priority: number;
  createdAt: Date;
  departmentName: string | null;
  serviceName: string | null;
};

type TicketListRow = {
  number: string;
  title: string;
  status: string;
  priority: number;
  createdAt: Date;
  departmentName: string | null;
  serviceName: string | null;
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

function wantsList(normalized: string): boolean {
  return [
    'listar',
    'liste',
    'lista',
    'relacao',
    'quais',
    'mostre',
    'exibir',
    'exiba',
  ].some((signal) => normalized.includes(signal));
}

function wantsOpenOnly(normalized: string): boolean {
  return [
    'aberto',
    'abertos',
    'ativo',
    'ativos',
    'ativa',
    'ativas',
    'andamento',
    'pendente',
    'pendentes',
    'nao concluidos',
    'nao finalizados',
  ].some((signal) => normalized.includes(signal));
}

export class ApplicationDataService {
  async query(query: string): Promise<Record<string, unknown>> {
    const normalized = normalizeText(query);
    const asksForProtocols =
      normalized.includes('protocolo') || normalized.includes('protocolos');
    const asksForTickets =
      normalized.includes('chamado') || normalized.includes('chamados') || normalized.includes('ticket');

    if (asksForProtocols && !asksForTickets) {
      if (wantsList(normalized)) {
        return this.listProtocols({ openOnly: wantsOpenOnly(normalized), limit: 12 });
      }
      return this.getProtocolStats();
    }

    if (asksForTickets && !asksForProtocols) {
      if (wantsList(normalized)) {
        return this.listTickets({ openOnly: wantsOpenOnly(normalized), limit: 12 });
      }
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

  private async listProtocols(params: {
    openOnly: boolean;
    limit: number;
  }): Promise<Record<string, unknown>> {
    const statusFilter = params.openOnly
      ? Prisma.sql`AND p."status" NOT IN ('CONCLUIDO', 'CANCELADO')`
      : Prisma.empty;
    const rows = await prisma.$queryRaw<ProtocolListRow[]>(Prisma.sql`
      SELECT
        p."number",
        p."title",
        p."status"::text AS "status",
        p."priority",
        p."createdAt",
        d."name" AS "departmentName",
        s."name" AS "serviceName"
      FROM "protocols_simplified" p
      LEFT JOIN "departments" d ON d."id" = p."departmentId"
      LEFT JOIN "services_simplified" s ON s."id" = p."serviceId"
      WHERE 1 = 1
      ${statusFilter}
      ORDER BY p."createdAt" DESC
      LIMIT ${params.limit}
    `);

    return {
      ok: true,
      entity: 'protocol_list',
      source: 'database',
      sourceLabel: 'Tabela protocols_simplified',
      measuredAt: new Date().toISOString(),
      filter: params.openOnly ? 'open' : 'recent',
      limit: params.limit,
      items: rows.map((row) => ({
        number: row.number,
        title: row.title,
        status: row.status,
        priority: row.priority,
        departmentName: row.departmentName,
        serviceName: row.serviceName,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  private async listTickets(params: {
    openOnly: boolean;
    limit: number;
  }): Promise<Record<string, unknown>> {
    const statusFilter = params.openOnly
      ? Prisma.sql`AND t."status" NOT IN ('PROTOCOL_CREATED', 'REJECTED', 'CANCELLED')`
      : Prisma.empty;
    const rows = await prisma.$queryRaw<TicketListRow[]>(Prisma.sql`
      SELECT
        t."number",
        t."title",
        t."status"::text AS "status",
        t."priority",
        t."createdAt",
        d."name" AS "departmentName",
        s."name" AS "serviceName"
      FROM "admin_tickets" t
      LEFT JOIN "departments" d ON d."id" = t."departmentId"
      LEFT JOIN "services_simplified" s ON s."id" = t."serviceId"
      WHERE 1 = 1
      ${statusFilter}
      ORDER BY t."createdAt" DESC
      LIMIT ${params.limit}
    `);

    return {
      ok: true,
      entity: 'ticket_list',
      source: 'database',
      sourceLabel: 'Tabela admin_tickets',
      measuredAt: new Date().toISOString(),
      filter: params.openOnly ? 'open' : 'recent',
      limit: params.limit,
      items: rows.map((row) => ({
        number: row.number,
        title: row.title,
        status: row.status,
        priority: row.priority,
        departmentName: row.departmentName,
        serviceName: row.serviceName,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }
}

export const applicationDataService = new ApplicationDataService();
