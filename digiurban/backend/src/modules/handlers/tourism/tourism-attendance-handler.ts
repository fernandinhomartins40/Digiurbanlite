import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class TourismAttendanceHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'tourism_attendance' || moduleEntity === 'ATENDIMENTOS_TURISMO';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const attendance = await prisma.tourismAttendance.create({
      data: {
        protocol: protocol.number,
        protocolId: protocol.id,
        citizenId: requestData.citizenId,
        visitorName: requestData.visitorName || requestData.citizenName || requestData.name || '',
        visitorEmail: requestData.visitorEmail || requestData.email,
        visitorPhone: requestData.visitorPhone || requestData.phone,
        origin: requestData.origin,
        serviceType: requestData.serviceType || 'informacao',
        subject: requestData.subject || '',
        description: requestData.description || '',
        category: requestData.category,
        urgency: requestData.urgency || 'NORMAL',
        touristProfile: requestData.touristProfile ? JSON.parse(JSON.stringify(requestData.touristProfile)) : null,
        status: 'PENDING',
        source: 'manual'
      }
    });

    return {
      success: true,
      entityId: attendance.id,
      entityType: 'TourismAttendance',
      data: attendance
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.tourismAttendance.findUnique({
      where: { id },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true
          }
        }
      }
    });
  }

  static async list(filters: any, prisma: PrismaClient) {
    const { page = 1, limit = 20, status, serviceType, citizenId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (serviceType) where.serviceType = serviceType;
    if (citizenId) where.citizenId = citizenId;

    const [items, total] = await Promise.all([
      prisma.tourismAttendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              cpf: true
            }
          }
        }
      }),
      prisma.tourismAttendance.count({ where })
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
    return await prisma.tourismAttendance.update({
      where: { id },
      data: {
        status,
        ...(notes && { resolution: notes })
      }
    });
  }

  static async assign(id: string, agentName: string, prisma: PrismaClient) {
    return await prisma.tourismAttendance.update({
      where: { id },
      data: {
        assignedAgent: agentName,
        status: 'IN_PROGRESS'
      }
    });
  }
}
