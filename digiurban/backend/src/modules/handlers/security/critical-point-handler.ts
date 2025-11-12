import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class CriticalPointHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'critical_point' || moduleEntity === 'CADASTRO_PONTO_CRITICO';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const point = await prisma.securityOccurrence.create({
      data: {
        protocol: protocol.number,
        protocolId: protocol.id,
        occurrenceType: 'PONTO_CRITICO',
        type: requestData.type || 'ponto_critico',
        description: requestData.description || '',
        location: requestData.location || '',
        coordinates: requestData.coordinates ? JSON.parse(JSON.stringify(requestData.coordinates)) : null,
        severity: 'HIGH',
        occurrenceDate: new Date(),
        reportedBy: requestData.reportedBy || requestData.citizenName || 'Sistema',
        reporterName: requestData.reporterName || requestData.citizenName || 'Sistema',
        reporterCpf: requestData.reporterCpf || requestData.citizenCpf || 'SISTEMA',
        reporterPhone: requestData.reporterPhone || requestData.phone,
        victimInfo: requestData.victimInfo ? JSON.parse(JSON.stringify(requestData.victimInfo)) : null,
        evidence: {
          pointType: requestData.pointType,
          riskLevel: requestData.riskLevel || 'HIGH',
          occurrenceFrequency: requestData.occurrenceFrequency,
          suggestedAction: requestData.suggestedAction,
          affectedPopulation: requestData.affectedPopulation
        },
        followUp: true,
        status: 'OPEN'
      }
    });

    return {
      success: true,
      entityId: point.id,
      entityType: 'SecurityOccurrence',
      data: point
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.securityOccurrence.findUnique({
      where: { id }
    });
  }

  static async list(filters: any, prisma: PrismaClient) {
    const { page = 1, limit = 20, status } = filters;
    const skip = (page - 1) * limit;

    const where: any = { occurrenceType: 'PONTO_CRITICO' };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.securityOccurrence.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.securityOccurrence.count({ where })
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async monitor(id: string, monitoringPlan: string, officerName: string, prisma: PrismaClient) {
    return await prisma.securityOccurrence.update({
      where: { id },
      data: {
        status: 'MONITORING',
        actions: monitoringPlan,
        officerName,
        followUp: true
      }
    });
  }

  static async updateStatus(id: string, status: string, notes: string | undefined, prisma: PrismaClient) {
    return await prisma.securityOccurrence.update({
      where: { id },
      data: {
        status,
        ...(notes && { resolution: notes })
      }
    });
  }
}
