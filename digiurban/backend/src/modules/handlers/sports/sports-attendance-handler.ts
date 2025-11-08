import { PrismaClient, SportsAttendanceStatus } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class SportsAttendanceHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'sports_attendance' || moduleEntity === 'ATENDIMENTOS_ESPORTES';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const attendance = await prisma.sportsAttendance.create({
      data: {
        protocol: protocol.number,
        protocolId: protocol.id,
        citizenId: requestData.citizenId,
        citizenName: requestData.citizenName || requestData.name,
        contact: requestData.contact || requestData.phone || '',
        type: requestData.type || 'INFORMACAO',
        serviceType: requestData.serviceType,
        description: requestData.description,
        status: 'PENDING'
      }
    });

    return {
      success: true,
      entityId: attendance.id,
      entityType: 'SportsAttendance',
      data: attendance
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.sportsAttendance.findUnique({
      where: { id }
    });
  }

  static async list(filters: any, prisma: PrismaClient) {
    const { page = 1, limit = 20, status, type, citizenId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (citizenId) where.citizenId = citizenId;

    const [items, total] = await Promise.all([
      prisma.sportsAttendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.sportsAttendance.count({ where })
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

  static async updateStatus(id: string, status: SportsAttendanceStatus, notes: string | undefined, prisma: PrismaClient) {
    return await prisma.sportsAttendance.update({
      where: { id },
      data: {
        status,
        ...(notes && { observations: notes })
      }
    });
  }
}
