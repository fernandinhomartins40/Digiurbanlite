import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class CameraRequestHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'camera_request' || moduleEntity === 'SOLICITACAO_CAMERA_SEGURANCA';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const request = await prisma.securityOccurrence.create({
      data: {
        protocol: protocol.number,
        protocolId: protocol.id,
        occurrenceType: 'SOLICITACAO_CAMERA',
        type: requestData.type || 'solicitacao_camera',
        description: requestData.description || '',
        location: requestData.location || '',
        coordinates: requestData.coordinates ? JSON.parse(JSON.stringify(requestData.coordinates)) : null,
        severity: requestData.severity || 'MEDIUM',
        occurrenceDate: new Date(),
        reportedBy: requestData.reportedBy || requestData.citizenName,
        reporterName: requestData.reporterName || requestData.citizenName,
        reporterPhone: requestData.reporterPhone || requestData.phone,
        reporterCpf: requestData.reporterCpf || requestData.citizenCpf,
        victimInfo: requestData.victimInfo ? JSON.parse(JSON.stringify(requestData.victimInfo)) : null,
        evidence: {
          requestType: 'camera',
          reason: requestData.reason,
          area: requestData.area,
          priority: requestData.priority
        },
        status: 'OPEN'
      }
    });

    return {
      success: true,
      entityId: request.id,
      entityType: 'SecurityOccurrence',
      data: request
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

    const where: any = { occurrenceType: 'SOLICITACAO_CAMERA' };
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

  static async approve(id: string, installationDate: Date, prisma: PrismaClient) {
    return await prisma.securityOccurrence.update({
      where: { id },
      data: {
        status: 'APPROVED',
        resolution: `Instalação agendada para ${installationDate.toLocaleDateString()}`
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
