import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, differenceInHours } from 'date-fns';

const prisma = new PrismaClient();

export interface AnalyticsFilter {
  tenantId: string;
  startDate?: Date;
  endDate?: Date;
  departmentId?: string;
  serviceId?: string;
  userId?: string;
}

export interface MetricsPeriod {
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  date: Date;
}

export class ProtocolAnalyticsService {
  /**
   * Calcula métricas gerais de protocolos para um período
   */
  async calculateProtocolMetrics(filter: AnalyticsFilter, period: MetricsPeriod) {
    const { startDate, endDate } = this.getPeriodRange(period);

    const protocols = await prisma.protocolSimplified.findMany({
      where: {
        tenantId: filter.tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        ...(filter.departmentId && { departmentId: filter.departmentId }),
        ...(filter.serviceId && { serviceId: filter.serviceId })
      },
      include: {
        history: true,
        evaluations: true,
        sla: true,
        interactions: true,
        documents: true,
        pendings: true
      }
    });

    // Métricas gerais
    const totalProtocols = protocols.length;
    const newProtocols = protocols.filter(p => p.createdAt >= startDate && p.createdAt <= endDate).length;
    const closedProtocols = protocols.filter(p => p.status === 'CONCLUIDO').length;
    const cancelledProtocols = protocols.filter(p => p.status === 'CANCELADO').length;
    const overdueProtocols = protocols.filter(p => p.sla?.isOverdue).length;

    // Métricas de tempo
    const completedProtocols = protocols.filter(p => p.concludedAt);
    const avgCompletionTime = completedProtocols.length > 0
      ? completedProtocols.reduce((sum, p) => {
          const hours = differenceInHours(p.concludedAt!, p.createdAt);
          return sum + hours;
        }, 0) / completedProtocols.length
      : null;

    const protocolsWithInteractions = protocols.filter(p => p.interactions && p.interactions.length > 0);
    const avgFirstResponse = protocolsWithInteractions.length > 0
      ? protocolsWithInteractions.reduce((sum, p) => {
          const firstInteraction = p.interactions![0];
          const hours = differenceInHours(new Date(firstInteraction.createdAt), p.createdAt);
          return sum + hours;
        }, 0) / protocolsWithInteractions.length
      : null;

    // Métricas de qualidade
    const protocolsWithEvaluation = protocols.filter(p => p.evaluations && p.evaluations.length > 0);
    const satisfactionScore = protocolsWithEvaluation.length > 0
      ? protocolsWithEvaluation.reduce((sum, p) => {
          const avgRating = p.evaluations!.reduce((s, e) => s + (e.rating || 0), 0) / p.evaluations!.length;
          return sum + avgRating;
        }, 0) / protocolsWithEvaluation.length
      : null;

    // Métricas de SLA
    const protocolsWithSLA = protocols.filter(p => p.sla);
    const slaComplianceRate = protocolsWithSLA.length > 0
      ? (protocolsWithSLA.filter(p => !p.sla!.isOverdue).length / protocolsWithSLA.length) * 100
      : null;

    const avgSlaDeviation = protocolsWithSLA.length > 0
      ? protocolsWithSLA.reduce((sum, p) => sum + (p.sla!.daysOverdue || 0), 0) / protocolsWithSLA.length
      : null;

    // Métricas de pendências
    const allPendings = protocols.flatMap(p => p.pendings || []);
    const totalPendings = allPendings.length;
    const resolvedPendings = allPendings.filter(p => p.status === 'RESOLVED').length;
    const avgPendingTime = resolvedPendings > 0
      ? allPendings
          .filter(p => p.resolvedAt)
          .reduce((sum, p) => {
            const hours = differenceInHours(p.resolvedAt!, p.createdAt);
            return sum + hours;
          }, 0) / resolvedPendings
      : null;

    // Métricas de documentos
    const allDocuments = protocols.flatMap(p => p.documents || []);
    const totalDocuments = allDocuments.length;
    const approvedDocuments = allDocuments.filter(d => d.status === 'APPROVED').length;
    const rejectedDocuments = allDocuments.filter(d => d.status === 'REJECTED').length;
    const documentApprovalRate = totalDocuments > 0
      ? (approvedDocuments / totalDocuments) * 100
      : null;

    // Salvar métricas
    const metrics = await prisma.protocolMetrics.upsert({
      where: {
        tenantId_periodType_periodDate: {
          tenantId: filter.tenantId,
          periodType: period.type,
          periodDate: period.date
        }
      },
      create: {
        tenantId: filter.tenantId,
        periodType: period.type,
        periodDate: period.date,
        totalProtocols,
        newProtocols,
        closedProtocols,
        cancelledProtocols,
        overdueProtocols,
        avgCompletionTime,
        avgFirstResponse,
        avgResolutionTime: avgCompletionTime,
        satisfactionScore,
        slaComplianceRate,
        avgSlaDeviation,
        totalPendings,
        resolvedPendings,
        avgPendingTime,
        totalDocuments,
        approvedDocuments,
        rejectedDocuments,
        documentApprovalRate
      },
      update: {
        totalProtocols,
        newProtocols,
        closedProtocols,
        cancelledProtocols,
        overdueProtocols,
        avgCompletionTime,
        avgFirstResponse,
        avgResolutionTime: avgCompletionTime,
        satisfactionScore,
        slaComplianceRate,
        avgSlaDeviation,
        totalPendings,
        resolvedPendings,
        avgPendingTime,
        totalDocuments,
        approvedDocuments,
        rejectedDocuments,
        documentApprovalRate,
        updatedAt: new Date()
      }
    });

    return metrics;
  }

  /**
   * Calcula métricas por departamento
   */
  async calculateDepartmentMetrics(filter: AnalyticsFilter, period: MetricsPeriod) {
    const { startDate, endDate } = this.getPeriodRange(period);

    if (!filter.departmentId) {
      throw new Error('departmentId is required for department metrics');
    }

    const protocols = await prisma.protocolSimplified.findMany({
      where: {
        tenantId: filter.tenantId,
        departmentId: filter.departmentId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        sla: true,
        evaluations: true
      }
    });

    const totalProtocols = protocols.length;
    const activeProtocols = protocols.filter(p =>
      p.status !== 'CONCLUIDO' && p.status !== 'CANCELADO'
    ).length;
    const completedProtocols = protocols.filter(p => p.status === 'CONCLUIDO').length;

    const protocolsWithConclusion = protocols.filter(p => p.concludedAt);
    const avgCompletionTime = protocolsWithConclusion.length > 0
      ? protocolsWithConclusion.reduce((sum, p) => {
          const hours = differenceInHours(p.concludedAt!, p.createdAt);
          return sum + hours;
        }, 0) / protocolsWithConclusion.length
      : null;

    const protocolsWithSLA = protocols.filter(p => p.sla);
    const slaComplianceRate = protocolsWithSLA.length > 0
      ? (protocolsWithSLA.filter(p => !p.sla!.isOverdue).length / protocolsWithSLA.length) * 100
      : null;

    const protocolsWithEvaluation = protocols.filter(p => p.evaluations && p.evaluations.length > 0);
    const satisfactionScore = protocolsWithEvaluation.length > 0
      ? protocolsWithEvaluation.reduce((sum, p) => {
          const avgRating = p.evaluations!.reduce((s, e) => s + (e.rating || 0), 0) / p.evaluations!.length;
          return sum + avgRating;
        }, 0) / protocolsWithEvaluation.length
      : null;

    // Contar servidores ativos no departamento
    const uniqueServers = new Set(protocols.map(p => p.assignedUserId).filter(Boolean));
    const serversCount = uniqueServers.size;
    const protocolsPerServer = serversCount > 0 ? totalProtocols / serversCount : null;

    const metrics = await prisma.departmentMetrics.upsert({
      where: {
        tenantId_departmentId_periodType_periodDate: {
          tenantId: filter.tenantId,
          departmentId: filter.departmentId,
          periodType: period.type,
          periodDate: period.date
        }
      },
      create: {
        tenantId: filter.tenantId,
        departmentId: filter.departmentId,
        periodType: period.type,
        periodDate: period.date,
        totalProtocols,
        activeProtocols,
        completedProtocols,
        avgCompletionTime,
        slaComplianceRate,
        satisfactionScore,
        protocolsPerServer,
        avgWorkload: activeProtocols / Math.max(serversCount, 1)
      },
      update: {
        totalProtocols,
        activeProtocols,
        completedProtocols,
        avgCompletionTime,
        slaComplianceRate,
        satisfactionScore,
        protocolsPerServer,
        avgWorkload: activeProtocols / Math.max(serversCount, 1),
        updatedAt: new Date()
      }
    });

    return metrics;
  }

  /**
   * Calcula métricas por serviço
   */
  async calculateServiceMetrics(filter: AnalyticsFilter, period: MetricsPeriod) {
    const { startDate, endDate } = this.getPeriodRange(period);

    if (!filter.serviceId) {
      throw new Error('serviceId is required for service metrics');
    }

    const protocols = await prisma.protocolSimplified.findMany({
      where: {
        tenantId: filter.tenantId,
        serviceId: filter.serviceId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        evaluations: true,
        documents: true,
        pendings: true,
        stages: true
      }
    });

    const totalRequests = protocols.length;
    const completedRequests = protocols.filter(p => p.status === 'CONCLUIDO').length;

    const protocolsWithConclusion = protocols.filter(p => p.concludedAt);
    const avgCompletionTime = protocolsWithConclusion.length > 0
      ? protocolsWithConclusion.reduce((sum, p) => {
          const hours = differenceInHours(p.concludedAt!, p.createdAt);
          return sum + hours;
        }, 0) / protocolsWithConclusion.length
      : null;

    const protocolsWithEvaluation = protocols.filter(p => p.evaluations && p.evaluations.length > 0);
    const satisfactionScore = protocolsWithEvaluation.length > 0
      ? protocolsWithEvaluation.reduce((sum, p) => {
          const avgRating = p.evaluations!.reduce((s, e) => s + (e.rating || 0), 0) / p.evaluations!.length;
          return sum + avgRating;
        }, 0) / protocolsWithEvaluation.length
      : null;

    // Análise de tempo em documentos
    const allDocuments = protocols.flatMap(p => p.documents || []);
    const documentsWithValidation = allDocuments.filter(d => d.validatedAt || d.rejectedAt);
    const avgDocumentTime = documentsWithValidation.length > 0
      ? documentsWithValidation.reduce((sum, d) => {
          const validationDate = d.validatedAt || d.rejectedAt!;
          const uploadDate = d.uploadedAt || d.createdAt;
          const hours = differenceInHours(validationDate, uploadDate);
          return sum + hours;
        }, 0) / documentsWithValidation.length
      : null;

    // Análise de tempo em pendências
    const allPendings = protocols.flatMap(p => p.pendings || []);
    const resolvedPendings = allPendings.filter(p => p.resolvedAt);
    const avgPendingTime = resolvedPendings.length > 0
      ? resolvedPendings.reduce((sum, p) => {
          const hours = differenceInHours(p.resolvedAt!, p.createdAt);
          return sum + hours;
        }, 0) / resolvedPendings.length
      : null;

    const metrics = await prisma.serviceMetrics.upsert({
      where: {
        tenantId_serviceId_periodType_periodDate: {
          tenantId: filter.tenantId,
          serviceId: filter.serviceId,
          periodType: period.type,
          periodDate: period.date
        }
      },
      create: {
        tenantId: filter.tenantId,
        serviceId: filter.serviceId,
        periodType: period.type,
        periodDate: period.date,
        totalRequests,
        completedRequests,
        avgCompletionTime,
        satisfactionScore,
        avgDocumentTime,
        avgPendingTime
      },
      update: {
        totalRequests,
        completedRequests,
        avgCompletionTime,
        satisfactionScore,
        avgDocumentTime,
        avgPendingTime,
        updatedAt: new Date()
      }
    });

    return metrics;
  }

  /**
   * Calcula performance individual de servidores
   */
  async calculateServerPerformance(filter: AnalyticsFilter, period: MetricsPeriod) {
    const { startDate, endDate } = this.getPeriodRange(period);

    if (!filter.userId) {
      throw new Error('userId is required for server performance metrics');
    }

    const protocols = await prisma.protocolSimplified.findMany({
      where: {
        tenantId: filter.tenantId,
        assignedUserId: filter.userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        sla: true,
        evaluations: true,
        interactions: {
          where: {
            authorId: filter.userId
          }
        },
        pendings: true
      }
    });

    const protocolsAssigned = protocols.length;
    const protocolsCompleted = protocols.filter(p => p.status === 'CONCLUIDO').length;
    const protocolsOnTime = protocols.filter(p =>
      p.status === 'CONCLUIDO' && p.sla && !p.sla.isOverdue
    ).length;
    const protocolsOverdue = protocols.filter(p => p.sla?.isOverdue).length;

    const completedProtocols = protocols.filter(p => p.concludedAt);
    const avgCompletionTime = completedProtocols.length > 0
      ? completedProtocols.reduce((sum, p) => {
          const hours = differenceInHours(p.concludedAt!, p.createdAt);
          return sum + hours;
        }, 0) / completedProtocols.length
      : null;

    const protocolsWithInteractions = protocols.filter(p => p.interactions && p.interactions.length > 0);
    const avgResponseTime = protocolsWithInteractions.length > 0
      ? protocolsWithInteractions.reduce((sum, p) => {
          const firstInteraction = p.interactions![0];
          const hours = differenceInHours(new Date(firstInteraction.createdAt), p.createdAt);
          return sum + hours;
        }, 0) / protocolsWithInteractions.length
      : null;

    const protocolsWithEvaluation = protocols.filter(p => p.evaluations && p.evaluations.length > 0);
    const satisfactionScore = protocolsWithEvaluation.length > 0
      ? protocolsWithEvaluation.reduce((sum, p) => {
          const avgRating = p.evaluations!.reduce((s, e) => s + (e.rating || 0), 0) / p.evaluations!.length;
          return sum + avgRating;
        }, 0) / protocolsWithEvaluation.length
      : null;

    const totalInteractions = protocols.reduce((sum, p) => sum + (p.interactions?.length || 0), 0);
    const avgInteractionsPerProtocol = protocolsAssigned > 0 ? totalInteractions / protocolsAssigned : null;

    const allPendings = protocols.flatMap(p => p.pendings || []);
    const resolvedPendings = allPendings.filter(p => p.status === 'RESOLVED').length;
    const pendingResolution = allPendings.length > 0 ? (resolvedPendings / allPendings.length) * 100 : null;

    const performance = await prisma.serverPerformance.upsert({
      where: {
        tenantId_userId_periodType_periodDate: {
          tenantId: filter.tenantId,
          userId: filter.userId,
          periodType: period.type,
          periodDate: period.date
        }
      },
      create: {
        tenantId: filter.tenantId,
        userId: filter.userId,
        periodType: period.type,
        periodDate: period.date,
        protocolsAssigned,
        protocolsCompleted,
        protocolsOnTime,
        protocolsOverdue,
        avgCompletionTime,
        avgResponseTime,
        satisfactionScore,
        pendingResolution,
        totalInteractions,
        avgInteractionsPerProtocol
      },
      update: {
        protocolsAssigned,
        protocolsCompleted,
        protocolsOnTime,
        protocolsOverdue,
        avgCompletionTime,
        avgResponseTime,
        satisfactionScore,
        pendingResolution,
        totalInteractions,
        avgInteractionsPerProtocol,
        updatedAt: new Date()
      }
    });

    return performance;
  }

  /**
   * Identifica gargalos no processo
   */
  async identifyBottlenecks(filter: AnalyticsFilter, period: MetricsPeriod) {
    const { startDate, endDate } = this.getPeriodRange(period);

    const protocols = await prisma.protocolSimplified.findMany({
      where: {
        tenantId: filter.tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        stages: true,
        documents: true,
        pendings: true
      }
    });

    const bottlenecks: Array<{
      type: string;
      entityId: string;
      entityName: string;
      affectedProtocols: number;
      avgStuckTime: number;
      maxStuckTime: number;
      totalDelayHours: number;
      impactScore: number;
    }> = [];

    // Análise de etapas
    const stageStats = new Map<string, { count: number; totalTime: number; maxTime: number }>();
    protocols.forEach(protocol => {
      protocol.stages?.forEach((stage: any) => {
        if (stage.startedAt && !stage.completedAt) {
          const stuckTime = differenceInHours(new Date(), new Date(stage.startedAt));
          const key = stage.stageName;

          if (!stageStats.has(key)) {
            stageStats.set(key, { count: 0, totalTime: 0, maxTime: 0 });
          }

          const stats = stageStats.get(key)!;
          stats.count++;
          stats.totalTime += stuckTime;
          stats.maxTime = Math.max(stats.maxTime, stuckTime);
        }
      });
    });

    stageStats.forEach((stats, stageName) => {
      const avgStuckTime = stats.totalTime / stats.count;
      const impactScore = Math.min(100, (stats.count * avgStuckTime) / 10);

      bottlenecks.push({
        type: 'STAGE',
        entityId: stageName,
        entityName: stageName,
        affectedProtocols: stats.count,
        avgStuckTime,
        maxStuckTime: stats.maxTime,
        totalDelayHours: stats.totalTime,
        impactScore
      });
    });

    // Análise de documentos pendentes
    const documentStats = new Map<string, { count: number; totalTime: number; maxTime: number }>();
    protocols.forEach(protocol => {
      protocol.documents?.forEach((doc: any) => {
        if (doc.status === 'PENDING' || doc.status === 'UPLOADED') {
          const waitTime = differenceInHours(new Date(), new Date(doc.createdAt));
          const key = doc.documentType;

          if (!documentStats.has(key)) {
            documentStats.set(key, { count: 0, totalTime: 0, maxTime: 0 });
          }

          const stats = documentStats.get(key)!;
          stats.count++;
          stats.totalTime += waitTime;
          stats.maxTime = Math.max(stats.maxTime, waitTime);
        }
      });
    });

    documentStats.forEach((stats, docType) => {
      const avgStuckTime = stats.totalTime / stats.count;
      const impactScore = Math.min(100, (stats.count * avgStuckTime) / 10);

      bottlenecks.push({
        type: 'DOCUMENT',
        entityId: docType,
        entityName: docType,
        affectedProtocols: stats.count,
        avgStuckTime,
        maxStuckTime: stats.maxTime,
        totalDelayHours: stats.totalTime,
        impactScore
      });
    });

    // Salvar bottlenecks
    for (const bottleneck of bottlenecks) {
      await prisma.protocolBottleneck.upsert({
        where: {
          tenantId_bottleneckType_entityId_periodType_periodDate: {
            tenantId: filter.tenantId,
            bottleneckType: bottleneck.type,
            entityId: bottleneck.entityId,
            periodType: period.type,
            periodDate: period.date
          }
        },
        create: {
          tenantId: filter.tenantId,
          bottleneckType: bottleneck.type,
          entityId: bottleneck.entityId,
          entityName: bottleneck.entityName,
          periodType: period.type,
          periodDate: period.date,
          affectedProtocols: bottleneck.affectedProtocols,
          avgStuckTime: bottleneck.avgStuckTime,
          maxStuckTime: bottleneck.maxStuckTime,
          totalDelayHours: bottleneck.totalDelayHours,
          impactScore: bottleneck.impactScore,
          priority: bottleneck.impactScore > 75 ? 'CRITICAL' : bottleneck.impactScore > 50 ? 'HIGH' : bottleneck.impactScore > 25 ? 'MEDIUM' : 'LOW'
        },
        update: {
          affectedProtocols: bottleneck.affectedProtocols,
          avgStuckTime: bottleneck.avgStuckTime,
          maxStuckTime: bottleneck.maxStuckTime,
          totalDelayHours: bottleneck.totalDelayHours,
          impactScore: bottleneck.impactScore,
          priority: bottleneck.impactScore > 75 ? 'CRITICAL' : bottleneck.impactScore > 50 ? 'HIGH' : bottleneck.impactScore > 25 ? 'MEDIUM' : 'LOW',
          updatedAt: new Date()
        }
      });
    }

    return bottlenecks;
  }

  /**
   * Obtém dashboard consolidado
   */
  async getDashboard(filter: AnalyticsFilter, periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' = 'MONTHLY') {
    const period: MetricsPeriod = {
      type: periodType,
      date: new Date()
    };

    const [protocolMetrics, bottlenecks] = await Promise.all([
      this.calculateProtocolMetrics(filter, period),
      this.identifyBottlenecks(filter, period)
    ]);

    // Buscar métricas de departamentos
    const departments = await prisma.department.findMany({
      where: { tenantId: filter.tenantId }
    });

    const departmentMetrics = await Promise.all(
      departments.map(dept =>
        this.calculateDepartmentMetrics({ ...filter, departmentId: dept.id }, period)
      )
    );

    // Buscar top servidores
    const topServers = await prisma.serverPerformance.findMany({
      where: {
        tenantId: filter.tenantId,
        periodType,
        periodDate: period.date
      },
      orderBy: {
        protocolsCompleted: 'desc'
      },
      take: 10
    });

    return {
      overview: protocolMetrics,
      departments: departmentMetrics,
      topServers,
      bottlenecks: bottlenecks.sort((a, b) => b.impactScore - a.impactScore).slice(0, 10)
    };
  }

  /**
   * Calcula período de datas baseado no tipo
   */
  private getPeriodRange(period: MetricsPeriod): { startDate: Date; endDate: Date } {
    const date = period.date;

    switch (period.type) {
      case 'DAILY':
        return {
          startDate: startOfDay(date),
          endDate: endOfDay(date)
        };
      case 'WEEKLY':
        return {
          startDate: startOfWeek(date, { weekStartsOn: 0 }),
          endDate: endOfWeek(date, { weekStartsOn: 0 })
        };
      case 'MONTHLY':
        return {
          startDate: startOfMonth(date),
          endDate: endOfMonth(date)
        };
      case 'YEARLY':
        return {
          startDate: startOfYear(date),
          endDate: endOfYear(date)
        };
    }
  }

  /**
   * Exporta relatório em formato CSV
   */
  async exportToCSV(filter: AnalyticsFilter, periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' = 'MONTHLY') {
    const dashboard = await this.getDashboard(filter, periodType);

    // Criar CSV com overview
    const csvLines = [
      'Métrica,Valor',
      `Total de Protocolos,${dashboard.overview.totalProtocols}`,
      `Novos Protocolos,${dashboard.overview.newProtocols}`,
      `Protocolos Concluídos,${dashboard.overview.closedProtocols}`,
      `Protocolos Cancelados,${dashboard.overview.cancelledProtocols}`,
      `Protocolos Atrasados,${dashboard.overview.overdueProtocols}`,
      `Tempo Médio de Conclusão (horas),${dashboard.overview.avgCompletionTime?.toFixed(2) || 'N/A'}`,
      `Tempo Médio de Primeira Resposta (horas),${dashboard.overview.avgFirstResponse?.toFixed(2) || 'N/A'}`,
      `Taxa de Cumprimento de SLA (%),${dashboard.overview.slaComplianceRate?.toFixed(2) || 'N/A'}`,
      `Nota de Satisfação,${dashboard.overview.satisfactionScore?.toFixed(2) || 'N/A'}`,
      '',
      'Top Gargalos',
      'Tipo,Nome,Protocolos Afetados,Tempo Médio (horas),Impacto',
      ...dashboard.bottlenecks.map(b =>
        `${b.type},${b.entityName},${b.affectedProtocols},${b.avgStuckTime.toFixed(2)},${b.impactScore.toFixed(2)}`
      )
    ];

    return csvLines.join('\n');
  }
}

export const protocolAnalyticsService = new ProtocolAnalyticsService();
