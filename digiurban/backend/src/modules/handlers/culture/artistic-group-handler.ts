import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class ArtisticGroupHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'artistic_group' || moduleEntity === 'CADASTRO_GRUPO_ARTISTICO';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const group = await prisma.artisticGroup.create({
      data: {
        protocolId: protocol.id,
        name: requestData.groupName || requestData.name,
        category: requestData.category || requestData.groupType || 'MUSICAL',
        foundationDate: requestData.foundationDate ? new Date(requestData.foundationDate) : null,
        responsible: requestData.responsibleName || requestData.citizenName,
        contact: requestData.phone || requestData.contact,
        members: requestData.members ? JSON.parse(JSON.stringify(requestData.members)) : null,
        status: 'PENDING'
      }
    });

    return {
      success: true,
      entityId: group.id,
      entityType: 'ArtisticGroup',
      data: group
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.artisticGroup.findUnique({
      where: { id }
    });
  }

  static async list(filters: any, prisma: PrismaClient) {
    const { page = 1, limit = 20, status, category } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const [items, total] = await Promise.all([
      prisma.artisticGroup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.artisticGroup.count({ where })
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
    return await prisma.artisticGroup.update({
      where: { id },
      data: {
        status: 'ACTIVE'
      }
    });
  }
}
