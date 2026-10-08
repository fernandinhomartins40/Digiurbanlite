/**
 * Painel do Prefeito: tudo o que acontece na administração, numa leitura só.
 *  - Hoje: pedidos (no prazo, atrasados, concluídos no mês), satisfação,
 *    alertas, agenda do prefeito, assinaturas esperando, demandas do gabinete;
 *  - Secretarias: como cada uma está (abertos, atrasados, tempo, satisfação);
 *  - Gestão interna: processos internos, licitações por etapa, ordens do gabinete.
 * "Cobrar" avisa de verdade o responsável e a chefia da secretaria.
 */

import { prisma } from '../../lib/prisma';
import { tryGetTenantId } from '../../lib/tenant-context';
import notificationService from '../notification.service';
import { requestUrl } from '../signing/signature.service';
import { resolveFlow } from '../internal-process/flows/flows';
import { centralCalendarService, MAYOR_CALENDAR_KEY } from '../central-calendar.service';

const CLOSED = ['CONCLUIDO', 'CANCELADO'] as const;
const DAY = 24 * 60 * 60 * 1000;

const startOfMonth = (date: Date, offset = 0) => new Date(date.getFullYear(), date.getMonth() + offset, 1);
const days = (ms: number) => Math.round((ms / DAY) * 10) / 10;

/** Média de dias entre abertura e conclusão */
function averageDays(rows: Array<{ createdAt: Date; concludedAt: Date | null }>): number | null {
  const valid = rows.filter((row) => row.concludedAt && row.concludedAt >= row.createdAt);
  if (!valid.length) return null;
  return days(valid.reduce((sum, row) => sum + (row.concludedAt!.getTime() - row.createdAt.getTime()), 0) / valid.length);
}

export async function mayorOverview(user: { id: string }) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + DAY);
  const since90 = new Date(now.getTime() - 90 * DAY);
  const since30 = new Date(now.getTime() - 30 * DAY);
  const open = { status: { notIn: [...CLOSED] as any } };
  const overdue = { ...open, sla: { is: { isOverdue: true, isPaused: false } } };

  const [
    abertos,
    atrasados,
    novosHoje,
    concluidosMes,
    concluidosMesAnterior,
    concluded90,
    evaluations,
    openByDept,
    overdueByDept,
    concludedByDept,
    departments,
  ] = await Promise.all([
    prisma.protocolSimplified.count({ where: open }),
    prisma.protocolSimplified.count({ where: overdue }),
    prisma.protocolSimplified.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.protocolSimplified.count({ where: { status: 'CONCLUIDO', concludedAt: { gte: startOfMonth(now) } } }),
    prisma.protocolSimplified.count({ where: { status: 'CONCLUIDO', concludedAt: { gte: startOfMonth(now, -1), lt: startOfMonth(now) } } }),
    prisma.protocolSimplified.findMany({
      where: { status: 'CONCLUIDO', concludedAt: { gte: since90 } },
      select: { createdAt: true, concludedAt: true, departmentId: true },
      take: 5000,
    }),
    prisma.protocolEvaluationSimplified.findMany({
      where: { createdAt: { gte: since90 } },
      select: { rating: true, protocol: { select: { departmentId: true } } },
      take: 5000,
    }),
    prisma.protocolSimplified.groupBy({ by: ['departmentId'], where: open, _count: { _all: true } }),
    prisma.protocolSimplified.groupBy({ by: ['departmentId'], where: overdue, _count: { _all: true } }),
    prisma.protocolSimplified.groupBy({ by: ['departmentId'], where: { status: 'CONCLUIDO', concludedAt: { gte: since30 } }, _count: { _all: true } }),
    prisma.department.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  const rating = (list: Array<{ rating: number }>) => (list.length ? Math.round((list.reduce((sum, item) => sum + item.rating, 0) / list.length) * 10) / 10 : null);
  const countOf = (rows: Array<{ departmentId: string | null; _count: { _all: number } }>, id: string) => rows.find((row) => row.departmentId === id)?._count._all || 0;

  const secretarias = departments
    .map((department) => {
      const deptOpen = countOf(openByDept as any, department.id);
      const deptOverdue = countOf(overdueByDept as any, department.id);
      const deptEvaluations = evaluations.filter((item) => item.protocol?.departmentId === department.id);
      return {
        id: department.id,
        name: department.name,
        abertos: deptOpen,
        atrasados: deptOverdue,
        percentualAtraso: deptOpen ? Math.round((deptOverdue / deptOpen) * 100) : 0,
        concluidos30: countOf(concludedByDept as any, department.id),
        tempoMedioDias: averageDays(concluded90.filter((row) => row.departmentId === department.id)),
        satisfacao: rating(deptEvaluations),
        avaliacoes: deptEvaluations.length,
      };
    })
    .filter((item) => item.abertos || item.concluidos30 || item.avaliacoes)
    .sort((a, b) => b.atrasados - a.atrasados || b.abertos - a.abertos);

  // demandas do gabinete (cidadão atendido no gabinete → protocolo)
  const [ticketsByStatus, staleTickets] = await Promise.all([
    prisma.adminTicket.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.adminTicket.findMany({
      where: { status: 'PENDING', createdAt: { lt: new Date(now.getTime() - 2 * DAY) } },
      orderBy: { createdAt: 'asc' },
      take: 10,
      select: { id: true, number: true, title: true, createdAt: true, department: { select: { name: true } } },
    }),
  ]);

  // agenda do prefeito (hoje) e assinaturas esperando quem está olhando
  const mayorCalendarId = await centralCalendarService.ensureMayorCalendar().catch(() => null);
  const [agendaHoje, assinaturas] = await Promise.all([
    mayorCalendarId
      ? prisma.centralCalendarEvent.findMany({
          where: { calendarId: mayorCalendarId, startAt: { lt: todayEnd }, endAt: { gte: todayStart }, status: { notIn: ['CANCELED'] as any } },
          orderBy: { startAt: 'asc' },
          select: { id: true, title: true, startAt: true, endAt: true, location: true, status: true, isPrivate: true },
        })
      : Promise.resolve([]),
    prisma.signatureRequest.findMany({ where: { userId: user.id, status: 'PENDENTE' }, orderBy: { createdAt: 'asc' }, take: 10 }),
  ]);

  const gestaoInterna = await internalOverview(now);

  const alertas: Array<{ level: 'alto' | 'medio'; text: string; href?: string }> = [];
  for (const item of secretarias.filter((row) => row.abertos >= 5 && row.percentualAtraso >= 30)) {
    alertas.push({ level: item.percentualAtraso >= 50 ? 'alto' : 'medio', text: `${item.name}: ${item.atrasados} de ${item.abertos} pedidos atrasados (${item.percentualAtraso}%)` });
  }
  if (staleTickets.length) alertas.push({ level: 'medio', text: `${staleTickets.length} demanda(s) do gabinete sem resposta da secretaria há mais de 2 dias`, href: '/admin/chamados?aba=acompanhar' });
  if (gestaoInterna.licitacoesAtrasadas) alertas.push({ level: 'alto', text: `${gestaoInterna.licitacoesAtrasadas} contratação(ões) com etapa vencida`, href: '/admin/processos-internos' });
  if (assinaturas.length) alertas.push({ level: 'medio', text: `${assinaturas.length} documento(s) esperando a sua assinatura`, href: '/admin/assinaturas-digitais' });

  const satisfacao = rating(evaluations);
  return {
    hoje: {
      abertos,
      atrasados,
      noPrazo: Math.max(0, abertos - atrasados),
      novosHoje,
      concluidosMes,
      concluidosMesAnterior,
      tempoMedioDias: averageDays(concluded90),
      satisfacao,
      avaliacoes: evaluations.length,
    },
    alertas,
    agendaHoje,
    assinaturas: assinaturas.map((item) => ({ id: item.id, title: item.title, by: item.requestedByName, url: requestUrl(item), at: item.createdAt })),
    demandasGabinete: {
      porSituacao: Object.fromEntries(ticketsByStatus.map((item) => [item.status, item._count._all])),
      paradas: staleTickets,
    },
    secretarias,
    gestaoInterna,
  };
}

/** Processos internos e contratações (Lei 14.133) em andamento; ordens do gabinete */
async function internalOverview(now: Date) {
  const openStatus = { status: { in: ['ABERTO', 'EM_TRAMITE'] } };
  const [abertos, atrasados, porTipo, contratacoes, gabineteTeam] = await Promise.all([
    prisma.internalProcess.count({ where: openStatus }),
    prisma.internalProcess.count({ where: { ...openStatus, dueAt: { lt: now } } }),
    prisma.internalProcess.groupBy({ by: ['typeId'], where: openStatus, _count: { _all: true } }),
    prisma.internalProcess.findMany({
      where: { ...openStatus, flowKey: { not: null } },
      orderBy: [{ stageDueAt: 'asc' }],
      take: 30,
      select: { id: true, number: true, subject: true, flowKey: true, flowSnapshot: true, stageKey: true, stageDueAt: true, currentUnitName: true, fields: true },
    }),
    prisma.user.findMany({ where: { gabineteAccess: true, isActive: true } as any, select: { id: true } }),
  ]);
  const types = await prisma.internalProcessType.findMany({ where: { id: { in: porTipo.map((item) => item.typeId) } }, select: { id: true, name: true } });
  const typeName = new Map(types.map((item) => [item.id, item.name]));
  const ordens = gabineteTeam.length
    ? await prisma.internalProcess.findMany({
        where: { ...openStatus, createdById: { in: gabineteTeam.map((item) => item.id) } },
        orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }],
        take: 15,
        select: { id: true, number: true, subject: true, currentUnitName: true, dueAt: true, createdByName: true },
      })
    : [];
  const licitacoes = contratacoes.map((item) => {
    const flow = resolveFlow(item);
    const stage = flow?.stages.find((row) => row.key === item.stageKey);
    return {
      id: item.id,
      number: item.number,
      subject: item.subject,
      flow: flow?.name || '',
      stage: stage?.name || '',
      stageIndex: flow ? flow.stages.findIndex((row) => row.key === item.stageKey) + 1 : 0,
      stages: flow?.stages.length || 0,
      unit: item.currentUnitName,
      stageDueAt: item.stageDueAt,
      overdue: !!item.stageDueAt && item.stageDueAt < now,
      valor: Number((item.fields as any)?.valorEstimado || 0) || null,
    };
  });
  return {
    abertos,
    atrasados,
    porTipo: porTipo.map((item) => ({ name: typeName.get(item.typeId) || 'Outro', count: item._count._all })).sort((a, b) => b.count - a.count),
    licitacoes,
    licitacoesAtrasadas: licitacoes.filter((item) => item.overdue).length,
    ordens: ordens.map((item) => ({ ...item, overdue: !!item.dueAt && item.dueAt < now })),
  };
}

/** Pedidos atrasados de uma secretaria (para cobrar) */
export async function departmentOverdue(departmentId: string) {
  return prisma.protocolSimplified.findMany({
    where: { departmentId, status: { notIn: [...CLOSED] as any }, sla: { is: { isOverdue: true } } },
    orderBy: { createdAt: 'asc' },
    take: 50,
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
      createdAt: true,
      sla: { select: { daysOverdue: true, expectedEndDate: true } },
      service: { select: { name: true } },
      currentAssignedUser: { select: { name: true } },
    } as any,
  });
}

/** Chefia da secretaria (gerentes e coordenadores) */
async function departmentLeaders(departmentId: string): Promise<string[]> {
  const leaders = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ['MANAGER', 'COORDINATOR'] as any },
      OR: [{ departmentId }, { userDepartments: { some: { departmentId, isActive: true } } }],
    },
    select: { id: true },
  });
  return leaders.map((item) => item.id);
}

/** Cobrar um pedido: fica no histórico e avisa quem cuida e a chefia */
export async function chargeProtocol(actor: { id: string; name: string }, protocolId: string, note?: string) {
  const protocol = await prisma.protocolSimplified.findFirst({
    where: { id: protocolId },
    select: { id: true, number: true, title: true, departmentId: true, assignedUserId: true, currentAssignedUserId: true },
  });
  if (!protocol) return null;
  const text = String(note || '').trim().slice(0, 500);
  await prisma.protocolInteraction.create({
    data: {
      protocolId,
      type: 'URGENCY_REQUEST',
      authorType: 'SERVER',
      authorId: actor.id,
      authorName: actor.name,
      message: `Gabinete do Prefeito pediu urgência neste pedido.${text ? ` ${text}` : ''}`,
      isInternal: true,
    } as any,
  });
  const recipients = new Set<string>([
    ...[protocol.currentAssignedUserId, protocol.assignedUserId].filter(Boolean) as string[],
    ...(protocol.departmentId ? await departmentLeaders(protocol.departmentId) : []),
  ]);
  recipients.delete(actor.id);
  for (const recipientId of recipients) {
    await notificationService
      .notify({
        recipientType: 'user',
        recipientId,
        type: 'MAYOR_URGENCY',
        title: `Gabinete pede urgência: protocolo ${protocol.number}`,
        message: `${protocol.title}${text ? ` — ${text}` : ''}`,
        data: { actionUrl: `/admin/protocolos/${protocol.id}` },
      })
      .catch(() => undefined);
  }
  return { notified: recipients.size };
}

/** Cobrar a secretaria: avisa a chefia com o total de atrasados */
export async function chargeDepartment(actor: { id: string; name: string }, departmentId: string, note?: string) {
  const [department, overdueCount, leaders] = await Promise.all([
    prisma.department.findFirst({ where: { id: departmentId }, select: { id: true, name: true } }),
    prisma.protocolSimplified.count({ where: { departmentId, status: { notIn: [...CLOSED] as any }, sla: { is: { isOverdue: true } } } }),
    departmentLeaders(departmentId),
  ]);
  if (!department) return null;
  const text = String(note || '').trim().slice(0, 500);
  for (const recipientId of leaders.filter((id) => id !== actor.id)) {
    await notificationService
      .notify({
        recipientType: 'user',
        recipientId,
        type: 'MAYOR_URGENCY',
        title: `Gabinete cobra a ${department.name}`,
        message: `${overdueCount} pedido(s) atrasado(s).${text ? ` ${text}` : ''}`,
        data: { actionUrl: '/admin/protocolos?view=overdue' },
      })
      .catch(() => undefined);
  }
  return { notified: leaders.length, overdue: overdueCount };
}

export { MAYOR_CALENDAR_KEY };

/**
 * Modo TV do Painel do Prefeito (tela cheia, atualiza sozinho): números do
 * dia, pedidos chegando/andando ao vivo, demandas do gabinete e secretarias
 * com mais atraso. Os pontos do mapa vêm de /api/map/protocols.
 */
export async function mayorTvSnapshot() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const open = { status: { notIn: [...CLOSED] as any } };
  const overdue = { ...open, sla: { is: { isOverdue: true, isPaused: false } } };
  const since90 = new Date(now.getTime() - 90 * DAY);

  const [abertos, atrasados, novosHoje, concluidosHoje, concluidosMes, evaluations, feed, overdueByDept, ticketsByStatus, tickets, tenant] = await Promise.all([
    prisma.protocolSimplified.count({ where: open }),
    prisma.protocolSimplified.count({ where: overdue }),
    prisma.protocolSimplified.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.protocolSimplified.count({ where: { status: 'CONCLUIDO', concludedAt: { gte: todayStart } } }),
    prisma.protocolSimplified.count({ where: { status: 'CONCLUIDO', concludedAt: { gte: startOfMonth(now) } } }),
    prisma.protocolEvaluationSimplified.aggregate({ where: { createdAt: { gte: since90 } }, _avg: { rating: true }, _count: { _all: true } }),
    prisma.protocolSimplified.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        concludedAt: true,
        latitude: true,
        longitude: true,
        service: { select: { name: true } },
        department: { select: { name: true } },
        sla: { select: { isOverdue: true } },
      },
    }),
    prisma.protocolSimplified.groupBy({ by: ['departmentId'], where: overdue, _count: { _all: true } }),
    prisma.adminTicket.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.adminTicket.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: { id: true, number: true, title: true, status: true, createdAt: true, department: { select: { name: true } } },
    }),
    (async () => {
      const tenantId = tryGetTenantId();
      return tenantId ? prisma.tenant.findFirst({ where: { id: tenantId }, select: { nome: true } }).catch(() => null) : null;
    })(),
  ]);

  // gráficos: em aberto por situação, últimos 7 dias (chegaram × concluídos) e chegadas por hora hoje
  const since7 = new Date(todayStart.getTime() - 6 * DAY);
  const [openByStatus, created7, concluded7] = await Promise.all([
    prisma.protocolSimplified.groupBy({ by: ['status'], where: open, _count: { _all: true } }),
    prisma.protocolSimplified.findMany({ where: { createdAt: { gte: since7 } }, select: { createdAt: true }, take: 20000 }),
    prisma.protocolSimplified.findMany({ where: { status: 'CONCLUIDO', concludedAt: { gte: since7 } }, select: { concludedAt: true }, take: 20000 }),
  ]);
  const dayKey = (date: Date) => date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
  const semana = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(since7.getTime() + index * DAY);
    return { dia: dayKey(day), chegaram: 0, concluidos: 0 };
  });
  const byDay = new Map(semana.map((item) => [item.dia, item]));
  for (const row of created7) {
    const day = byDay.get(dayKey(row.createdAt));
    if (day) day.chegaram++;
  }
  for (const row of concluded7) {
    const day = row.concludedAt ? byDay.get(dayKey(row.concludedAt)) : undefined;
    if (day) day.concluidos++;
  }
  const hourOf = (date: Date) => Number(date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }));
  const horas = Array.from({ length: 24 }, (_, hora) => ({ hora: `${String(hora).padStart(2, '0')}h`, pedidos: 0 }));
  for (const row of created7) if (row.createdAt >= todayStart) horas[hourOf(row.createdAt) % 24].pedidos++;

  const deptIds = overdueByDept.map((item) => item.departmentId).filter(Boolean) as string[];
  const departments = deptIds.length ? await prisma.department.findMany({ where: { id: { in: deptIds } }, select: { id: true, name: true } }) : [];
  const deptName = new Map(departments.map((item) => [item.id, item.name]));

  return {
    municipality: (tenant as any)?.nome || null,
    generatedAt: now,
    kpis: {
      abertos,
      atrasados,
      noPrazo: Math.max(0, abertos - atrasados),
      novosHoje,
      concluidosHoje,
      concluidosMes,
      satisfacao: evaluations._avg.rating === null ? null : Math.round(evaluations._avg.rating * 10) / 10,
      avaliacoes: evaluations._count._all,
    },
    feed: feed.map((item) => ({
      ...item,
      overdue: !!item.sla?.isOverdue && !CLOSED.includes(item.status as any),
      isNew: item.createdAt >= todayStart,
    })),
    graficos: {
      situacao: openByStatus.map((item) => ({ status: item.status, total: item._count._all })),
      semana,
      horas,
    },
    secretariasAtrasadas: overdueByDept
      .map((item) => ({ name: deptName.get(item.departmentId as string) || 'Sem secretaria', count: item._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    demandas: {
      porSituacao: Object.fromEntries(ticketsByStatus.map((item) => [item.status, item._count._all])),
      recentes: tickets,
    },
  };
}
