// ============================================================
// AGRICULTURE HANDLER - Cadastro de Produtor Rural
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

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
      throw new Error('O produtor rural deve ser vinculado a um cidadão existente');
    }

    // ========== VALIDAÇÃO 2: Verificar se o cidadão existe ==========
    const citizen = await tx.citizen.findFirst({
      where: {
        id: data.citizenId
        }
        });

    if (!citizen) {
      throw new Error('Cidadão não encontrado ou não pertence a este município');
    }

    // ========== VALIDAÇÃO 3: Verificar se o cidadão já é um produtor rural ==========
    const existingProducer = await tx.ruralProducer.findFirst({
      where: {
                citizenId: data.citizenId
        }
        });

    if (existingProducer) {
      throw new Error('Este cidadão já está cadastrado como produtor rural');
    }

    // ========== VALIDAÇÃO 4: Campos obrigatórios adicionais ==========
    if (!data.productionType && !data.tipoProducao) {
      throw new Error('Tipo de produção é obrigatório (ex: orgânica, convencional, agroecológica)');
    }

    if (!data.mainCrop && !data.principaisCulturas) {
      throw new Error('Cultura principal é obrigatória (ex: café, milho, hortaliças)');
    }

    // Criar produtor rural com status PENDING_APPROVAL
    const producer = await tx.ruralProducer.create({
      data: {
                citizenId: data.citizenId,
        protocolId: protocol,
        name: data.name || data.nomeProdutor || citizen.name,
        document: data.document || data.cpf || citizen.cpf,
        email: data.email || citizen.email,
        phone: data.phone || data.telefone || citizen.phone || '',
        address: data.address || data.endereco || JSON.stringify(citizen.address),
        productionType: data.productionType || data.tipoProducao || 'conventional',
        mainCrop: data.mainCrop || data.principaisCulturas || '',
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
            phone: true
        }
      }
        }
        });

    return { producer };
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
   */
  private async updateProducer(data: any, tx: PrismaTransaction) {
    const {
      producerId,
      productionType,
      mainCrop,
      address,
      phone,
      email,
      status
        } = data;

    const producer = await tx.ruralProducer.update({
      where: { id: producerId },
      data: {
        ...(productionType && { productionType }),
        ...(mainCrop && { mainCrop }),
        ...(address && { address }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...(status && { status, isActive: status === 'ACTIVE' }),
        updatedAt: new Date()
        },
      include: {
        citizen: true
        }
      });

    return { producer };
  }
}
