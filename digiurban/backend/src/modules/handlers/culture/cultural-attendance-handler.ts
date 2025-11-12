import { PrismaClient, CulturalAttendanceStatus } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class CulturalAttendanceHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'cultural_attendance' || moduleEntity === 'ATENDIMENTOS_CULTURA';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const attendance = await prisma.culturalAttendance.create({
      data: {
        protocol: protocol.number,
        protocolId: protocol.id,
        citizenId: requestData.citizenId,
        citizenName: requestData.citizenName || requestData.name,
        contact: requestData.contact || requestData.phone || '',
        phone: requestData.phone,
        email: requestData.email,
        type: requestData.type || 'INFORMACAO',
        subject: requestData.subject,
        description: requestData.description,
        priority: requestData.priority || 'MEDIUM',
        status: 'PENDING',
        source: 'portal',
        serviceId: service.id
      }
    });

    return {
      success: true,
      entityId: attendance.id,
      entityType: 'CulturalAttendance',
      data: attendance
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.culturalAttendance.findUnique({
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
      prisma.culturalAttendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.culturalAttendance.count({ where })
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

  static async updateStatus(id: string, status: CulturalAttendanceStatus, notes: string | undefined, prisma: PrismaClient) {
    return await prisma.culturalAttendance.update({
      where: { id },
      data: {
        status,
        ...(notes && { observations: notes })
      }
    });
  }
}
