import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class HousingUnitHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'housing_unit' || moduleEntity === 'CADASTRO_UNIDADE_HABITACIONAL';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const unit = await prisma.housingUnit.create({
      data: {
        protocolId: protocol.id,
        unitCode: requestData.unitCode || `UNIT-${Date.now()}`,
        unitType: requestData.unitType || requestData.type || 'CASA',
        address: requestData.address,
        coordinates: requestData.coordinates ? JSON.parse(JSON.stringify(requestData.coordinates)) : null,
        neighborhood: requestData.neighborhood,
        area: parseFloat(requestData.area),
        bedrooms: parseInt(requestData.bedrooms),
        bathrooms: parseInt(requestData.bathrooms),
        constructionYear: requestData.constructionYear ? parseInt(requestData.constructionYear) : null,
        propertyValue: requestData.propertyValue ? parseFloat(requestData.propertyValue) : null,
        monthlyRent: requestData.monthlyRent ? parseFloat(requestData.monthlyRent) : null,
        isOccupied: false,
        status: 'AVAILABLE'
      }
    });

    return {
      success: true,
      entityId: unit.id,
      entityType: 'HousingUnit',
      data: unit
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.housingUnit.findUnique({
      where: { id }
    });
  }

  static async list(filters: any, prisma: PrismaClient) {
    const { page = 1, limit = 20, status, unitType, neighborhood, isOccupied } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (unitType) where.unitType = unitType;
    if (neighborhood) where.neighborhood = neighborhood;
    if (isOccupied !== undefined) where.isOccupied = isOccupied === 'true' || isOccupied === true;

    const [items, total] = await Promise.all([
      prisma.housingUnit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.housingUnit.count({ where })
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

  static async allocate(id: string, occupantName: string, prisma: PrismaClient) {
    return await prisma.housingUnit.update({
      where: { id },
      data: {
        occupantName,
        isOccupied: true,
        occupancyDate: new Date(),
        status: 'OCCUPIED'
      }
    });
  }
}
