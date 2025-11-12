import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class SecurityAlertHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'security_alert' || moduleEntity === 'ALERTA_SEGURANCA';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const alert = await prisma.securityAlert.create({
      data: {
        protocolId: protocol.id,
        title: requestData.title || requestData.subject || 'Alerta de Segurança',
        alertType: requestData.alertType || requestData.type || 'GERAL',
        message: requestData.message || requestData.description || '',
        description: requestData.description,
        location: requestData.location,
        targetArea: requestData.targetArea || requestData.location,
        coordinates: requestData.coordinates ? JSON.parse(JSON.stringify(requestData.coordinates)) : null,
        severity: requestData.severity || 'HIGH',
        priority: requestData.priority || 'HIGH',
        targetAudience: requestData.targetAudience || 'GERAL',
        affectedAreas: requestData.affectedAreas ? JSON.parse(JSON.stringify(requestData.affectedAreas)) : null,
        startDate: requestData.startDate ? new Date(requestData.startDate) : new Date(),
        endDate: requestData.endDate ? new Date(requestData.endDate) : null,
        expiresAt: requestData.expiresAt ? new Date(requestData.expiresAt) : null,
        channels: requestData.channels || [],
        createdBy: requestData.createdBy || 'system',
        isActive: true,
        status: 'ACTIVE'
      }
    });

    return {
      success: true,
      entityId: alert.id,
      entityType: 'SecurityAlert',
      data: alert
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.securityAlert.findUnique({
      where: { id }
    });
  }

  static async list(filters: any, prisma: PrismaClient) {
    const { page = 1, limit = 20, status, alertType, severity, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (alertType) where.alertType = alertType;
    if (severity) where.severity = severity;
    if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;

    const [items, total] = await Promise.all([
      prisma.securityAlert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.securityAlert.count({ where })
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
    return await prisma.securityAlert.update({
      where: { id },
      data: {
        isActive: false,
        status: 'INACTIVE'
      }
    });
  }

  static async extend(id: string, expiresAt: Date, prisma: PrismaClient) {
    return await prisma.securityAlert.update({
      where: { id },
      data: {
        expiresAt,
        endDate: expiresAt
      }
    });
  }
}
