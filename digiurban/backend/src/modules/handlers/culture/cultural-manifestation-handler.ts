import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class CulturalManifestationHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'cultural_manifestation' || moduleEntity === 'REGISTRO_MANIFESTACAO_CULTURAL';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const manifestation = await prisma.culturalManifestation.create({
      data: {
        protocolId: protocol.id,
        name: requestData.name,
        type: requestData.type,
        description: requestData.description,
        currentSituation: requestData.currentSituation || requestData.description,
        knowledgeHolders: requestData.knowledgeHolders ? JSON.parse(JSON.stringify(requestData.knowledgeHolders)) : null,
        safeguardActions: requestData.safeguardActions ? JSON.parse(JSON.stringify(requestData.safeguardActions)) : null,
        status: 'PENDING'
      }
    });

    return {
      success: true,
      entityId: manifestation.id,
      entityType: 'CulturalManifestation',
      data: manifestation
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.culturalManifestation.findUnique({
      where: { id }
    });
  }

  static async list(filters: any, prisma: PrismaClient) {
    const { page = 1, limit = 20, status, type } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      prisma.culturalManifestation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.culturalManifestation.count({ where })
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
    return await prisma.culturalManifestation.update({
      where: { id },
      data: {
        status: 'ACTIVE'
      }
    });
  }

  static async reject(id: string, reason: string, prisma: PrismaClient) {
    return await prisma.culturalManifestation.update({
      where: { id },
      data: {
        status: 'REJECTED'
      }
    });
  }
}
