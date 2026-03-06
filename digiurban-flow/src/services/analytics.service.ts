/**
 * Analytics service for internal processes.
 */
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { FlowAuthContext } from '../middleware/auth.middleware';
import { buildProcessVisibilityWhere } from './access-control.service';

function withVisibility(auth: FlowAuthContext, extra?: Prisma.InternalProcessWhereInput): Prisma.InternalProcessWhereInput {
  const visibility = buildProcessVisibilityWhere(auth);
  if (!extra) {
    return visibility;
  }
  return {
    AND: [visibility, extra],
  };
}

export async function getDashboard(auth: FlowAuthContext) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalAbertos,
    totalEmTramitacao,
    totalPendentes,
    totalConcluidos,
    totalCancelados,
    totalArquivados,
    criadosUltimos30Dias,
    concluidosUltimos30Dias,
    porTipo,
    porUnidade,
    urgentes,
    vencidos,
  ] = await Promise.all([
    prisma.internalProcess.count({ where: withVisibility(auth, { status: 'ABERTO' }) }),
    prisma.internalProcess.count({ where: withVisibility(auth, { status: 'EM_TRAMITACAO' }) }),
    prisma.internalProcess.count({ where: withVisibility(auth, { status: 'PENDENTE' }) }),
    prisma.internalProcess.count({ where: withVisibility(auth, { status: 'CONCLUIDO' }) }),
    prisma.internalProcess.count({ where: withVisibility(auth, { status: 'CANCELADO' }) }),
    prisma.internalProcess.count({ where: withVisibility(auth, { status: 'ARQUIVADO' }) }),
    prisma.internalProcess.count({
      where: withVisibility(auth, { createdAt: { gte: thirtyDaysAgo } }),
    }),
    prisma.internalProcess.count({
      where: withVisibility(auth, { concludedAt: { gte: thirtyDaysAgo } }),
    }),
    prisma.internalProcess.groupBy({
      by: ['typeId'],
      _count: true,
      where: withVisibility(auth, { status: { in: ['ABERTO', 'EM_TRAMITACAO', 'PENDENTE'] } }),
    }),
    prisma.internalProcess.groupBy({
      by: ['currentOrganizationalUnitId', 'currentOrganizationalUnitName'],
      _count: true,
      where: withVisibility(auth, { status: { in: ['ABERTO', 'EM_TRAMITACAO', 'PENDENTE'] } }),
    }),
    prisma.internalProcess.count({
      where: withVisibility(auth, {
        priority: { gte: 1 },
        status: { in: ['ABERTO', 'EM_TRAMITACAO', 'PENDENTE'] },
      }),
    }),
    prisma.internalProcess.count({
      where: withVisibility(auth, {
        dueAt: { lt: now },
        status: { in: ['ABERTO', 'EM_TRAMITACAO', 'PENDENTE'] },
      }),
    }),
  ]);

  const tipos = await prisma.internalProcessType.findMany({
    select: { id: true, name: true },
  });
  const tipoMap = new Map(tipos.map((tipo) => [tipo.id, tipo.name]));

  return {
    resumo: {
      abertos: totalAbertos,
      emTramitacao: totalEmTramitacao,
      pendentes: totalPendentes,
      concluidos: totalConcluidos,
      cancelados: totalCancelados,
      arquivados: totalArquivados,
      ativos: totalAbertos + totalEmTramitacao + totalPendentes,
      urgentes,
      vencidos,
    },
    ultimos30Dias: {
      criados: criadosUltimos30Dias,
      concluidos: concluidosUltimos30Dias,
    },
    porTipo: porTipo.map((tipo) => ({
      tipoId: tipo.typeId,
      tipoNome: tipoMap.get(tipo.typeId) || 'Desconhecido',
      count: tipo._count,
    })),
    porUnidade: porUnidade.map((unidade) => ({
      organizationalUnitId: unidade.currentOrganizationalUnitId,
      organizationalUnitName: unidade.currentOrganizationalUnitName,
      count: unidade._count,
    })),
  };
}

export async function getOverdueProcesses(auth: FlowAuthContext) {
  const now = new Date();

  return prisma.internalProcess.findMany({
    where: withVisibility(auth, {
      dueAt: { lt: now },
      status: { in: ['ABERTO', 'EM_TRAMITACAO', 'PENDENTE'] },
    }),
    include: {
      type: { select: { name: true, prefix: true } },
    },
    orderBy: { dueAt: 'asc' },
  });
}

export async function getBottlenecks(auth: FlowAuthContext) {
  const processes = await prisma.internalProcess.findMany({
    where: withVisibility(auth, {
      status: { in: ['ABERTO', 'EM_TRAMITACAO', 'PENDENTE'] },
    }),
    select: {
      id: true,
      number: true,
      subject: true,
      currentOrganizationalUnitId: true,
      currentOrganizationalUnitName: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'asc' },
    take: 100,
  });

  const unitMap = new Map<string, { unitName: string; count: number; oldestDays: number }>();
  const now = new Date();

  for (const process of processes) {
    const staleDays = Math.floor((now.getTime() - process.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    const current = unitMap.get(process.currentOrganizationalUnitId);

    if (!current) {
      unitMap.set(process.currentOrganizationalUnitId, {
        unitName: process.currentOrganizationalUnitName,
        count: 1,
        oldestDays: staleDays,
      });
      continue;
    }

    current.count += 1;
    current.oldestDays = Math.max(current.oldestDays, staleDays);
  }

  return Array.from(unitMap.entries())
    .map(([organizationalUnitId, data]) => ({
      organizationalUnitId,
      organizationalUnitName: data.unitName,
      count: data.count,
      oldestDays: data.oldestDays,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function exportCSV(
  auth: FlowAuthContext,
  filters?: { status?: string; typeId?: string },
) {
  const where: Prisma.InternalProcessWhereInput = {
    AND: [
      buildProcessVisibilityWhere(auth),
      ...(filters?.status ? [{ status: filters.status as any }] : []),
      ...(filters?.typeId ? [{ typeId: filters.typeId }] : []),
    ],
  };

  const processes = await prisma.internalProcess.findMany({
    where,
    include: {
      type: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const header = [
    'Numero',
    'Tipo',
    'Assunto',
    'Status',
    'Prioridade',
    'Sigilo',
    'Departamento Origem',
    'Unidade Origem',
    'Departamento Atual',
    'Unidade Atual',
    'Criado Por',
    'Responsavel Atual',
    'Data Criacao',
    'Prazo',
    'Data Conclusao',
  ].join(';');

  const rows = processes.map((process) =>
    [
      process.number,
      process.type.name,
      `"${(process.subject || '').replace(/"/g, '""')}"`,
      process.status,
      process.priority === 0 ? 'Normal' : process.priority === 1 ? 'Urgente' : 'Urgentissimo',
      process.sigilo,
      process.originDepartmentId || '-',
      process.originOrganizationalUnitName,
      process.currentDepartmentId || '-',
      process.currentOrganizationalUnitName,
      process.createdByName,
      process.currentUserName || '-',
      new Intl.DateTimeFormat('pt-BR').format(process.createdAt),
      process.dueAt ? new Intl.DateTimeFormat('pt-BR').format(process.dueAt) : '-',
      process.concludedAt ? new Intl.DateTimeFormat('pt-BR').format(process.concludedAt) : '-',
    ].join(';'),
  );

  return '\ufeff' + [header, ...rows].join('\n');
}
