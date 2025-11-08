import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class TourismRouteHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'tourism_route' || moduleEntity === 'CADASTRO_ROTEIRO_TURISTICO';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const route = await prisma.tourismRoute.create({
      data: {
        protocolId: protocol.id,
        name: requestData.name || '',
        routeType: requestData.routeType || requestData.type || 'CULTURAL',
        description: requestData.description || '',
        duration: requestData.duration || '',
        difficulty: requestData.difficulty || 'FACIL',
        distance: requestData.distance ? parseFloat(requestData.distance) : null,
        startPoint: requestData.startPoint || requestData.origin || '',
        endPoint: requestData.endPoint || requestData.destination || '',
        waypoints: requestData.waypoints ? JSON.parse(JSON.stringify(requestData.waypoints)) : null,
        attractions: requestData.attractions ? JSON.parse(JSON.stringify(requestData.attractions)) : { attractions: [] },
        services: requestData.services ? JSON.parse(JSON.stringify(requestData.services)) : null,
        bestSeason: requestData.bestSeason ? JSON.parse(JSON.stringify(requestData.bestSeason)) : null,
        recommendations: requestData.recommendations,
        warnings: requestData.warnings,
        accessibility: requestData.accessibility ? JSON.parse(JSON.stringify(requestData.accessibility)) : null,
        photos: requestData.photos ? JSON.parse(JSON.stringify(requestData.photos)) : null,
        mapData: requestData.mapData ? JSON.parse(JSON.stringify(requestData.mapData)) : null,
        estimatedCost: requestData.estimatedCost ? parseFloat(requestData.estimatedCost) : null,
        guideRequired: requestData.guideRequired === true || requestData.guideRequired === 'true',
        minimumAge: requestData.minimumAge ? parseInt(requestData.minimumAge) : null,
        maxGroupSize: requestData.maxGroupSize ? parseInt(requestData.maxGroupSize) : null,
        featured: false,
        isActive: false
      }
    });

    return {
      success: true,
      entityId: route.id,
      entityType: 'TourismRoute',
      data: route
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.tourismRoute.findUnique({
      where: { id }
    });
  }

  static async list(filters: any, prisma: PrismaClient) {
    const { page = 1, limit = 20, routeType, isActive, featured } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (routeType) where.routeType = routeType;
    if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;
    if (featured !== undefined) where.featured = featured === 'true' || featured === true;

    const [items, total] = await Promise.all([
      prisma.tourismRoute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.tourismRoute.count({ where })
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
    return await prisma.tourismRoute.update({
      where: { id },
      data: {
        isActive: true,
        featured: false
      }
    });
  }

  static async deactivate(id: string, prisma: PrismaClient) {
    return await prisma.tourismRoute.update({
      where: { id },
      data: {
        isActive: false
      }
    });
  }

  static async setFeatured(id: string, featured: boolean, prisma: PrismaClient) {
    return await prisma.tourismRoute.update({
      where: { id },
      data: {
        featured
      }
    });
  }
}
