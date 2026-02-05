import { prisma } from '../lib/prisma';

// ============================================================================
// TYPES
// ============================================================================

export type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

interface PeriodRange {
  start: Date;
  end: Date;
}

export interface DashboardOverview {
  overview: {
    totalProtocols: number;
    newProtocols: number;
    closedProtocols: number;
    cancelledProtocols: number;
    overdueProtocols: number;
    avgCompletionTime: number | null;
    avgFirstResponse: number | null;
    satisfactionScore: number | null;
    slaComplianceRate: number | null;
    avgSlaDeviation: number | null;
  };
  departments: DepartmentMetric[];
  topServers: ServerMetric[];
  bottlenecks: BottleneckMetric[];
}

interface DepartmentMetric {
  departmentId: string;
  departmentName: string;
  totalProtocols: number;
  activeProtocols: number;
  completedProtocols: number;
  slaComplianceRate: number | null;
  avgCompletionTime: number | null;
}

interface ServerMetric {
  userId: string;
  userName: string;
  protocolsCompleted: number;
  protocolsOnTime: number;
  avgCompletionTime: number | null;
}

interface BottleneckMetric {
  entityName: string;
  entityId: string;
  bottleneckType: string;
  affectedProtocols: number;
  avgStuckTime: number;
  impactScore: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface TrendDataPoint {
  period: string;
  metrics: {
    totalProtocols: number;
    closedProtocols: number;
    avgCompletionTime: number | null;
    satisfactionScore: number | null;
    slaComplianceRate: number | null;
  } | null;
}

// ============================================================================
// HELPERS
// ============================================================================

function getPeriodRange(periodType: PeriodType): PeriodRange {
  const now = new Date();
  const start = new Date(now);

  switch (periodType) {
    case 'DAILY':
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    case 'WEEKLY':
      start.setDate(start.getDate() - 7);
      return { start, end: now };
    case 'MONTHLY':
      start.setMonth(start.getMonth() - 1);
      return { start, end: now };
    case 'YEARLY':
      start.setFullYear(start.getFullYear() - 1);
      return { start, end: now };
  }
}

function hoursToMs(hours: number): number {
  return hours * 60 * 60 * 1000;
}

function msToHours(ms: number): number {
  return ms / (1000 * 60 * 60);
}

function formatPeriodLabel(date: Date, periodType: PeriodType): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  switch (periodType) {
    case 'DAILY':
      return `${date.getDate()}/${months[date.getMonth()]}`;
    case 'WEEKLY':
      return `Sem ${Math.ceil(date.getDate() / 7)} - ${months[date.getMonth()]}`;
    case 'MONTHLY':
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    case 'YEARLY':
      return `${date.getFullYear()}`;
  }
}

// ============================================================================
// DASHBOARD - MÉTRICAS REAIS
// ============================================================================

export async function getDashboardOverview(
  periodType: PeriodType,
  departmentId?: string,
  serviceId?: string
): Promise<DashboardOverview> {
  const { start } = getPeriodRange(periodType);

  const baseWhere: any = {
    createdAt: { gte: start }
  };
  if (departmentId) baseWhere.departmentId = departmentId;
  if (serviceId) baseWhere.serviceId = serviceId;

  // ---- Counts em paralelo ----
  const [
    totalProtocols,
    newProtocols,
    closedProtocols,
    cancelledProtocols,
    completedProtocols,
  ] = await Promise.all([
    prisma.protocolSimplified.count({ where: baseWhere }),

    prisma.protocolSimplified.count({
      where: { ...baseWhere, createdAt: { gte: start } }
    }),

    prisma.protocolSimplified.count({
      where: { ...baseWhere, status: 'CONCLUIDO' }
    }),

    prisma.protocolSimplified.count({
      where: { ...baseWhere, status: 'CANCELADO' }
    }),

    prisma.protocolSimplified.findMany({
      where: { ...baseWhere, status: 'CONCLUIDO', concludedAt: { not: null } },
      select: { createdAt: true, concludedAt: true }
    })
  ]);

  // ---- Tempo médio de conclusão (horas) ----
  let avgCompletionTime: number | null = null;
  if (completedProtocols.length > 0) {
    const totalMs = completedProtocols.reduce((acc, p) => {
      return acc + (p.concludedAt!.getTime() - p.createdAt.getTime());
    }, 0);
    avgCompletionTime = msToHours(totalMs / completedProtocols.length);
  }

  // ---- Tempo médio de primeira resposta ----
  // Primeira interação do tipo SERVER após criação
  const firstResponses = await prisma.protocolInteraction.findMany({
    where: {
      protocol: baseWhere,
      authorType: 'SERVER',
    },
    select: {
      createdAt: true,
      protocol: { select: { createdAt: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Agrupar por protocolo e pegar a primeira
  const firstByProtocol = new Map<string, number>();
  // Queremos a menor diferença — usamos uma abordagem diferente:
  // buscamos interações SERVER agrupadas
  const protocolsWithFirstResponse = await prisma.protocolSimplified.findMany({
    where: baseWhere,
    select: {
      id: true,
      createdAt: true,
      interactions: {
        where: { authorType: 'SERVER' },
        orderBy: { createdAt: 'asc' },
        take: 1,
        select: { createdAt: true }
      }
    }
  });

  let avgFirstResponse: number | null = null;
  const responseTimes: number[] = [];
  for (const p of protocolsWithFirstResponse) {
    if (p.interactions.length > 0) {
      responseTimes.push(msToHours(p.interactions[0].createdAt.getTime() - p.createdAt.getTime()));
    }
  }
  if (responseTimes.length > 0) {
    avgFirstResponse = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  }

  // ---- Satisfação média ----
  const evaluations = await prisma.protocolEvaluationSimplified.aggregate({
    where: {
      protocol: baseWhere
    },
    _avg: { rating: true },
    _count: { rating: true }
  });
  const satisfactionScore = evaluations._avg.rating;

  // ---- SLA compliance ----
  const slaRecords = await prisma.protocolSLA.findMany({
    where: {
      protocol: baseWhere
    },
    select: { isOverdue: true, daysOverdue: true, expectedEndDate: true, actualEndDate: true }
  });

  let slaComplianceRate: number | null = null;
  let avgSlaDeviation: number | null = null;
  if (slaRecords.length > 0) {
    const onTime = slaRecords.filter(s => !s.isOverdue).length;
    slaComplianceRate = (onTime / slaRecords.length) * 100;
    const deviations = slaRecords.filter(s => s.daysOverdue > 0).map(s => s.daysOverdue);
    if (deviations.length > 0) {
      avgSlaDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    }
  }

  // ---- Protocolos atrasados (SLA vencido e ainda ativos) ----
  const overdueProtocols = await prisma.protocolSimplified.count({
    where: {
      ...baseWhere,
      status: { in: ['VINCULADO', 'PROGRESSO', 'PENDENCIA', 'ATUALIZACAO'] },
      sla: { isOverdue: true }
    }
  });

  // ---- Departamentos ----
  const departments = await getDepartmentMetrics(baseWhere);

  // ---- Top Servidores ----
  const topServers = await getTopServerMetrics(baseWhere);

  // ---- Gargalos ----
  const bottlenecks = await detectBottlenecks(baseWhere);

  return {
    overview: {
      totalProtocols,
      newProtocols,
      closedProtocols,
      cancelledProtocols,
      overdueProtocols,
      avgCompletionTime,
      avgFirstResponse,
      satisfactionScore,
      slaComplianceRate,
      avgSlaDeviation
    },
    departments,
    topServers,
    bottlenecks
  };
}

// ============================================================================
// DEPARTMENT METRICS
// ============================================================================

async function getDepartmentMetrics(baseWhere: any): Promise<DepartmentMetric[]> {
  // Buscar departamentos que têm protocolos no período
  const deptGroups = await prisma.protocolSimplified.groupBy({
    by: ['departmentId'],
    where: baseWhere,
    _count: { id: true }
  });

  const results: DepartmentMetric[] = [];

  for (const group of deptGroups) {
    const dept = await prisma.department.findFirst({
      where: { id: group.departmentId },
      select: { id: true, name: true }
    });

    const [active, completed, completedWithDates] = await Promise.all([
      prisma.protocolSimplified.count({
        where: {
          ...baseWhere,
          departmentId: group.departmentId,
          status: { in: ['VINCULADO', 'PROGRESSO', 'PENDENCIA', 'ATUALIZACAO'] }
        }
      }),
      prisma.protocolSimplified.count({
        where: { ...baseWhere, departmentId: group.departmentId, status: 'CONCLUIDO' }
      }),
      prisma.protocolSimplified.findMany({
        where: { ...baseWhere, departmentId: group.departmentId, status: 'CONCLUIDO', concludedAt: { not: null } },
        select: { createdAt: true, concludedAt: true }
      })
    ]);

    let avgCompletionTime: number | null = null;
    if (completedWithDates.length > 0) {
      const totalMs = completedWithDates.reduce((acc, p) => acc + (p.concludedAt!.getTime() - p.createdAt.getTime()), 0);
      avgCompletionTime = msToHours(totalMs / completedWithDates.length);
    }

    // SLA compliance do departamento
    const deptSLA = await prisma.protocolSLA.findMany({
      where: { protocol: { ...baseWhere, departmentId: group.departmentId } },
      select: { isOverdue: true }
    });
    let slaComplianceRate: number | null = null;
    if (deptSLA.length > 0) {
      slaComplianceRate = (deptSLA.filter(s => !s.isOverdue).length / deptSLA.length) * 100;
    }

    results.push({
      departmentId: group.departmentId,
      departmentName: dept?.name || `Departamento ${group.departmentId.slice(0, 8)}`,
      totalProtocols: group._count.id,
      activeProtocols: active,
      completedProtocols: completed,
      slaComplianceRate,
      avgCompletionTime
    });
  }

  return results.sort((a, b) => b.totalProtocols - a.totalProtocols);
}

// ============================================================================
// TOP SERVERS (SERVIDORES)
// ============================================================================

async function getTopServerMetrics(baseWhere: any): Promise<ServerMetric[]> {
  // Protocolos concluídos agrupados por servidor responsável
  const serverGroups = await prisma.protocolSimplified.groupBy({
    by: ['currentAssignedUserId'],
    where: {
      ...baseWhere,
      status: 'CONCLUIDO',
      currentAssignedUserId: { not: null }
    },
    _count: { id: true }
  });

  const results: ServerMetric[] = [];

  for (const group of serverGroups) {
    if (!group.currentAssignedUserId) continue;

    const user = await prisma.user.findFirst({
      where: { id: group.currentAssignedUserId },
      select: { id: true, name: true }
    });

    // Protocolos concluídos dentro do SLA
    const onTimeCount = await prisma.protocolSimplified.count({
      where: {
        ...baseWhere,
        currentAssignedUserId: group.currentAssignedUserId,
        status: 'CONCLUIDO',
        sla: { isOverdue: false }
      }
    });

    // Tempo médio
    const completedWithDates = await prisma.protocolSimplified.findMany({
      where: {
        ...baseWhere,
        currentAssignedUserId: group.currentAssignedUserId,
        status: 'CONCLUIDO',
        concludedAt: { not: null }
      },
      select: { createdAt: true, concludedAt: true }
    });

    let avgCompletionTime: number | null = null;
    if (completedWithDates.length > 0) {
      const totalMs = completedWithDates.reduce((acc, p) => acc + (p.concludedAt!.getTime() - p.createdAt.getTime()), 0);
      avgCompletionTime = msToHours(totalMs / completedWithDates.length);
    }

    results.push({
      userId: group.currentAssignedUserId,
      userName: user?.name || `Servidor ${group.currentAssignedUserId.slice(0, 8)}`,
      protocolsCompleted: group._count.id,
      protocolsOnTime: onTimeCount,
      avgCompletionTime
    });
  }

  return results
    .sort((a, b) => b.protocolsCompleted - a.protocolsCompleted)
    .slice(0, 10);
}

// ============================================================================
// BOTTLENECK DETECTION
// ============================================================================

async function detectBottlenecks(baseWhere: any): Promise<BottleneckMetric[]> {
  const bottlenecks: BottleneckMetric[] = [];

  // --- 1. Gargalos por Etapa (stages com maior tempo parado) ---
  const stagesInProgress = await prisma.protocolStage.findMany({
    where: {
      protocol: baseWhere,
      status: { in: ['IN_PROGRESS', 'PENDING'] },
      startedAt: { not: null }
    },
    select: {
      stageName: true,
      startedAt: true,
      protocol: { select: { id: true } }
    }
  });

  // Agrupar por stageName
  const stageMap = new Map<string, { count: number; totalHoursStuck: number }>();
  const now = new Date();
  for (const stage of stagesInProgress) {
    const hoursStuck = msToHours(now.getTime() - stage.startedAt!.getTime());
    const entry = stageMap.get(stage.stageName) || { count: 0, totalHoursStuck: 0 };
    entry.count++;
    entry.totalHoursStuck += hoursStuck;
    stageMap.set(stage.stageName, entry);
  }

  for (const [name, data] of stageMap.entries()) {
    const avgStuck = data.totalHoursStuck / data.count;
    if (avgStuck > 2) { // Apenas se estiver parado por mais de 2 horas
      bottlenecks.push({
        entityName: name,
        entityId: `stage_${name}`,
        bottleneckType: 'STAGE',
        affectedProtocols: data.count,
        avgStuckTime: avgStuck,
        impactScore: calculateImpactScore(data.count, avgStuck),
        priority: getPriority(data.count, avgStuck)
      });
    }
  }

  // --- 2. Gargalos por Documentos (UNDER_REVIEW há muito tempo) ---
  const docsUnderReview = await prisma.protocolDocument.findMany({
    where: {
      protocol: baseWhere,
      status: 'UNDER_REVIEW',
      uploadedAt: { not: null }
    },
    select: {
      documentType: true,
      uploadedAt: true,
      protocol: { select: { id: true } }
    }
  });

  const docMap = new Map<string, { count: number; totalHoursStuck: number }>();
  for (const doc of docsUnderReview) {
    if (!doc.uploadedAt) continue;
    const hoursStuck = msToHours(now.getTime() - doc.uploadedAt.getTime());
    const entry = docMap.get(doc.documentType) || { count: 0, totalHoursStuck: 0 };
    entry.count++;
    entry.totalHoursStuck += hoursStuck;
    docMap.set(doc.documentType, entry);
  }

  for (const [name, data] of docMap.entries()) {
    const avgStuck = data.totalHoursStuck / data.count;
    if (avgStuck > 4) {
      bottlenecks.push({
        entityName: `Documento: ${name}`,
        entityId: `doc_${name}`,
        bottleneckType: 'DOCUMENT',
        affectedProtocols: data.count,
        avgStuckTime: avgStuck,
        impactScore: calculateImpactScore(data.count, avgStuck),
        priority: getPriority(data.count, avgStuck)
      });
    }
  }

  // --- 3. Gargalos por Pendências (OPEN há muito tempo) ---
  const openPendings = await prisma.protocolPending.findMany({
    where: {
      protocol: baseWhere,
      status: 'OPEN',
      createdAt: { lte: new Date(now.getTime() - hoursToMs(24)) }
    },
    select: {
      type: true,
      createdAt: true,
      protocol: { select: { id: true } }
    }
  });

  const pendMap = new Map<string, { count: number; totalHoursStuck: number }>();
  for (const pend of openPendings) {
    const hoursStuck = msToHours(now.getTime() - pend.createdAt.getTime());
    const entry = pendMap.get(pend.type) || { count: 0, totalHoursStuck: 0 };
    entry.count++;
    entry.totalHoursStuck += hoursStuck;
    pendMap.set(pend.type, entry);
  }

  for (const [name, data] of pendMap.entries()) {
    const avgStuck = data.totalHoursStuck / data.count;
    bottlenecks.push({
      entityName: `Pendência: ${name}`,
      entityId: `pending_${name}`,
      bottleneckType: 'PENDING',
      affectedProtocols: data.count,
      avgStuckTime: avgStuck,
      impactScore: calculateImpactScore(data.count, avgStuck),
      priority: getPriority(data.count, avgStuck)
    });
  }

  // Ordenar por impacto DESC e limitar a 15
  return bottlenecks
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 15);
}

function calculateImpactScore(affectedCount: number, avgHoursStuck: number): number {
  // Score de 0-100 baseado em quantidade afetada e tempo parado
  const countScore = Math.min(affectedCount * 5, 50);   // até 50 pontos por quantidade
  const timeScore = Math.min(avgHoursStuck * 2, 50);     // até 50 pontos por tempo
  return Math.round(countScore + timeScore);
}

function getPriority(affectedCount: number, avgHoursStuck: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const score = calculateImpactScore(affectedCount, avgHoursStuck);
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
}

// ============================================================================
// TRENDS - SÉRIES TEMPORAIS
// ============================================================================

export async function getTrends(
  periodType: PeriodType,
  months: number,
  departmentId?: string,
  serviceId?: string
): Promise<TrendDataPoint[]> {
  const results: TrendDataPoint[] = [];
  const now = new Date();

  // Determinar quantos períodos gerar e qual granularidade usar
  let periodsCount: number;
  let stepFn: (date: Date, i: number) => Date;

  if (periodType === 'WEEKLY') {
    periodsCount = Math.min(months * 4, 52); // até 52 semanas
    stepFn = (date, i) => {
      const d = new Date(date);
      d.setDate(d.getDate() - (i * 7));
      return d;
    };
  } else {
    // MONTHLY (default)
    periodsCount = months;
    stepFn = (date, i) => {
      const d = new Date(date);
      d.setMonth(d.getMonth() - i);
      return d;
    };
  }

  // Gerar períodos do mais antigo para o mais recente
  const periods: { label: string; start: Date; end: Date }[] = [];

  for (let i = periodsCount - 1; i >= 0; i--) {
    const periodEnd = stepFn(now, i);
    let periodStart: Date;

    if (periodType === 'WEEKLY') {
      periodStart = new Date(periodEnd);
      periodStart.setDate(periodStart.getDate() - 7);
    } else {
      periodStart = new Date(periodEnd);
      periodStart.setMonth(periodStart.getMonth() - 1);
      periodStart.setDate(periodStart.getDate() + 1);
    }

    periods.push({
      label: formatPeriodLabel(periodEnd, periodType),
      start: periodStart,
      end: periodEnd
    });
  }

  // Buscar dados para cada período em paralelo
  const periodsData = await Promise.all(
    periods.map(async (period) => {
      const where: any = {
        createdAt: { gte: period.start, lte: period.end }
      };
      if (departmentId) where.departmentId = departmentId;
      if (serviceId) where.serviceId = serviceId;

      const [total, closed, completedWithDates, evals, slas] = await Promise.all([
        prisma.protocolSimplified.count({ where }),

        prisma.protocolSimplified.count({
          where: { ...where, status: 'CONCLUIDO' }
        }),

        prisma.protocolSimplified.findMany({
          where: { ...where, status: 'CONCLUIDO', concludedAt: { not: null } },
          select: { createdAt: true, concludedAt: true }
        }),

        prisma.protocolEvaluationSimplified.aggregate({
          where: { protocol: where },
          _avg: { rating: true }
        }),

        prisma.protocolSLA.findMany({
          where: { protocol: where },
          select: { isOverdue: true }
        })
      ]);

      let avgCompletionTime: number | null = null;
      if (completedWithDates.length > 0) {
        const totalMs = completedWithDates.reduce((acc, p) => acc + (p.concludedAt!.getTime() - p.createdAt.getTime()), 0);
        avgCompletionTime = msToHours(totalMs / completedWithDates.length);
      }

      let slaComplianceRate: number | null = null;
      if (slas.length > 0) {
        slaComplianceRate = (slas.filter(s => !s.isOverdue).length / slas.length) * 100;
      }

      return {
        period: period.label,
        metrics: total > 0 ? {
          totalProtocols: total,
          closedProtocols: closed,
          avgCompletionTime,
          satisfactionScore: evals._avg.rating,
          slaComplianceRate
        } : null
      };
    })
  );

  return periodsData;
}

// ============================================================================
// CSV EXPORT
// ============================================================================

export async function generateCSVReport(
  periodType: PeriodType,
  departmentId?: string,
  serviceId?: string
): Promise<string> {
  const dashboard = await getDashboardOverview(periodType, departmentId, serviceId);
  const { overview, departments, topServers, bottlenecks } = dashboard;

  const lines: string[] = [];

  // Header
  lines.push('=== RELATÓRIO DE ANALYTICS - DigiUrban ===');
  lines.push(`Período: ${periodType}`);
  lines.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
  lines.push('');

  // Overview
  lines.push('--- VISÃO GERAL ---');
  lines.push('Métrica,Valor');
  lines.push(`Total de Protocolos,${overview.totalProtocols}`);
  lines.push(`Novos Protocolos,${overview.newProtocols}`);
  lines.push(`Protocolos Concluídos,${overview.closedProtocols}`);
  lines.push(`Protocolos Cancelados,${overview.cancelledProtocols}`);
  lines.push(`Protocolos Atrasados,${overview.overdueProtocols}`);
  lines.push(`Tempo Médio de Conclusão (horas),${overview.avgCompletionTime?.toFixed(2) || 'N/A'}`);
  lines.push(`Tempo Médio de Primeira Resposta (horas),${overview.avgFirstResponse?.toFixed(2) || 'N/A'}`);
  lines.push(`Satisfação Média (0-5),${overview.satisfactionScore?.toFixed(2) || 'N/A'}`);
  lines.push(`Cumprimento de SLA (%),${overview.slaComplianceRate?.toFixed(2) || 'N/A'}`);
  lines.push(`Desvio Médio do SLA (dias),${overview.avgSlaDeviation?.toFixed(2) || 'N/A'}`);
  lines.push('');

  // Departamentos
  if (departments.length > 0) {
    lines.push('--- PERFORMANCE POR DEPARTAMENTO ---');
    lines.push('Departamento,Total Protocolos,Ativos,Concluídos,SLA (%),"Tempo Médio (h)"');
    for (const dept of departments) {
      lines.push(`"${dept.departmentName}",${dept.totalProtocols},${dept.activeProtocols},${dept.completedProtocols},${dept.slaComplianceRate?.toFixed(2) || 'N/A'},${dept.avgCompletionTime?.toFixed(2) || 'N/A'}`);
    }
    lines.push('');
  }

  // Top Servidores
  if (topServers.length > 0) {
    lines.push('--- TOP SERVIDORES ---');
    lines.push('Servidor,Protocolos Concluídos,No Prazo,% No Prazo,"Tempo Médio (h)"');
    for (const server of topServers) {
      const pctOnTime = server.protocolsCompleted > 0
        ? ((server.protocolsOnTime / server.protocolsCompleted) * 100).toFixed(2)
        : '0.00';
      lines.push(`"${server.userName}",${server.protocolsCompleted},${server.protocolsOnTime},${pctOnTime}%,${server.avgCompletionTime?.toFixed(2) || 'N/A'}`);
    }
    lines.push('');
  }

  // Gargalos
  if (bottlenecks.length > 0) {
    lines.push('--- GARGALOS IDENTIFICADOS ---');
    lines.push('Gargalo,Tipo,Protocolos Afetados,"Tempo Médio Parado (h)",Impacto,Prioridade');
    for (const b of bottlenecks) {
      lines.push(`"${b.entityName}",${b.bottleneckType},${b.affectedProtocols},${b.avgStuckTime.toFixed(2)},${b.impactScore.toFixed(0)},${b.priority}`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// RECALCULATE METRICS (atualiza tabelas de métricas agregadas)
// ============================================================================

export async function recalculateMetrics(periodType: PeriodType): Promise<{ bottlenecksFound: number }> {
  const { start } = getPeriodRange(periodType);
  const periodDate = new Date();

  const baseWhere: any = { createdAt: { gte: start } };

  // --- Recalcular ProtocolMetrics ---
  const [total, newCount, closed, cancelled] = await Promise.all([
    prisma.protocolSimplified.count({ where: baseWhere }),
    prisma.protocolSimplified.count({ where: { ...baseWhere, createdAt: { gte: start } } }),
    prisma.protocolSimplified.count({ where: { ...baseWhere, status: 'CONCLUIDO' } }),
    prisma.protocolSimplified.count({ where: { ...baseWhere, status: 'CANCELADO' } })
  ]);

  const completedWithDates = await prisma.protocolSimplified.findMany({
    where: { ...baseWhere, status: 'CONCLUIDO', concludedAt: { not: null } },
    select: { createdAt: true, concludedAt: true }
  });

  let avgCompletionTime: number | null = null;
  if (completedWithDates.length > 0) {
    const totalMs = completedWithDates.reduce((acc, p) => acc + (p.concludedAt!.getTime() - p.createdAt.getTime()), 0);
    avgCompletionTime = msToHours(totalMs / completedWithDates.length);
  }

  const evals = await prisma.protocolEvaluationSimplified.aggregate({
    where: { protocol: baseWhere },
    _avg: { rating: true }
  });

  const slas = await prisma.protocolSLA.findMany({
    where: { protocol: baseWhere },
    select: { isOverdue: true, daysOverdue: true }
  });

  let slaComplianceRate: number | null = null;
  let avgSlaDeviation: number | null = null;
  if (slas.length > 0) {
    slaComplianceRate = (slas.filter(s => !s.isOverdue).length / slas.length) * 100;
    const deviations = slas.filter(s => s.daysOverdue > 0).map(s => s.daysOverdue);
    if (deviations.length > 0) {
      avgSlaDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    }
  }

  const overdueCount = await prisma.protocolSimplified.count({
    where: {
      ...baseWhere,
      status: { in: ['VINCULADO', 'PROGRESSO', 'PENDENCIA', 'ATUALIZACAO'] },
      sla: { isOverdue: true }
    }
  });

  // Upsert ProtocolMetrics
  const existingMetrics = await prisma.protocolMetrics.findFirst({
    where: { periodType, periodDate: { gte: new Date(periodDate.getFullYear(), periodDate.getMonth(), 1) } }
  });

  const metricsData = {
    totalProtocols: total,
    newProtocols: newCount,
    closedProtocols: closed,
    cancelledProtocols: cancelled,
    overdueProtocols: overdueCount,
    avgCompletionTime,
    satisfactionScore: evals._avg.rating,
    slaComplianceRate,
    avgSlaDeviation
  };

  if (existingMetrics) {
    await prisma.protocolMetrics.update({
      where: { id: existingMetrics.id },
      data: metricsData
    });
  } else {
    await prisma.protocolMetrics.create({
      data: {
        periodType,
        periodDate,
        ...metricsData
      }
    });
  }

  // --- Recalcular DepartmentMetrics ---
  const departments = await prisma.department.findMany({ where: { isActive: true } });
  for (const dept of departments) {
    const deptWhere = { ...baseWhere, departmentId: dept.id };
    const deptTotal = await prisma.protocolSimplified.count({ where: deptWhere });
    if (deptTotal === 0) continue;

    const deptActive = await prisma.protocolSimplified.count({
      where: { ...deptWhere, status: { in: ['VINCULADO', 'PROGRESSO', 'PENDENCIA', 'ATUALIZACAO'] } }
    });
    const deptCompleted = await prisma.protocolSimplified.count({
      where: { ...deptWhere, status: 'CONCLUIDO' }
    });

    const existingDept = await prisma.departmentMetrics.findFirst({
      where: { departmentId: dept.id, periodType, periodDate: { gte: new Date(periodDate.getFullYear(), periodDate.getMonth(), 1) } }
    });

    const deptData = {
      totalProtocols: deptTotal,
      activeProtocols: deptActive,
      completedProtocols: deptCompleted
    };

    if (existingDept) {
      await prisma.departmentMetrics.update({ where: { id: existingDept.id }, data: deptData });
    } else {
      await prisma.departmentMetrics.create({
        data: { departmentId: dept.id, periodType, periodDate, ...deptData }
      });
    }
  }

  // --- Recalcular Bottlenecks e salvar ---
  const bottlenecks = await detectBottlenecks(baseWhere);

  // Limpar bottlenecks antigos do período
  await prisma.protocolBottleneck.deleteMany({
    where: {
      periodType,
      periodDate: { gte: new Date(periodDate.getFullYear(), periodDate.getMonth(), 1) }
    }
  });

  // Inserir novos
  for (const b of bottlenecks) {
    await prisma.protocolBottleneck.create({
      data: {
        bottleneckType: b.bottleneckType,
        entityId: b.entityId,
        entityName: b.entityName,
        periodType,
        periodDate,
        affectedProtocols: b.affectedProtocols,
        avgStuckTime: b.avgStuckTime,
        maxStuckTime: b.avgStuckTime * 1.5, // estimativa
        totalDelayHours: b.avgStuckTime * b.affectedProtocols,
        impactScore: b.impactScore,
        priority: b.priority
      }
    });
  }

  return { bottlenecksFound: bottlenecks.length };
}

// ============================================================================
// KPIs
// ============================================================================

export async function calculateKPIs(): Promise<KPIResult[]> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const baseWhere = { createdAt: { gte: thirtyDaysAgo } };

  const [total, closed, overdue, evals, slas] = await Promise.all([
    prisma.protocolSimplified.count({ where: baseWhere }),
    prisma.protocolSimplified.count({ where: { ...baseWhere, status: 'CONCLUIDO' } }),
    prisma.protocolSimplified.count({
      where: {
        ...baseWhere,
        status: { in: ['VINCULADO', 'PROGRESSO', 'PENDENCIA', 'ATUALIZACAO'] },
        sla: { isOverdue: true }
      }
    }),
    prisma.protocolEvaluationSimplified.aggregate({
      where: { protocol: baseWhere },
      _avg: { rating: true }
    }),
    prisma.protocolSLA.findMany({
      where: { protocol: baseWhere },
      select: { isOverdue: true }
    })
  ]);

  const completionRate = total > 0 ? (closed / total) * 100 : 0;
  const slaCompliance = slas.length > 0 ? (slas.filter(s => !s.isOverdue).length / slas.length) * 100 : 100;

  const kpis: KPIResult[] = [
    {
      id: 'completion_rate',
      name: 'Taxa de Conclusão',
      category: 'performance',
      value: completionRate,
      unit: '%',
      target: 80,
      warning: 60,
      critical: 40,
      status: getKPIStatusFromThresholds(completionRate, 80, 60, 40),
      trend: 'stable'
    },
    {
      id: 'sla_compliance',
      name: 'Cumprimento de SLA',
      category: 'performance',
      value: slaCompliance,
      unit: '%',
      target: 90,
      warning: 70,
      critical: 50,
      status: getKPIStatusFromThresholds(slaCompliance, 90, 70, 50),
      trend: 'stable'
    },
    {
      id: 'satisfaction',
      name: 'Satisfação do Cidadão',
      category: 'quality',
      value: evals._avg.rating || 0,
      unit: '/5',
      target: 4,
      warning: 3,
      critical: 2,
      status: getKPIStatusFromThresholds(evals._avg.rating || 0, 4, 3, 2),
      trend: 'stable'
    },
    {
      id: 'overdue_protocols',
      name: 'Protocolos Atrasados',
      category: 'risk',
      value: overdue,
      unit: 'unid.',
      target: 0,
      warning: 5,
      critical: 15,
      // Para "atrasados", menor é melhor
      status: overdue <= 0 ? 'good' : overdue <= 5 ? 'warning' : 'critical',
      trend: 'stable'
    },
    {
      id: 'total_protocols',
      name: 'Total de Protocolos (30d)',
      category: 'volume',
      value: total,
      unit: 'unid.',
      target: null,
      warning: null,
      critical: null,
      status: 'normal',
      trend: 'stable'
    }
  ];

  return kpis;
}

interface KPIResult {
  id: string;
  name: string;
  category: string;
  value: number;
  unit: string;
  target: number | null;
  warning: number | null;
  critical: number | null;
  status: 'good' | 'warning' | 'critical' | 'normal';
  trend: 'up' | 'down' | 'stable';
}

function getKPIStatusFromThresholds(value: number, target: number, warning: number, critical: number): 'good' | 'warning' | 'critical' | 'normal' {
  if (value >= target) return 'good';
  if (value >= warning) return 'warning';
  if (value < critical) return 'critical';
  return 'normal';
}

// ============================================================================
// BENCHMARKS
// ============================================================================

export async function getBenchmarkComparison(metric: string): Promise<BenchmarkComparison | null> {
  const benchmarks = await prisma.benchmark.findMany({
    where: { metric },
    orderBy: { updatedAt: 'desc' }
  });

  if (benchmarks.length === 0) return null;

  // Calcular valor atual do sistema
  let currentValue: number | null = null;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const baseWhere = { createdAt: { gte: thirtyDaysAgo } };

  switch (metric) {
    case 'sla_compliance': {
      const slas = await prisma.protocolSLA.findMany({
        where: { protocol: baseWhere },
        select: { isOverdue: true }
      });
      if (slas.length > 0) currentValue = (slas.filter(s => !s.isOverdue).length / slas.length) * 100;
      break;
    }
    case 'satisfaction_score': {
      const evals = await prisma.protocolEvaluationSimplified.aggregate({
        where: { protocol: baseWhere },
        _avg: { rating: true }
      });
      currentValue = evals._avg.rating;
      break;
    }
    case 'completion_rate': {
      const total = await prisma.protocolSimplified.count({ where: baseWhere });
      const closed = await prisma.protocolSimplified.count({ where: { ...baseWhere, status: 'CONCLUIDO' } });
      if (total > 0) currentValue = (closed / total) * 100;
      break;
    }
  }

  const latest = benchmarks[0];
  let position: string = 'average';
  if (currentValue !== null) {
    if (latest.p75 && currentValue >= latest.p75) position = 'excellent';
    else if (latest.p50 && currentValue >= latest.p50) position = 'good';
    else if (latest.p25 && currentValue >= latest.p25) position = 'below_average';
    else position = 'poor';
  }

  return {
    metric,
    currentValue,
    benchmark: {
      p25: latest.p25,
      p50: latest.p50,
      p75: latest.p75,
      average: latest.average,
      region: latest.region,
      population: latest.population,
      source: latest.source,
      year: latest.year
    },
    position
  };
}

interface BenchmarkComparison {
  metric: string;
  currentValue: number | null;
  benchmark: {
    p25: number | null;
    p50: number | null;
    p75: number | null;
    average: number | null;
    region: string;
    population: string;
    source: string | null;
    year: number;
  };
  position: string;
}
