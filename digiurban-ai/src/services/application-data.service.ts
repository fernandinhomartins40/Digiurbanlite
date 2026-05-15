import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { normalizeOperationalText } from '../utils/operational-text';

type CountRow = {
  total: bigint | number;
};

type ProtocolListRow = {
  id: string;
  number: string;
  title: string;
  status: string;
  priority: number;
  createdAt: Date;
  departmentName: string | null;
  serviceName: string | null;
};

type TicketListRow = {
  id: string;
  number: string;
  title: string;
  status: string;
  priority: number;
  createdAt: Date;
  departmentName: string | null;
  serviceName: string | null;
};

type ServiceListRow = {
  id: string;
  name: string;
  description: string | null;
  serviceType: string;
  serviceSubtype: string | null;
  category: string | null;
  estimatedDays: number | null;
  requiresDocuments: boolean;
  departmentName: string | null;
};

type CitizenSummaryRow = {
  id: string;
  name: string;
  cpf: string;
  email: string | null;
  phone: string | null;
  verificationStatus: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin: Date | null;
};

type DocumentTemplateListRow = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  documentType: string;
  outputFormat: string;
  isGlobal: boolean;
  version: number;
};

function normalizeText(input: string): string {
  return normalizeOperationalText(input);
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

function extractCpf(input: string): string | null {
  const match = input.match(/\d[\d.\-\s]{9,}\d/);
  if (!match) return null;

  const digits = match[0].replace(/\D/g, '');
  return digits.length === 11 ? digits : null;
}

function inferDepartmentQuery(normalized: string): string | null {
  const knownDepartments = [
    'saude',
    'agricultura',
    'esportes',
    'meio ambiente',
    'obras',
    'assistencia social',
    'educacao',
    'cultura',
    'financas',
    'turismo',
    'habitacao',
    'defesa civil',
    'seguranca',
    'transportes',
    'planejamento',
  ];

  return knownDepartments.find((department) => normalized.includes(department)) || null;
}

function wantsDocumentGenerationHelp(normalized: string): boolean {
  return [
    'gere',
    'gerar',
    'emita',
    'emitir',
    'crie',
    'criar',
    'certidao',
    'declaracao',
    'documento',
    'template',
    'modelo',
  ].some((signal) => normalized.includes(signal));
}

export class ApplicationDataService {
  async query(query: string): Promise<Record<string, unknown>> {
    const normalized = normalizeText(query);
    const cpf = extractCpf(query);
    const asksForCitizen =
      Boolean(cpf) &&
      (
        normalized.includes('cidadao') ||
        normalized.includes('cidadaos') ||
        normalized.includes('cadastro') ||
        normalized.includes('cpf')
      );
    const asksForServices =
      normalized.includes('servico') ||
      normalized.includes('servicos') ||
      normalized.includes('catalogo');
    const asksForDocument =
      wantsDocumentGenerationHelp(normalized) &&
      (
        normalized.includes('certidao') ||
        normalized.includes('documento') ||
        normalized.includes('declaracao') ||
        normalized.includes('template') ||
        normalized.includes('modelo')
      );
    const asksForProtocols =
      normalized.includes('protocolo') ||
      normalized.includes('protocolos') ||
      normalized.includes('solicitacao') ||
      normalized.includes('solicitacoes');
    const asksForTickets =
      normalized.includes('chamado') || normalized.includes('chamados') || normalized.includes('ticket');

    if (asksForCitizen && cpf) {
      return this.findCitizenByCpf(cpf);
    }

    if (asksForDocument && !asksForProtocols && !asksForTickets) {
      return this.listDocumentTemplates({ query: normalized, limit: 8 });
    }

    if (asksForServices && !asksForProtocols && !asksForTickets) {
      return this.listServices({ departmentQuery: inferDepartmentQuery(normalized), limit: 12 });
    }

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
        p."id",
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
        id: row.id,
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
        t."id",
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
        id: row.id,
        title: row.title,
        status: row.status,
        priority: row.priority,
        departmentName: row.departmentName,
        serviceName: row.serviceName,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  private async listServices(params: {
    departmentQuery: string | null;
    limit: number;
  }): Promise<Record<string, unknown>> {
    const rows = await prisma.$queryRaw<ServiceListRow[]>(Prisma.sql`
      SELECT
        s."id",
        s."name",
        s."description",
        s."serviceType"::text AS "serviceType",
        s."serviceSubtype",
        s."category",
        s."estimatedDays",
        s."requiresDocuments",
        d."name" AS "departmentName"
      FROM "services_simplified" s
      LEFT JOIN "departments" d ON d."id" = s."departmentId"
      WHERE s."isActive" = true
      ORDER BY d."name" ASC, s."name" ASC
      LIMIT 250
    `);

    const filteredRows = params.departmentQuery
      ? rows.filter((row) =>
          normalizeText(row.departmentName || '').includes(params.departmentQuery || '') ||
          normalizeText(row.name || '').includes(params.departmentQuery || ''),
        )
      : rows;

    return {
      ok: true,
      entity: 'service_list',
      source: 'database',
      sourceLabel: 'Tabela services_simplified',
      measuredAt: new Date().toISOString(),
      filter: params.departmentQuery || 'all',
      limit: params.limit,
      items: filteredRows.slice(0, params.limit).map((row) => ({
        id: row.id,
        name: row.name,
        title: row.name,
        description: row.description,
        serviceType: row.serviceType,
        serviceSubtype: row.serviceSubtype,
        category: row.category,
        estimatedDays: row.estimatedDays,
        requiresDocuments: row.requiresDocuments,
        departmentName: row.departmentName,
      })),
    };
  }

  private async findCitizenByCpf(cpf: string): Promise<Record<string, unknown>> {
    const rows = await prisma.$queryRaw<CitizenSummaryRow[]>(Prisma.sql`
      SELECT
        c."id",
        c."name",
        c."cpf",
        c."email",
        c."phone",
        c."verificationStatus"::text AS "verificationStatus",
        c."isActive",
        c."createdAt",
        c."lastLogin"
      FROM "citizens" c
      WHERE regexp_replace(c."cpf", '\\D', '', 'g') = ${cpf}
      LIMIT 1
    `);

    const citizen = rows[0];
    return {
      ok: true,
      entity: 'citizen_profile',
      source: 'database',
      sourceLabel: 'Tabela citizens',
      measuredAt: new Date().toISOString(),
      found: Boolean(citizen),
      item: citizen
        ? {
            id: citizen.id,
            name: citizen.name,
            cpf: citizen.cpf,
            email: citizen.email,
            phone: citizen.phone,
            verificationStatus: citizen.verificationStatus,
            isActive: citizen.isActive,
            createdAt: citizen.createdAt.toISOString(),
            lastLogin: citizen.lastLogin?.toISOString() || null,
          }
        : null,
    };
  }

  private async listDocumentTemplates(params: {
    query: string;
    limit: number;
  }): Promise<Record<string, unknown>> {
    const rows = await prisma.$queryRaw<DocumentTemplateListRow[]>(Prisma.sql`
      SELECT
        dt."id",
        dt."name",
        dt."code",
        dt."description",
        dt."documentType"::text AS "documentType",
        dt."outputFormat"::text AS "outputFormat",
        dt."isGlobal",
        dt."version"
      FROM "document_templates" dt
      WHERE dt."isActive" = true
      ORDER BY dt."name" ASC
      LIMIT 80
    `);

    const queryTerms = params.query
      .split(' ')
      .filter((term) => term.length >= 4 && !['para', 'mim', 'uma', 'documento', 'certidao'].includes(term));
    const scoredRows = rows
      .map((row) => {
        const searchable = normalizeText([row.name, row.code, row.description, row.documentType].filter(Boolean).join(' '));
        const score = queryTerms.reduce((total, term) => total + (searchable.includes(term) ? 1 : 0), 0);
        return { row, score };
      })
      .filter(({ score }) => score > 0 || queryTerms.length === 0)
      .sort((a, b) => b.score - a.score || a.row.name.localeCompare(b.row.name));

    const items = (scoredRows.length ? scoredRows : rows.map((row) => ({ row, score: 0 })))
      .slice(0, params.limit)
      .map(({ row }) => ({
        id: row.id,
        name: row.name,
        title: row.name,
        code: row.code,
        description: row.description,
        documentType: row.documentType,
        outputFormat: row.outputFormat,
        isGlobal: row.isGlobal,
        version: row.version,
      }));

    return {
      ok: true,
      entity: 'document_template_list',
      source: 'database',
      sourceLabel: 'Tabela document_templates',
      measuredAt: new Date().toISOString(),
      limit: params.limit,
      items,
    };
  }
}

export const applicationDataService = new ApplicationDataService();
