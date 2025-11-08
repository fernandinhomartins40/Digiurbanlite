import { PrismaClient, HousingAttendanceStatus } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class HousingAttendanceHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'housing_attendance' || moduleEntity === 'ATENDIMENTOS_HABITACAO';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const attendance = await prisma.housingAttendance.create({
      data: {
        protocol: protocol.number,
        protocolId: protocol.id,
        citizenId: requestData.citizenId,
        citizenName: requestData.citizenName || requestData.name,
        citizenCPF: requestData.citizenCpf || requestData.cpf,
        contact: requestData.contact || requestData.phone || '',
        type: requestData.type || 'INFORMACAO',
        description: requestData.description,
        status: 'PENDING'
      }
    });

    return {
      success: true,
      entityId: attendance.id,
      entityType: 'HousingAttendance',
      data: attendance
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.housingAttendance.findUnique({
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
      prisma.housingAttendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.housingAttendance.count({ where })
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

  static async updateStatus(id: string, status: HousingAttendanceStatus, notes: string | undefined, prisma: PrismaClient) {
    return await prisma.housingAttendance.update({
      where: { id },
      data: {
        status,
        ...(notes && { observations: notes })
      }
    });
  }
}
