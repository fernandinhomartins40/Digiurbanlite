import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class SecurityAttendanceHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'security_attendance' || moduleEntity === 'ATENDIMENTOS_SEGURANCA';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const attendance = await prisma.securityAttendance.create({
      data: {
        protocol: protocol.number,
        protocolId: protocol.id,
        citizenId: requestData.citizenId,
        citizenName: requestData.citizenName || requestData.name,
        citizenCpf: requestData.citizenCpf || requestData.cpf,
        contact: requestData.contact || requestData.phone || '',
        serviceType: requestData.serviceType || 'INFORMACAO',
        subject: requestData.subject,
        description: requestData.description,
        urgency: requestData.urgency || 'NORMAL',
        status: 'PENDING'
      }
    });

    return {
      success: true,
      entityId: attendance.id,
      entityType: 'SecurityAttendance',
      data: attendance
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.securityAttendance.findUnique({
      where: { id }
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
      prisma.securityAttendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.securityAttendance.count({ where })
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
    return await prisma.securityAttendance.update({
      where: { id },
      data: {
        status,
        ...(notes && { observations: notes })
      }
    });
  }
}
