/**
 * ============================================================================
 * PROTOCOL-MODULE SERVICE - Integração Protocolos ↔ Módulos
 * ============================================================================
 *
 * Conecta protocolos simplificados aos módulos padrões das secretarias.
 * Implementa o fluxo: Protocolo COM_DADOS → Módulo da Secretaria → Aprovação
 */

import { ProtocolStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getModuleEntity, isInformativeModule } from '../config/module-mapping';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateProtocolWithModuleInput {
  citizenId: string;
  serviceId: string;
  formData: Record<string, any>;
  description?: string;
  createdById?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  attachments?: string[];
}

export interface ApproveProtocolInput {
  protocolId: string;
  userId: string;
  comment?: string;
  additionalData?: Record<string, any>;
}

export interface RejectProtocolInput {
  protocolId: string;
  userId: string;
  reason: string;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class ProtocolModuleService {
  /**
   * Criar protocolo e vincular ao módulo apropriado
   * Fluxo: ServiceSimplified → ProtocolSimplified → Módulo Padrão
   */
  async createProtocolWithModule(input: CreateProtocolWithModuleInput) {
    const { citizenId, serviceId, formData, description, createdById, ...rest } = input;

    // 1. Buscar serviço
    const service = await prisma.serviceSimplified.findUnique({
      where: { id: serviceId },
      include: { department: true }
      });

    if (!service) {
      throw new Error('Serviço não encontrado');
    }

    if (!service.isActive) {
      throw new Error('Serviço inativo');
    }

    // 2. Verificar se serviço tem módulo
    const hasModule = service.moduleType && !isInformativeModule(service.moduleType);

    // 3. Gerar número do protocolo
    const year = new Date().getFullYear();
    const count = await prisma.protocolSimplified.count({});
    const protocolNumber = `${year}-${String(count + 1).padStart(6, '0')}`;

    // 4. Criar protocolo em transação
    const result = await prisma.$transaction(async (tx) => {
      // Converter attachments de array para string JSON se necessário
      const attachmentsData = rest.attachments
        ? (Array.isArray(rest.attachments) ? JSON.stringify(rest.attachments) : rest.attachments)
        : undefined;

      // Criar protocolo
      const protocol = await tx.protocolSimplified.create({
        data: {
          number: protocolNumber,
          title: service.name,
          description: description || service.description || '',
          citizenId,
          serviceId,
          departmentId: service.departmentId,
          status: ProtocolStatus.VINCULADO,
          moduleType: service.moduleType || null,
          customData: formData as Prisma.JsonObject,
          createdById,
          latitude: rest.latitude,
          longitude: rest.longitude,
          address: rest.address,
          attachments: attachmentsData
        }
        });

      // Se tem módulo, criar entrada pendente
      let moduleEntity = null;
      if (hasModule && service.moduleType) {
        const entityName = getModuleEntity(service.moduleType);

        if (entityName) {
          moduleEntity = await this.createModuleEntity(
            tx,
            entityName,
            {
              protocolId: protocol.id,
              protocolNumber: protocol.number,
              formData,
              status: 'PENDING_APPROVAL'
        }
          );
        }
      }

      // Criar histórico
      await tx.protocolHistorySimplified.create({
        data: {
          protocolId: protocol.id,
          action: 'CREATED',
          comment: 'Protocolo criado',
          newStatus: ProtocolStatus.VINCULADO,
          userId: createdById
        }
        });

      return {
        protocol,
        moduleEntity,
        hasModule
        };
    });

    // ============================================================================
    // FASE 3: APLICAR WORKFLOW E SLA (FORA DA TRANSAÇÃO)
    // ============================================================================

    // Aplicar workflow se houver moduleType
    if (result.protocol.moduleType) {
      try {
        await this.applyWorkflowToProtocol(result.protocol.id, result.protocol.moduleType);
      } catch (error) {
        console.error('Erro ao aplicar workflow:', error);
        // Não falhar a criação do protocolo se workflow falhar
      }
    }

    return result;
  }

  /**
   * FASE 3: Aplicar workflow ao protocolo
   */
  private async applyWorkflowToProtocol(protocolId: string, moduleType: string) {
    try {
      // Importar serviços de workflow
      const workflowService = await import('./module-workflow.service');
      const slaService = await import('./protocol-sla.service');

      // 1. Buscar workflow do módulo
      const workflow = await workflowService.getWorkflowByModuleType(moduleType);

      if (!workflow) {
        // Se não tem workflow específico, tentar genérico
        const genericWorkflow = await workflowService.getWorkflowByModuleType('GENERICO');
        if (genericWorkflow) {
          await workflowService.applyWorkflowToProtocol(protocolId, 'GENERICO');

          // Criar SLA baseado no workflow genérico
          if (genericWorkflow.defaultSLA) {
            await slaService.createSLA({
              protocolId,
              workingDays: genericWorkflow.defaultSLA
        });
          }
        }
        return;
      }

      // 2. Aplicar workflow (criar etapas)
      await workflowService.applyWorkflowToProtocol(protocolId, moduleType);

      // 3. Criar SLA se definido
      if (workflow.defaultSLA) {
        await slaService.createSLA({
          protocolId,
          workingDays: workflow.defaultSLA
        });
      }

      console.log(`✅ Workflow '${workflow.name}' aplicado ao protocolo ${protocolId}`);
    } catch (error) {
      console.error('Erro ao aplicar workflow:', error);
      throw error;
    }
  }

  /**
   * Criar entidade no módulo apropriado
   */
  private async createModuleEntity(
    tx: Prisma.TransactionClient,
    entityName: string,
    data: {
      protocolId: string;
      protocolNumber: string;
      formData: Record<string, any>;
      status: string;
    }
  ) {
    const { protocolId, protocolNumber, formData } = data;

    // Import handlers helpers
    const { entityHandlers } = await import('./entity-handlers');

    // Se existe handler específico, usar
    if (entityHandlers[entityName]) {
      return entityHandlers[entityName]({
        protocolId,
        protocolNumber,
        formData,
        tx
        });
    }

    // Se chegou aqui, o handler não está em entity-handlers.ts
    throw new Error(
      `Handler não encontrado para entidade: ${entityName}. ` +
      `Verifique se o handler está implementado em entity-handlers.ts`
    );
  }

  /**
   * Aprovar protocolo e ativar entidade do módulo
   */
  async approveProtocol(input: ApproveProtocolInput) {
    const { protocolId, userId, comment, additionalData } = input;

    return prisma.$transaction(async (tx) => {
      const protocol = await tx.protocolSimplified.findUnique({
        where: { id: protocolId }
        });

      if (!protocol) {
        throw new Error('Protocolo não encontrado');
      }

      // Atualizar status para CONCLUIDO (aprovação)
      await tx.protocolSimplified.update({
        where: { id: protocolId },
        data: {
          status: ProtocolStatus.CONCLUIDO,
          concludedAt: new Date()
        }
        });

      // Ativar entidade do módulo
      if (protocol.moduleType) {
        const entityName = getModuleEntity(protocol.moduleType);
        if (entityName) {
          await this.activateModuleEntity(tx, entityName, protocolId);
        }
      }

      // Criar histórico
      await tx.protocolHistorySimplified.create({
        data: {
          protocolId,
          action: 'APPROVED',
          comment: comment || 'Protocolo aprovado e concluído',
          newStatus: ProtocolStatus.CONCLUIDO,
          userId
        }
        });

      return protocol;
    });
  }

  /**
   * Rejeitar protocolo
   */
  async rejectProtocol(input: RejectProtocolInput) {
    const { protocolId, userId, reason } = input;

    return prisma.$transaction(async (tx) => {
      const protocol = await tx.protocolSimplified.findUnique({
        where: { id: protocolId }
        });

      if (!protocol) {
        throw new Error('Protocolo não encontrado');
      }

      // Usar CANCELADO para rejeição
      await tx.protocolSimplified.update({
        where: { id: protocolId },
        data: {
          status: ProtocolStatus.CANCELADO
        }
        });

      // Criar histórico de rejeição
      await tx.protocolHistorySimplified.create({
        data: {
          protocolId,
          action: 'REJECTED',
          comment: reason,
          newStatus: ProtocolStatus.CANCELADO,
          userId
        }
        });

      return protocol;
    });
  }

  /**
   * Ativar entidade do módulo após aprovação
   *
   * Ativa a entidade vinculada ao protocolo, alterando status e isActive.
   * Cada modelo pode ter campos diferentes para ativação.
   */
  private async activateModuleEntity(
    tx: Prisma.TransactionClient,
    entityName: string,
    protocolId: string
  ) {
    // Mapeamento de modelos para suas estruturas de ativação
    const activationStrategies: Record<string, () => Promise<any>> = {
      // Modelos com status e isActive
      RuralProducer: () => tx.ruralProducer.updateMany({
        where: { protocolId },
        data: { status: 'ACTIVE', isActive: true }
        }),
      Patient: () => tx.patient.updateMany({
        where: { protocolId },
        data: { status: 'ACTIVE' }
        }),
      Student: () => tx.student.updateMany({
        where: { protocolId },
        data: { isActive: true }
        }),

      // Modelos apenas com isActive
      SchoolTransport: () => tx.schoolTransport.updateMany({
        where: { protocolId },
        data: { isActive: true }
        }),

      // Modelos apenas com status
      HealthAttendance: () => tx.healthAttendance.updateMany({
        where: { protocolId },
        data: { status: 'COMPLETED' }
        }),
      HealthAppointment: () => tx.healthAppointment.updateMany({
        where: { protocolId },
        data: { status: 'CONFIRMED' }
        }),

      // Adicione mais conforme necessário...
    };

    const strategy = activationStrategies[entityName];
    if (strategy) {
      await strategy();
    } else {
      // Log para debug - não bloqueia se não tiver estratégia específica
      console.log(`Nenhuma estratégia de ativação definida para: ${entityName}`);
    }
  }

  /**
   * Buscar protocolos pendentes por tipo de módulo
   */
  async getPendingProtocolsByModule(
    moduleType: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const [protocols, total] = await Promise.all([
      prisma.protocolSimplified.findMany({
        where: {
          moduleType,
          status: ProtocolStatus.VINCULADO
        },
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              cpf: true,
              email: true
        }
      },
          service: {
            select: {
              id: true,
              name: true
        }
      },
          department: {
            select: {
              id: true,
              name: true
        }
      }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
        }),
      prisma.protocolSimplified.count({
        where: {
          moduleType,
          status: ProtocolStatus.VINCULADO
        }
        }),
    ]);

    return {
      protocols,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
        }
        };
  }
}

export const protocolModuleService = new ProtocolModuleService();
