import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class SecurityOccurrenceHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'security_occurrence' || moduleEntity === 'REGISTRO_OCORRENCIA';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const occurrence = await prisma.securityOccurrence.create({
      data: {
        protocol: protocol.number,
        protocolId: protocol.id,
        occurrenceType: requestData.occurrenceType || requestData.type || 'OUTRO',
        type: requestData.type,
        severity: requestData.severity || 'MEDIUM',
        description: requestData.description,
        location: requestData.location,
        occurrenceDate: requestData.occurrenceDate ? new Date(requestData.occurrenceDate) : new Date(),
        reportedBy: requestData.reportedBy || requestData.citizenName,
        reporterName: requestData.reporterName || requestData.citizenName,
        reporterPhone: requestData.reporterPhone || requestData.phone,
        reporterCpf: requestData.reporterCpf || requestData.citizenCpf,
        status: 'OPEN'
      }
    });

    return {
      success: true,
      entityId: occurrence.id,
      entityType: 'SecurityOccurrence',
      data: occurrence
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.securityOccurrence.findUnique({
      where: { id }
    });
  }

  static async list(filters: any, prisma: PrismaClient) {
    const { page = 1, limit = 20, status, occurrenceType, severity } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (occurrenceType) where.occurrenceType = occurrenceType;
    if (severity) where.severity = severity;

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

  static async updateStatus(id: string, status: string, notes: string | undefined, prisma: PrismaClient) {
    return await prisma.securityOccurrence.update({
      where: { id },
      data: {
        status,
        ...(notes && { observations: notes })
      }
    });
  }
}
