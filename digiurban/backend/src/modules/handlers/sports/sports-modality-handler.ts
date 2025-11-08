import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class SportsModalityHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'sports_modality' || moduleEntity === 'CADASTRO_MODALIDADE';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const modality = await prisma.sportsModality.create({
      data: {
        protocolId: protocol.id,
        name: requestData.name,
        description: requestData.description,
        category: requestData.category || 'INDIVIDUAL',
        equipment: requestData.equipment ? JSON.parse(JSON.stringify(requestData.equipment)) : null,
        rules: requestData.rules,
        isActive: true
      }
    });

    return {
      success: true,
      entityId: modality.id,
      entityType: 'SportsModality',
      data: modality
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.sportsModality.findUnique({
      where: { id }
    });
  }

  static async list(filters: any, prisma: PrismaClient) {
    const { page = 1, limit = 20, category, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;

    const [items, total] = await Promise.all([
      prisma.sportsModality.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.sportsModality.count({ where })
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

  static async deactivate(id: string, prisma: PrismaClient) {
    return await prisma.sportsModality.update({
      where: { id },
      data: {
        isActive: false
      }
    });
  }
}
