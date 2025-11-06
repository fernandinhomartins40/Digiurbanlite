/**
 * ============================================================================
 * CULTURAL SPACE HANDLER - Reserva de Espaços Culturais
 * ============================================================================
 */

import { prisma } from '../../../lib/prisma';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class CulturalSpaceHandler {
  /**
   * Verifica se este handler pode processar a solicitação
   */
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'CulturalSpace' || moduleEntity === 'cultural-space';
  }

  /**
   * Executa a reserva de espaço cultural
   */
  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    try {
      // Criar registro de reserva vinculado ao espaço cultural
      const spaceReservation = await prisma.culturalSpace.create({
        data: {
                    code: `SPACE-${Date.now()}`,
          name: requestData.eventName || 'Reserva de Espaço',
          description: requestData.eventDescription || protocol.description,
          type: requestData.eventType || 'evento',
          address: requestData.location || 'A definir',
          neighborhood: requestData.neighborhood || 'Centro',
          zipCode: requestData.zipCode || '00000-000',
          capacity: parseInt(requestData.expectedAudience || '50'),
          manager: requestData.organizerName || 'Organizador',
          contact: JSON.stringify({
            phone: requestData.organizerPhone,
            email: requestData.organizerEmail
        }),
          operatingHours: JSON.stringify({
            monday: '08:00-18:00',
            tuesday: '08:00-18:00',
            wednesday: '08:00-18:00',
            thursday: '08:00-18:00',
            friday: '08:00-18:00'
        }),
          protocol: protocol.number,
          serviceId: service.id,
          source: 'portal',
          available: false, // Reservado
        }
        });

      return {
        success: true,
        entityId: spaceReservation.id,
        entityType: 'CulturalSpace',
        data: spaceReservation
        };
    } catch (error) {
      console.error('Erro ao criar reserva de espaço cultural:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
  }

  /**
   * Lista espaços culturais disponíveis
   */
  static async listAvailableSpaces(tenantId: string, filters?: any) {
    const where: any = { tenantId, available: true };

    if (filters?.type) where.type = filters.type;
    if (filters?.minCapacity) where.capacity = { gte: parseInt(filters.minCapacity) };

    return await prisma.culturalSpace.findMany({
      where,
      orderBy: { name: 'asc' }
        });
  }

  /**
   * Busca por protocolo
   */
  static async getByProtocol(protocol: string) {
    return await prisma.culturalSpace.findFirst({
      where: { protocol }
        });
  }
}
