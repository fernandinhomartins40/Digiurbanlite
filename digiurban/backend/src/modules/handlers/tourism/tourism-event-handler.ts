import { PrismaClient } from '@prisma/client';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class TourismEventHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'tourism_event' || moduleEntity === 'CADASTRO_EVENTO_TURISTICO';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData, prisma } = context;

    const event = await prisma.tourismEvent.create({
      data: {
        protocolId: protocol.id,
        name: requestData.name || '',
        eventType: requestData.eventType || requestData.type || 'CULTURAL',
        category: requestData.category,
        description: requestData.description || '',
        venue: requestData.venue || requestData.location || '',
        address: requestData.address || requestData.location || '',
        coordinates: requestData.coordinates ? JSON.parse(JSON.stringify(requestData.coordinates)) : null,
        startDate: requestData.startDate ? new Date(requestData.startDate) : new Date(),
        endDate: requestData.endDate ? new Date(requestData.endDate) : new Date(),
        startTime: requestData.startTime,
        endTime: requestData.endTime,
        duration: requestData.duration,
        organizer: requestData.organizer || requestData.organizerName || requestData.citizenName || '',
        organizerContact: requestData.organizerContact ? JSON.parse(JSON.stringify(requestData.organizerContact)) : {
          name: requestData.organizerName || requestData.citizenName,
          phone: requestData.phone,
          email: requestData.email
        },
        capacity: requestData.capacity ? parseInt(requestData.capacity) : null,
        registeredCount: 0,
        ticketPrice: requestData.ticketPrice ? parseFloat(requestData.ticketPrice) : null,
        freeEntry: requestData.freeEntry === true || requestData.freeEntry === 'true',
        ageRestriction: requestData.ageRestriction,
        accessibility: requestData.accessibility ? JSON.parse(JSON.stringify(requestData.accessibility)) : null,
        amenities: requestData.amenities ? JSON.parse(JSON.stringify(requestData.amenities)) : null,
        program: requestData.program ? JSON.parse(JSON.stringify(requestData.program)) : null,
        speakers: requestData.speakers ? JSON.parse(JSON.stringify(requestData.speakers)) : null
      }
    });

    return {
      success: true,
      entityId: event.id,
      entityType: 'TourismEvent',
      data: event
    };
  }

  static async getById(id: string, prisma: PrismaClient) {
    return await prisma.tourismEvent.findUnique({
      where: { id }
    });
  }

  static async list(filters: any, prisma: PrismaClient) {
    const { page = 1, limit = 20, eventType, category } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (eventType) where.eventType = eventType;
    if (category) where.category = category;

    const [items, total] = await Promise.all([
      prisma.tourismEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' }
      }),
      prisma.tourismEvent.count({ where })
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

  static async register(id: string, prisma: PrismaClient) {
    const event = await prisma.tourismEvent.findUnique({ where: { id } });
    if (!event) throw new Error('Event not found');

    return await prisma.tourismEvent.update({
      where: { id },
      data: {
        registeredCount: event.registeredCount + 1
      }
    });
  }

  static async updateStatus(id: string, eventType: string, prisma: PrismaClient) {
    return await prisma.tourismEvent.update({
      where: { id },
      data: {
        eventType
      }
    });
  }
}
