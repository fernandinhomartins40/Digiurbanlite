import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class EnvironmentalProgramHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'environmental_program' || moduleEntity === 'PROGRAMA_AMBIENTAL';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const program = await prisma.environmentalProgram.create({
      data: {
        protocolId: protocol.id,
        name: requestData.name,
        programType: requestData.programType || requestData.type || 'EDUCACAO',
        description: requestData.description,
        objectives: requestData.objectives ? JSON.parse(JSON.stringify(requestData.objectives)) : {},
        targetAudience: requestData.targetAudience || 'GERAL',
        startDate: new Date(requestData.startDate),
        endDate: requestData.endDate ? new Date(requestData.endDate) : null,
        budget: requestData.budget ? parseFloat(requestData.budget) : null,
        coordinator: requestData.coordinator || requestData.coordinatorName || requestData.citizenName,
        activities: requestData.activities ? JSON.parse(JSON.stringify(requestData.activities)) : {},
        status: 'PENDING',
        isActive: false
      }
    });

    return {
      success: true,
      entityId: program.id,
      entityType: 'EnvironmentalProgram',
      data: program
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.environmentalProgram.findUnique({
      where: { id }
    });
  }

  static async list(filters: any, prisma: PrismaClient) {
    const { page = 1, limit = 20, status, programType, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (programType) where.programType = programType;
    if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;

    const [items, total] = await Promise.all([
      prisma.environmentalProgram.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.environmentalProgram.count({ where })
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
    return await prisma.environmentalProgram.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        isActive: true
      }
    });
  }

  static async cancel(id: string, reason: string, prisma: PrismaClient) {
    return await prisma.environmentalProgram.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        isActive: false
      }
    });
  }
}
