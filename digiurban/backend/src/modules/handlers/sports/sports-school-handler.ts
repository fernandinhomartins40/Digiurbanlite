import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class SportsSchoolHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'sports_school' || moduleEntity === 'INSCRICAO_ESCOLINHA';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const enrollment = await prisma.sportsSchoolEnrollment.create({
      data: {
        protocolId: protocol.id,
        sportsSchoolId: requestData.sportsSchoolId || requestData.schoolId,
        studentName: requestData.studentName || requestData.citizenName,
        studentBirthDate: new Date(requestData.studentBirthDate),
        studentCpf: requestData.studentCpf,
        studentRg: requestData.studentRg,
        parentName: requestData.parentName || requestData.guardianName,
        parentCpf: requestData.parentCpf || requestData.guardianCpf,
        parentPhone: requestData.parentPhone || requestData.phone,
        parentEmail: requestData.parentEmail || requestData.email,
        address: requestData.address,
        neighborhood: requestData.neighborhood,
        sport: requestData.sport,
        level: requestData.level || 'INICIANTE',
        status: 'PENDING'
      }
    });

    return {
      success: true,
      entityId: enrollment.id,
      entityType: 'SportsSchoolEnrollment',
      data: enrollment
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.sportsSchoolEnrollment.findUnique({
      where: { id }
    });
  }

  static async list(filters: any, prisma: PrismaClient) {
    const { page = 1, limit = 20, status, sportsSchoolId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (sportsSchoolId) where.sportsSchoolId = sportsSchoolId;

    const [items, total] = await Promise.all([
      prisma.sportsSchoolEnrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.sportsSchoolEnrollment.count({ where })
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

  static async approve(id: string, prisma: PrismaClient) {
    return await prisma.sportsSchoolEnrollment.update({
      where: { id },
      data: {
        status: 'APPROVED'
      }
    });
  }

  static async reject(id: string, reason: string, prisma: PrismaClient) {
    return await prisma.sportsSchoolEnrollment.update({
      where: { id },
      data: {
        status: 'REJECTED'
      }
    });
  }
}
