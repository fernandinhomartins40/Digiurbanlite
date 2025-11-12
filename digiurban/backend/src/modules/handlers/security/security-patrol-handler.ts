import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class SecurityPatrolHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'security_patrol' || moduleEntity === 'SOLICITACAO_RONDA' || moduleEntity === 'REGISTRO_PATRULHA';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const patrol = await prisma.securityPatrol.create({
      data: {
        protocolId: protocol.id,
        patrolType: requestData.patrolType || requestData.type || 'PREVENTIVA',
        route: requestData.route || requestData.area || requestData.location || '',
        startTime: requestData.startTime ? new Date(requestData.startTime) : new Date(),
        endTime: requestData.endTime ? new Date(requestData.endTime) : null,
        officerName: requestData.officerName || requestData.citizenName || '',
        officerBadge: requestData.officerBadge || null,
        guardName: requestData.guardName || requestData.officerName || requestData.citizenName,
        vehicle: requestData.vehicle || null,
        checkpoints: requestData.checkpoints ? JSON.parse(JSON.stringify(requestData.checkpoints)) : null,
        observations: requestData.observations || requestData.description,
        status: 'ACTIVE'
      }
    });

    return {
      success: true,
      entityId: patrol.id,
      entityType: 'SecurityPatrol',
      data: patrol
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.securityPatrol.findUnique({
      where: { id }
    });
  }

  static async list(filters: any, prisma: PrismaClient) {
    const { page = 1, limit = 20, status, patrolType } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (patrolType) where.patrolType = patrolType;

    const [items, total] = await Promise.all([
      prisma.securityPatrol.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.securityPatrol.count({ where })
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

  static async complete(id: string, endTime: Date, report: string, prisma: PrismaClient) {
    return await prisma.securityPatrol.update({
      where: { id },
      data: {
        endTime,
        observations: report,
        status: 'COMPLETED'
      }
    });
  }

  static async updateStatus(id: string, status: string, notes: string | undefined, prisma: PrismaClient) {
    return await prisma.securityPatrol.update({
      where: { id },
      data: {
        status,
        ...(notes && { observations: notes })
      }
    });
  }
}
