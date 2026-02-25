/**
 * Serviço de analytics e KPIs de processos internos
 */
import prisma from '../utils/prisma';
import logger from '../utils/logger';

// ============================================================================
// DASHBOARD PRINCIPAL
// ============================================================================

export async function getDashboard() {
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
    porSetor,
    urgentes,
    vencidos,
  ] = await Promise.all([
    prisma.internalProcess.count({ where: { status: 'ABERTO' } }),
    prisma.internalProcess.count({ where: { status: 'EM_TRAMITACAO' } }),
    prisma.internalProcess.count({ where: { status: 'PENDENTE' } }),
    prisma.internalProcess.count({ where: { status: 'CONCLUIDO' } }),
    prisma.internalProcess.count({ where: { status: 'CANCELADO' } }),
    prisma.internalProcess.count({ where: { status: 'ARQUIVADO' } }),
    prisma.internalProcess.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.internalProcess.count({
      where: { concludedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.internalProcess.groupBy({
      by: ['typeId'],
      _count: true,
      where: { status: { in: ['ABERTO', 'EM_TRAMITACAO', 'PENDENTE'] } },
    }),
    prisma.internalProcess.groupBy({
      by: ['currentSectorId', 'currentSectorName'],
      _count: true,
      where: { status: { in: ['ABERTO', 'EM_TRAMITACAO', 'PENDENTE'] } },
    }),
    prisma.internalProcess.count({
      where: {
        priority: { gte: 1 },
        status: { in: ['ABERTO', 'EM_TRAMITACAO', 'PENDENTE'] },
      },
    }),
    prisma.internalProcess.count({
      where: {
        dueAt: { lt: now },
        status: { in: ['ABERTO', 'EM_TRAMITACAO', 'PENDENTE'] },
      },
    }),
  ]);

  // Buscar nomes dos tipos
  const tipos = await prisma.internalProcessType.findMany({
    select: { id: true, name: true },
  });
  const tipoMap = new Map(tipos.map((t) => [t.id, t.name]));

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
    porTipo: porTipo.map((t) => ({
      tipoId: t.typeId,
      tipoNome: tipoMap.get(t.typeId) || 'Desconhecido',
      count: t._count,
    })),
    porSetor: porSetor.map((s) => ({
      setorId: s.currentSectorId,
      setorNome: s.currentSectorName,
      count: s._count,
    })),
  };
}

// ============================================================================
// PROCESSOS COM SLA VENCIDO
// ============================================================================

export async function getOverdueProcesses() {
  const now = new Date();

  return prisma.internalProcess.findMany({
    where: {
      dueAt: { lt: now },
      status: { in: ['ABERTO', 'EM_TRAMITACAO', 'PENDENTE'] },
    },
    include: {
      type: { select: { name: true, prefix: true } },
    },
    orderBy: { dueAt: 'asc' },
  });
}

// ============================================================================
// GARGALOS POR SETOR (processos parados há mais tempo)
// ============================================================================

export async function getBottlenecks() {
  const processes = await prisma.internalProcess.findMany({
    where: {
      status: { in: ['ABERTO', 'EM_TRAMITACAO', 'PENDENTE'] },
    },
    select: {
      id: true,
      number: true,
      subject: true,
      currentSectorId: true,
      currentSectorName: true,
      updatedAt: true,
      createdAt: true,
    },
    orderBy: { updatedAt: 'asc' },
    take: 50,
  });

  // Agrupar por setor
  const sectorMap = new Map<string, { sectorName: string; count: number; oldestDays: number }>();

  const now = new Date();
  for (const proc of processes) {
    const existing = sectorMap.get(proc.currentSectorId);
    const daysStale = Math.floor((now.getTime() - proc.updatedAt.getTime()) / (1000 * 60 * 60 * 24));

    if (!existing) {
      sectorMap.set(proc.currentSectorId, {
        sectorName: proc.currentSectorName,
        count: 1,
        oldestDays: daysStale,
      });
    } else {
      existing.count++;
      existing.oldestDays = Math.max(existing.oldestDays, daysStale);
    }
  }

  return Array.from(sectorMap.entries())
    .map(([sectorId, data]) => ({ sectorId, ...data }))
    .sort((a, b) => b.count - a.count);
}

// ============================================================================
// EXPORTAR CSV
// ============================================================================

export async function exportCSV(filters?: { status?: string; typeId?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.typeId) where.typeId = filters.typeId;

  const processes = await prisma.internalProcess.findMany({
    where,
    include: { type: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // Header CSV
  const header = [
    'Número',
    'Tipo',
    'Assunto',
    'Status',
    'Prioridade',
    'Sigilo',
    'Setor Origem',
    'Setor Atual',
    'Criado Por',
    'Responsável Atual',
    'Data Criação',
    'Prazo',
    'Data Conclusão',
  ].join(';');

  const rows = processes.map((p) =>
    [
      p.number,
      p.type.name,
      `"${(p.subject || '').replace(/"/g, '""')}"`,
      p.status,
      p.priority === 0 ? 'Normal' : p.priority === 1 ? 'Urgente' : 'Urgentíssimo',
      p.sigilo,
      p.originSectorName,
      p.currentSectorName,
      p.createdByName,
      p.currentUserName || '-',
      new Intl.DateTimeFormat('pt-BR').format(p.createdAt),
      p.dueAt ? new Intl.DateTimeFormat('pt-BR').format(p.dueAt) : '-',
      p.concludedAt ? new Intl.DateTimeFormat('pt-BR').format(p.concludedAt) : '-',
    ].join(';')
  );

  // UTF-8 BOM para Excel
  return '\ufeff' + [header, ...rows].join('\n');
}
