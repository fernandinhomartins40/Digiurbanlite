/**
 * Minha mesa — junta, numa lista só, o que espera pelo servidor.
 * Cada fonte reaproveita a regra de escopo já existente e, se falhar, volta vazia.
 * Formato da resposta documentado em routes/workbench.routes.ts.
 */

import { CentralCalendarEventStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { safeError } from '../../utils/logger';
import { buildProtocolScopeWhere, buildQueueViewConditions } from '../protocol-access.service';
import { buildActor, dashboard } from '../internal-process/internal-process.service';
import { centralCalendarService } from '../central-calendar.service';
import { brasiliaDayBounds, brasiliaDayKey } from '../agenda-medica/brasilia-time';
import { getRolePermissions } from '../../middleware/admin-auth';
import { canAccessDepartmentApp, getUserDepartmentCodes } from '../../middleware/department-access';
import { isFeatureEnabled } from '../../middleware/require-feature';
import { sortWorkbenchItems, WorkbenchUrgency } from './ordering';

export const WORKBENCH_TYPES = [
  'pedido',
  'pedido_sem_responsavel',
  'processo_interno',
  'assinatura',
  'cidadao',
  'conversa',
  'atendimento',
  'compromisso',
] as const;
export type WorkbenchType = (typeof WORKBENCH_TYPES)[number];

export interface WorkbenchItem {
  id: string;
  tipo: WorkbenchType;
  titulo: string;
  subtitulo: string | null;
  prazo: Date | null;
  atrasado: boolean;
  link: string;
}

export interface WorkbenchUser {
  id: string;
  role: string;
  name: string;
  departmentId?: string | null;
  departmentIds?: string[] | null;
  department?: { code?: string | null } | null;
}

const MAX_PER_SOURCE = 20;

interface SourceResult {
  items: WorkbenchItem[];
  counts: Partial<Record<WorkbenchType, number>>;
}
const EMPTY: SourceResult = { items: [], counts: {} };

async function safe<T>(name: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    safeError(`[minha mesa] fonte "${name}" falhou`, error);
    return fallback;
  }
}

// ---------------------------------------------------------------- pedidos

async function protocolSource(user: WorkbenchUser, view: 'mine' | 'unassigned', tipo: WorkbenchType, now: Date): Promise<SourceResult> {
  const scope = buildProtocolScopeWhere({ id: user.id, role: user.role, departmentId: user.departmentId, departmentIds: user.departmentIds });
  const where = { AND: [...scope, ...buildQueueViewConditions(view, user.id, now)] };
  const [rows, total] = await Promise.all([
    prisma.protocolSimplified.findMany({
      where,
      // mesma ordem de /protocols?sort=due
      orderBy: [{ sla: { expectedEndDate: 'asc' } }, { createdAt: 'asc' }],
      take: MAX_PER_SOURCE,
      select: {
        id: true,
        number: true,
        title: true,
        citizen: { select: { name: true } },
        sla: { select: { expectedEndDate: true, actualEndDate: true, isPaused: true } },
      },
    }),
    prisma.protocolSimplified.count({ where }),
  ]);
  return {
    counts: { [tipo]: total },
    items: rows.map((row) => {
      const running = !!row.sla && !row.sla.actualEndDate && !row.sla.isPaused;
      const prazo = running ? row.sla!.expectedEndDate : null;
      return {
        id: row.id,
        tipo,
        titulo: `${row.number} — ${row.title}`,
        subtitulo: row.citizen?.name || null,
        prazo,
        atrasado: !!prazo && prazo < now,
        link: `/admin/protocolos/${row.id}`,
      };
    }),
  };
}

// ---------------------------------------------------------------- processo interno + assinaturas

async function internalProcessSources(user: WorkbenchUser): Promise<{ processes: SourceResult; signatures: SourceResult }> {
  const data = await dashboard(await buildActor({ id: user.id, role: user.role, name: user.name }));

  const byId = new Map<string, WorkbenchItem>();
  for (const item of data.unread.items) {
    byId.set(item.id, {
      id: item.id,
      tipo: 'processo_interno',
      titulo: `${item.number} — ${item.subject}`,
      subtitulo: item.from ? `Chegou de ${item.from}` : 'Chegou para você',
      prazo: null,
      atrasado: false,
      link: `/admin/processos-internos/${item.id}`,
    });
  }
  let extraDeadlines = 0;
  for (const item of data.deadlines) {
    const existing = byId.get(item.id);
    if (!existing) extraDeadlines++;
    byId.set(item.id, {
      id: item.id,
      tipo: 'processo_interno',
      titulo: `${item.number} — ${item.subject}`,
      subtitulo: item.stageName ? `Etapa: ${item.stageName}` : existing?.subtitulo || 'Prazo do processo',
      prazo: item.due,
      atrasado: item.overdue,
      link: `/admin/processos-internos/${item.id}`,
    });
  }

  // toSign do dashboard = fila única de assinaturas (mesma consulta de /api/signatures/queue)
  const signatures = data.toSign.slice(0, MAX_PER_SOURCE).map<WorkbenchItem>((item) => ({
    id: item.id,
    tipo: 'assinatura',
    titulo: item.title || 'Documento para assinar',
    subtitulo: item.by ? `Pedido por ${item.by}` : null,
    prazo: null,
    atrasado: false,
    link: item.url,
  }));

  const processes = [...byId.values()].slice(0, MAX_PER_SOURCE);
  return {
    processes: { items: processes, counts: { processo_interno: data.unread.count + extraDeadlines } },
    signatures: { items: signatures, counts: { assinatura: data.toSign.length } },
  };
}

// ---------------------------------------------------------------- cidadãos aguardando conferência

function canVerifyCitizens(role: string): boolean {
  const permissions = getRolePermissions(role as any);
  return permissions.includes('*') || permissions.includes('citizens:verify') || permissions.includes('citizens:*');
}

async function citizenSource(user: WorkbenchUser): Promise<SourceResult> {
  if (!canVerifyCitizens(user.role)) return EMPTY;
  // mesma regra do contador do menu (pendingCitizens) e de /admin/citizens/pending
  const where = { verificationStatus: 'PENDING' as const, isActive: true };
  const [rows, total] = await Promise.all([
    prisma.citizen.findMany({ where, orderBy: { createdAt: 'asc' }, take: MAX_PER_SOURCE, select: { id: true, name: true } }),
    prisma.citizen.count({ where }),
  ]);
  return {
    counts: { cidadao: total },
    items: rows.map((row) => ({
      id: row.id,
      tipo: 'cidadao',
      titulo: row.name,
      subtitulo: 'Cadastro aguardando conferência',
      prazo: null,
      atrasado: false,
      link: '/admin/cidadaos/pendentes',
    })),
  };
}

// ---------------------------------------------------------------- conversas

// shortcut: espelha ConversationService.getUnreadCount e HandoverService.getPendingHandoverQueue do messages-server
// (outro processo, não importável); se o messages-server mudar a regra, atualizar aqui também.
async function conversationSource(user: WorkbenchUser): Promise<SourceResult> {
  const where = {
    status: 'ACTIVE' as const,
    OR: [
      { participant1Id: user.id, participant1Type: 'SERVER' as const, unreadCount1: { gt: 0 } },
      { participant2Id: user.id, participant2Type: 'SERVER' as const, unreadCount2: { gt: 0 } },
    ],
  };
  const [rows, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      take: MAX_PER_SOURCE,
      select: { id: true, participant1Id: true, unreadCount1: true, unreadCount2: true, lastMessagePreview: true },
    }),
    prisma.conversation.count({ where }),
  ]);
  return {
    counts: { conversa: total },
    items: rows.map((row) => {
      const unread = row.participant1Id === user.id ? row.unreadCount1 : row.unreadCount2;
      return {
        id: row.id,
        tipo: 'conversa',
        titulo: unread === 1 ? '1 mensagem nova' : `${unread} mensagens novas`,
        subtitulo: row.lastMessagePreview || null,
        prazo: null,
        atrasado: false,
        link: '/admin/mensagens',
      };
    }),
  };
}

async function handoverSource(): Promise<SourceResult> {
  const rows = await prisma.conversation.findMany({
    where: { isBotConversation: true, status: 'ACTIVE', activeFlowExecution: { isPaused: true } },
    take: 200,
    select: { id: true, participant1Id: true, metadata: true, lastMessagePreview: true, activeFlowExecution: { select: { pausedAt: true } } },
  });
  const waiting = rows
    .filter((row) => !((row.metadata as Record<string, any> | null) || {}).takenOverBy)
    .sort((a, b) => (a.activeFlowExecution?.pausedAt?.getTime() || 0) - (b.activeFlowExecution?.pausedAt?.getTime() || 0));
  const shown = waiting.slice(0, MAX_PER_SOURCE);
  const citizens = shown.length
    ? await prisma.citizen.findMany({ where: { id: { in: shown.map((row) => row.participant1Id) } }, select: { id: true, name: true } })
    : [];
  const names = new Map(citizens.map((citizen) => [citizen.id, citizen.name]));
  return {
    counts: { atendimento: waiting.length },
    items: shown.map((row) => ({
      id: row.id,
      tipo: 'atendimento',
      titulo: `${names.get(row.participant1Id) || 'Cidadão'} pediu para falar com um atendente`,
      subtitulo: row.lastMessagePreview || null,
      prazo: null,
      atrasado: false,
      link: '/admin/mensagens',
    })),
  };
}

// ---------------------------------------------------------------- compromissos de hoje

async function calendarSource(user: WorkbenchUser, now: Date): Promise<SourceResult> {
  const { start, end } = brasiliaDayBounds(brasiliaDayKey(now));
  const events = await centralCalendarService.listVisibleEvents({
    userId: user.id,
    startAt: start,
    endAt: new Date(end.getTime() - 1),
    status: [CentralCalendarEventStatus.SCHEDULED, CentralCalendarEventStatus.CONFIRMED, CentralCalendarEventStatus.IN_PROGRESS],
  });
  return {
    counts: { compromisso: events.length },
    items: events.slice(0, MAX_PER_SOURCE).map((event) => ({
      id: event.id,
      tipo: 'compromisso',
      titulo: event.title,
      subtitulo: event.allDay ? 'O dia todo' : event.location || null,
      prazo: event.startAt,
      atrasado: false,
      link: '/admin/agenda',
    })),
  };
}

// ---------------------------------------------------------------- filas dos apps (só contagem)

const APP_QUEUES = [
  { key: 'transporteEscolarQueue', departmentCode: 'EDUCACAO', feature: 'educacao', link: '/admin/apps/educacao/transporte' },
  { key: 'pedidoConsultaQueue', departmentCode: 'SAUDE', feature: 'saude', link: '/admin/apps/saude/atendimento/agendamentos' },
  { key: 'pedidoMedicamentoQueue', departmentCode: 'SAUDE', feature: 'saude', link: '/admin/apps/saude/farmacia' },
  { key: 'alteracaoCredencialQueue', departmentCode: 'TRANSPORTES_TRANSITO', feature: 'transportes-transito', link: '/admin/apps/transportes-transito' },
] as const;

export interface WorkbenchAppCount {
  app: string;
  quantidade: number;
  link: string;
}

async function appQueueCounts(user: WorkbenchUser, tenant: any): Promise<WorkbenchAppCount[]> {
  const queues = await import('../apps/portal-queues.service');
  const codes = ['ADMIN', 'SUPER_ADMIN'].includes(user.role) ? [] : await getUserDepartmentCodes(user as any);
  const allowed = APP_QUEUES.filter(
    (queue) => isFeatureEnabled(tenant, queue.feature) && canAccessDepartmentApp(user.role, codes, [queue.departmentCode])
  );
  const results = await Promise.all(
    allowed.map((queue) =>
      safe<WorkbenchAppCount | null>(
        queue.key,
        async () => {
          const service = queues[queue.key];
          // shortcut: list() traz no máx. 300 por fila; trocar por count() se alguma fila passar disso
          const items = await service.list('PENDENTE');
          return { app: service.APP, quantidade: items.length, link: queue.link };
        },
        null
      )
    )
  );
  return results.filter((item): item is WorkbenchAppCount => !!item && item.quantidade > 0);
}

// ---------------------------------------------------------------- junta tudo

export interface WorkbenchResponse {
  total: number;
  itens: Array<WorkbenchItem & { urgencia: WorkbenchUrgency }>;
  contagem: Record<WorkbenchType, number>;
  apps: WorkbenchAppCount[];
  geradoEm: Date;
}

export async function getWorkbench(user: WorkbenchUser, tenant: any, now = new Date()): Promise<WorkbenchResponse> {
  const [mine, unassigned, internal, citizens, conversations, handover, calendar, apps] = await Promise.all([
    safe('pedidos', () => protocolSource(user, 'mine', 'pedido', now), EMPTY),
    safe('pedidos sem responsável', () => protocolSource(user, 'unassigned', 'pedido_sem_responsavel', now), EMPTY),
    safe('processo interno', () => internalProcessSources(user), { processes: EMPTY, signatures: EMPTY }),
    safe('cidadãos', () => citizenSource(user), EMPTY),
    safe('conversas', () => conversationSource(user), EMPTY),
    safe('atendimentos', () => handoverSource(), EMPTY),
    safe('agenda', () => calendarSource(user, now), EMPTY),
    safe('apps', () => appQueueCounts(user, tenant), [] as WorkbenchAppCount[]),
  ]);

  const sources = [mine, unassigned, internal.processes, internal.signatures, citizens, conversations, handover, calendar];
  const contagem = Object.fromEntries(WORKBENCH_TYPES.map((tipo) => [tipo, 0])) as Record<WorkbenchType, number>;
  for (const source of sources) {
    for (const [tipo, value] of Object.entries(source.counts)) contagem[tipo as WorkbenchType] += value || 0;
  }

  return {
    total: Object.values(contagem).reduce((sum, value) => sum + value, 0),
    itens: sortWorkbenchItems(sources.flatMap((source) => source.items), now),
    contagem,
    apps,
    geradoEm: now,
  };
}
