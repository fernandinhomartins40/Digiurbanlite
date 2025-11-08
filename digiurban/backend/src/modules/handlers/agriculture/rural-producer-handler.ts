// ============================================================
// AGRICULTURE HANDLER - Cadastro de Produtor Rural
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

export class RuralProducerHandler extends BaseModuleHandler {
  moduleType = 'CADASTRO_PRODUTOR';
  entityName = 'RuralProducer';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol, serviceId } = action;

    if (action.action === 'create') {
      return this.createProducer(data, protocol, serviceId, tx);
    }

    if (action.action === 'approve') {
      return this.approveProducer(data, tx);
    }

    if (action.action === 'update') {
      return this.updateProducer(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  /**
   * Criar cadastro de produtor rural via protocolo
   * ✅ REFATORADO: Sem duplicação de dados, apenas citizenId
   * Fluxo: Protocolo → Produtor (PENDING_APPROVAL) → Aprovação → ACTIVE
   */
  private async createProducer(
    data: any,
    protocol: string,
    serviceId: string,
    tx: PrismaTransaction
  ) {
    // ========== VALIDAÇÃO 1: citizenId obrigatório ==========
    if (!data.citizenId) {
      throw new Error('citizenId é obrigatório. O produtor rural deve ser vinculado a um cidadão existente.');
    }

    // ========== VALIDAÇÃO 2: Usar CitizenLookupService para validar e buscar cidadão ==========
    const citizenService = new CitizenLookupService();
    const citizen = await citizenService.findById(data.citizenId);

    if (!citizen) {
      throw new Error('Cidadão não encontrado com o ID fornecido');
    }

    if (!citizen.isActive) {
      throw new Error('Cidadão não está ativo no sistema');
    }

    // ========== VALIDAÇÃO 3: Verificar se o cidadão já é um produtor rural ==========
    const existingProducer = await tx.ruralProducer.findUnique({
      where: {
        citizenId: data.citizenId
      }
    });

    if (existingProducer) {
      throw new Error('Este cidadão já está cadastrado como produtor rural');
    }

    // ========== VALIDAÇÃO 4: Campos obrigatórios específicos do produtor ==========
    if (!data.productionType && !data.tipoProducao) {
      throw new Error('Tipo de produção é obrigatório (ex: AGRICULTOR_FAMILIAR, PRODUTOR_RURAL, ASSENTADO)');
    }

    if (!data.mainCrop && !data.principaisCulturas) {
      throw new Error('Cultura principal é obrigatória (ex: café, milho, hortaliças)');
    }

    // ✅ Criar produtor rural SEM duplicações - apenas dados específicos
    const producer = await tx.ruralProducer.create({
      data: {
        citizenId: data.citizenId, // ✅ OBRIGATÓRIO
        protocolId: protocol,

        // ✅ APENAS campos específicos do produtor
        productionType: data.productionType || data.tipoProducao,
        mainCrop: data.mainCrop || data.principaisCulturas,
        dap: data.dap || null, // DAP - Declaração de Aptidão ao PRONAF
        totalAreaHectares: data.totalAreaHectares || data.areaTotal || null,
        mainProductions: data.mainProductions || data.principaisProducoes || null,

        status: 'PENDING_APPROVAL',
        isActive: false, // Só ativa após aprovação
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
      producer,
      // ✅ Retornar dados do cidadão via relação (não duplicados)
      citizen: producer.citizen
    };
  }

  /**
   * Aprovar cadastro de produtor rural
   * Atualiza status para ACTIVE
   */
  private async approveProducer(data: any, tx: PrismaTransaction) {
    const { producerId, approvedBy, comment } = data;

    const producer = await tx.ruralProducer.update({
      where: { id: producerId },
      data: {
        status: 'ACTIVE',
        isActive: true,
        updatedAt: new Date()
        },
      include: {
        citizen: true
        }
      });

    // Registrar aprovação no histórico do protocolo
    if (producer.protocolId) {
      await tx.protocolHistorySimplified.create({
        data: {
          protocolId: producer.protocolId,
          action: 'APPROVED',
          comment: comment || 'Cadastro de produtor rural aprovado',
          newStatus: 'CONCLUIDO',
          userId: approvedBy
        }
        });

      // Atualizar status do protocolo
      await tx.protocolSimplified.update({
        where: { id: producer.protocolId },
        data: {
          status: 'CONCLUIDO'
        }
        });
    }

    return { producer };
  }

  /**
   * Atualizar dados do produtor rural
   * ✅ REFATORADO: Não permite atualizar dados do cidadão (name, cpf, email, phone, address)
   */
  private async updateProducer(data: any, tx: PrismaTransaction) {
    const {
      producerId,
      productionType,
      mainCrop,
      dap,
      totalAreaHectares,
      mainProductions,
      status
    } = data;

    // ✅ Atualizar APENAS campos específicos do produtor
    const producer = await tx.ruralProducer.update({
      where: { id: producerId },
      data: {
        ...(productionType && { productionType }),
        ...(mainCrop && { mainCrop }),
        ...(dap && { dap }),
        ...(totalAreaHectares && { totalAreaHectares }),
        ...(mainProductions && { mainProductions }),
        ...(status && {
          status,
          isActive: status === 'ACTIVE',
          ...(status === 'ACTIVE' && { approvedAt: new Date() })
        }),
        updatedAt: new Date()
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
      producer,
      // ✅ Dados do cidadão vêm da relação, não são duplicados
      citizen: producer.citizen
    };
  }
}
