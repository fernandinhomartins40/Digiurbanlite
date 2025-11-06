/**
 * ============================================================================
 * LOCAL BUSINESS HANDLER - Cadastro de Estabelecimentos Turísticos
 * ============================================================================
 */

import { prisma } from '../../../lib/prisma';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class LocalBusinessHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'LocalBusiness' || moduleEntity === 'local-business';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    try {
      const business = await prisma.localBusiness.create({
        data: {
                    name: requestData.businessName || 'Estabelecimento',
          businessType: requestData.businessType || 'comercio',
          category: requestData.category || 'geral',
          description: requestData.description || '',
          businessInfo: {
            name: requestData.businessName,
            tradeName: requestData.tradeName,
            cnpj: requestData.cnpj,
            type: requestData.businessType,
            category: requestData.category
        },
          owner: requestData.ownerName || '',
          address: requestData.address || '',
          neighborhood: requestData.neighborhood,
          city: requestData.city || '',
          state: requestData.state || '',
          coordinates: requestData.coordinates || null,
          services: requestData.services ? JSON.stringify({ services: requestData.services }) : undefined,
          openingHours: requestData.operatingHours ? JSON.stringify(requestData.operatingHours) : JSON.stringify({ monday: '09:00-18:00' }),
          contact: JSON.stringify({
            phone: requestData.phone,
            email: requestData.email,
            website: requestData.website
        }),
          isTourismPartner: false,
          isPartner: false,
          isActive: true,
          protocol: protocol.number
        }
        });

      return {
        success: true,
        entityId: business.id,
        entityType: 'LocalBusiness',
        data: business
        };
    } catch (error) {
      console.error('Erro ao cadastrar estabelecimento turístico:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
  }

  static async getByProtocol(protocol: string) {
    return await prisma.localBusiness.findFirst({
      where: { protocol }
        });
  }
}
