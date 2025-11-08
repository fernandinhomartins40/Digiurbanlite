import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class SportsReservationHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'sports_reservation' || moduleEntity === 'RESERVA_ESPACO_ESPORTIVO';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const reservation = await prisma.sportsInfrastructureReservation.create({
      data: {
        protocolId: protocol.id,
        infrastructureId: requestData.infrastructureId,
        infrastructureName: requestData.infrastructureName || requestData.spaceName,
        requesterName: requestData.requesterName || requestData.citizenName,
        requesterCpf: requestData.requesterCpf || requestData.citizenCpf,
        requesterPhone: requestData.requesterPhone || requestData.phone,
        requesterEmail: requestData.requesterEmail || requestData.email,
        organization: requestData.organization,
        sport: requestData.sport,
        purpose: requestData.purpose || 'TREINAMENTO',
        date: new Date(requestData.date),
        startTime: requestData.startTime,
        endTime: requestData.endTime,
        expectedPeople: requestData.expectedPeople ? parseInt(requestData.expectedPeople) : null,
        equipment: requestData.equipment,
        status: 'PENDING'
      }
    });

    return {
      success: true,
      entityId: reservation.id,
      entityType: 'SportsInfrastructureReservation',
      data: reservation
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.sportsInfrastructureReservation.findUnique({
      where: { id }
    });
  }

  static async list(filters: any, prisma: PrismaClient) {
    const { page = 1, limit = 20, status, infrastructureId, date } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (infrastructureId) where.infrastructureId = infrastructureId;
    if (date) where.date = new Date(date);

    const [items, total] = await Promise.all([
      prisma.sportsInfrastructureReservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'asc' }
      }),
      prisma.sportsInfrastructureReservation.count({ where })
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
    return await prisma.sportsInfrastructureReservation.update({
      where: { id },
      data: {
        status: 'APPROVED'
      }
    });
  }

  static async cancel(id: string, reason: string, prisma: PrismaClient) {
    return await prisma.sportsInfrastructureReservation.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    });
  }
}
