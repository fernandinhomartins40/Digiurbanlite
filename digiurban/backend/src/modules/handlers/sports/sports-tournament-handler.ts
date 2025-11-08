import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class SportsTournamentHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'sports_tournament' || moduleEntity === 'INSCRICAO_TORNEIO';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const event = await prisma.sportsEvent.create({
      data: {
        name: requestData.tournamentName || requestData.name,
        title: requestData.title,
        type: 'TORNEIO',
        eventType: 'COMPETICAO',
        sport: requestData.sport || requestData.modality,
        description: requestData.description,
        startDate: new Date(requestData.startDate),
        date: new Date(requestData.startDate),
        endDate: new Date(requestData.endDate || requestData.startDate),
        startTime: requestData.startTime,
        endTime: requestData.endTime,
        location: requestData.location,
        capacity: requestData.maxParticipants ? parseInt(requestData.maxParticipants) : null,
        targetAudience: requestData.targetAudience,
        responsible: requestData.responsible || requestData.organizerName || 'Sistema',
        maxParticipants: requestData.maxParticipants ? parseInt(requestData.maxParticipants) : 0,
        status: 'PLANNED',
        isPublic: true
      }
    });

    return {
      success: true,
      entityId: event.id,
      entityType: 'SportsEvent',
      data: event
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.sportsEvent.findUnique({
      where: { id }
    });
  }

  static async list(filters: any, prisma: PrismaClient) {
    const { page = 1, limit = 20, status, sport, type } = filters;
    const skip = (page - 1) * limit;

    const where: any = { type: 'TORNEIO' };
    if (status) where.status = status;
    if (sport) where.sport = sport;

    const [items, total] = await Promise.all([
      prisma.sportsEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' }
      }),
      prisma.sportsEvent.count({ where })
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
    return await prisma.sportsEvent.update({
      where: { id },
      data: {
        status: 'APPROVED'
      }
    });
  }

  static async cancel(id: string, reason: string, prisma: PrismaClient) {
    return await prisma.sportsEvent.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    });
  }
}
