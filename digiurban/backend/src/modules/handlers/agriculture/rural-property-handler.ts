// ============================================================
// AGRICULTURE HANDLER - Cadastro de Propriedade Rural
// ✅ REFATORADO - FASE 1: Compliance com citizenId obrigatório
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';
import { CitizenLookupService } from '../../../services/citizen-lookup.service';

type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class RuralPropertyHandler extends BaseModuleHandler {
  moduleType = 'CADASTRO_PROPRIEDADE_RURAL';
  entityName = 'RuralProperty';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol, serviceId } = action;

    if (action.action === 'create') {
      return this.createProperty(data, protocol, serviceId, tx);
    }

    if (action.action === 'update') {
      return this.updateProperty(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  /**
   * Criar cadastro de propriedade rural
   * ✅ REFATORADO: citizenId obrigatório, sem duplicação de dados
   */
  private async createProperty(
    data: any,
    protocol: string,
    serviceId: string,
    tx: PrismaTransaction
  ) {
    // ========== VALIDAÇÃO 1: citizenId obrigatório ==========
    if (!data.citizenId) {
      throw new Error('citizenId é obrigatório. A propriedade deve ser vinculada a um cidadão proprietário.');
    }

    // ========== VALIDAÇÃO 2: Usar CitizenLookupService para validar cidadão ==========
    const citizenService = new CitizenLookupService();
    const citizen = await citizenService.findById(data.citizenId);

    if (!citizen) {
      throw new Error('Cidadão não encontrado com o ID fornecido');
    }

    if (!citizen.isActive) {
      throw new Error('Cidadão não está ativo no sistema');
    }

    // ========== VALIDAÇÃO 3: Verificar se cidadão tem produtor cadastrado (opcional) ==========
    let producerId = data.producerId || null;
    if (!producerId) {
      const producer = await tx.ruralProducer.findUnique({
        where: { citizenId: data.citizenId }
      });
      if (producer) {
        producerId = producer.id;
      }
    }

    // ========== VALIDAÇÃO 4: Campos obrigatórios ==========
    if (!data.propertyName && !data.nomePropriedade && !data.name) {
      throw new Error('Nome da propriedade é obrigatório');
    }

    if (!data.totalArea && !data.areaTotal && !data.size) {
      throw new Error('Área total da propriedade é obrigatória');
    }

    if (!data.location && !data.localizacao && !data.endereco) {
      throw new Error('Localização da propriedade é obrigatória');
    }

    // ✅ Criar propriedade rural SEM duplicações - apenas dados específicos
    const property = await tx.ruralProperty.create({
      data: {
        citizenId: data.citizenId, // ✅ OBRIGATÓRIO
        protocolId: protocol,
        producerId, // ✅ Opcional - vincula ao produtor se existir

        // ✅ APENAS campos específicos da propriedade
        name: data.propertyName || data.nomePropriedade || data.name,
        size: parseFloat(data.size || data.totalArea || data.areaTotal || 0),
        totalArea: parseFloat(data.totalArea || data.areaTotal || data.size || 0),
        cultivatedArea: data.cultivatedArea || data.areaCultivada ? parseFloat(data.cultivatedArea || data.areaCultivada) : null,
        plantedArea: data.plantedArea || data.areaPlantada ? parseFloat(data.plantedArea || data.areaPlantada) : null,
        location: data.location || data.localizacao || data.endereco,
        coordinates: data.coordinates || data.coordenadas || null,
        mainCrops: data.mainCrops || data.principaisCulturas || data.culturas || null,
        documentType: data.documentType || data.tipoDocumento || null,
        documentNumber: data.documentNumber || data.numeroDocumento || null,

        status: 'ACTIVE'
      },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true,
            address: true
          }
        }
      }
    });

    return {
      property,
      // ✅ Retornar dados do cidadão via relação (não duplicados)
      citizen: property.citizen
    };
  }

  /**
   * Atualizar propriedade rural
   */
  private async updateProperty(data: any, tx: PrismaTransaction) {
    const {
      propertyId,
      name,
      totalArea,
      cultivatedArea,
      plantedArea,
      location,
      coordinates,
      mainCrops,
      documentType,
      documentNumber,
      status
    } = data;

    if (!propertyId) {
      throw new Error('propertyId é obrigatório');
    }

    // ✅ Atualizar APENAS campos específicos da propriedade
    const property = await tx.ruralProperty.update({
      where: { id: propertyId },
      data: {
        ...(name && { name }),
        ...(totalArea && { totalArea: parseFloat(totalArea), size: parseFloat(totalArea) }),
        ...(cultivatedArea && { cultivatedArea: parseFloat(cultivatedArea) }),
        ...(plantedArea && { plantedArea: parseFloat(plantedArea) }),
        ...(location && { location }),
        ...(coordinates && { coordinates }),
        ...(mainCrops && { mainCrops }),
        ...(documentType && { documentType }),
        ...(documentNumber && { documentNumber }),
        ...(status && { status }),
        updatedAt: new Date()
      },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true
          }
        }
      }
    });

    return {
      property,
      citizen: property.citizen
    };
  }
}
