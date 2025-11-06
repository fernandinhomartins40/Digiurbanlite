/**
 * ============================================================================
 * TOURIST ATTRACTION HANDLER - Cadastro de Pontos Turísticos
 * ============================================================================
 */

import { prisma } from '../../../lib/prisma';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class TouristAttractionHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'TouristAttraction' || moduleEntity === 'tourist-attraction';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    try {
      const attraction = await prisma.touristAttraction.create({
        data: {
                    name: requestData.attractionName || 'Ponto Turístico',
          description: requestData.description || protocol.description,
          type: requestData.type || 'cultural',
          category: requestData.category || 'ponto_turistico',
          address: requestData.address || '',
          neighborhood: requestData.neighborhood,
          city: requestData.city || '',
          state: requestData.state || '',
          coordinates: requestData.coordinates || null,
          facilities: requestData.facilities ? JSON.stringify(requestData.facilities) : undefined,
          openingHours: requestData.openingHours ? JSON.stringify(requestData.openingHours) : undefined,
          ticketPrice: parseFloat(requestData.entryFee || '0'),
          freeEntry: requestData.isFree === 'Sim',
          featured: false,
          isActive: true,
          protocol: protocol.number,
          serviceId: service.id
        }
        });

      return {
        success: true,
        entityId: attraction.id,
        entityType: 'TouristAttraction',
        data: attraction
        };
    } catch (error) {
      console.error('Erro ao cadastrar ponto turístico:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
  }

  static async getByProtocol(protocol: string) {
    return await prisma.touristAttraction.findFirst({
      where: { protocol }
        });
  }
}
