/**
 * ============================================================================
 * CULTURAL EVENT HANDLER - Proposta de Eventos Culturais
 * ============================================================================
 */

import { prisma } from '../../../lib/prisma';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class CulturalEventHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'CulturalEvent' || moduleEntity === 'cultural-event';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    try {
      const event = await prisma.culturalEvent.create({
        data: {
                    title: requestData.eventTitle || 'Evento Cultural',
          description: requestData.eventDescription || protocol.description,
          type: requestData.eventType || 'show',
          category: requestData.eventCategory || 'geral',
          venue: requestData.venuePreference || requestData.location || 'Local a definir',
          spaceId: requestData.venuePreference || null,
          startDate: requestData.eventDate ? new Date(requestData.eventDate) : new Date(),
          endDate: requestData.eventDate ? new Date(requestData.eventDate) : new Date(),
          schedule: JSON.stringify({
            startTime: requestData.eventStartTime,
            duration: requestData.eventDuration
        }),
          capacity: parseInt(requestData.expectedAudience || '100'),
          targetAudience: requestData.targetAudience || 'Público em geral',
          ticketPrice: parseFloat(requestData.ticketPrice || '0'),
          freeEvent: requestData.isFreeEvent === 'Sim',
          organizer: JSON.stringify({
            name: requestData.proposerName,
            phone: requestData.proposerPhone,
            email: requestData.proposerEmail
        }),
          performers: requestData.performers ? JSON.stringify({ artists: requestData.performers }) : undefined,
          contact: JSON.stringify({
            phone: requestData.proposerPhone,
            email: requestData.proposerEmail
        }),
          status: 'PLANNED',
          protocol: protocol.number,
          serviceId: service.id,
          source: 'portal'
        }
        });

      return {
        success: true,
        entityId: event.id,
        entityType: 'CulturalEvent',
        data: event
        };
    } catch (error) {
      console.error('Erro ao criar evento cultural:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
  }

  static async getByProtocol(protocol: string) {
    return await prisma.culturalEvent.findFirst({
      where: { protocol }
        });
  }
}
