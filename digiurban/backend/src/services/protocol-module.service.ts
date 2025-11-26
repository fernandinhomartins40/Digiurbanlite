/**
 * ============================================================================
 * PROTOCOL-MODULE SERVICE - Integração Protocolos ↔ Módulos
 * ============================================================================
 *
 * Conecta protocolos simplificados aos módulos usando entidades virtuais em customData.
 * Implementa o fluxo: Protocolo COM_DADOS → customData (entidade virtual) → Aprovação
 */

import { ProtocolStatus, Prisma, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { generateProtocolNumberSafe } from './protocol-number.service';
import { protocolStatusEngine } from './protocol-status.engine';
import { familyStatsService } from './family-stats.service';

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
   * Criar protocolo COM_DADOS com entidade virtual em customData
   * ou SEM_DADOS apenas com protocolo de acompanhamento
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

    // 2. Verificar tipo de serviço
    const isComDados = service.serviceType === 'COM_DADOS';

    // 2.1 Pré-preencher dados de composição familiar (Sprint 3.2)
    let enrichedFormData = { ...formData };
    try {
      const familyPrefillData = await familyStatsService.getFormPrefillData(citizenId);

      // Mesclar dados de composição familiar com formData existente
      // Dados do formulário têm prioridade sobre dados calculados
      enrichedFormData = {
        ...familyPrefillData,
        ...formData // Sobrescreve com dados manuais se existirem
      };
    } catch (error) {
      // Se falhar ao buscar dados familiares, continua com formData original
      console.warn('Não foi possível pré-preencher dados familiares:', error);
    }

    // 3. Criar protocolo em transação
    const result = await prisma.$transaction(async (tx) => {
      // Gerar número do protocolo - Sistema centralizado com lock
      const protocolNumber = await generateProtocolNumberSafe(tx);

      // Converter attachments de array para string JSON se necessário
      const attachmentsData = rest.attachments
        ? (Array.isArray(rest.attachments) ? JSON.stringify(rest.attachments) : rest.attachments)
        : undefined;

      // Preparar customData com metadados da entidade virtual
      const customDataPayload = isComDados && service.moduleType
        ? {
            // Dados do formulário (enriquecidos com dados de composição familiar)
            ...enrichedFormData,
            // Metadados da entidade virtual
            _meta: {
              entityType: service.moduleType,
              status: 'PENDING_APPROVAL',
              isActive: false,
              createdAt: new Date().toISOString(),
              approvedAt: null,
              approvedBy: null
            }
          }
        : enrichedFormData;

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
          customData: customDataPayload as Prisma.JsonObject,
          createdById,
          latitude: rest.latitude,
          longitude: rest.longitude,
          address: rest.address,
          attachments: attachmentsData
        }
      });

      // Criar histórico
      await tx.protocolHistorySimplified.create({
        data: {
          protocolId: protocol.id,
          action: 'CREATED',
          comment: isComDados
            ? 'Protocolo COM_DADOS criado - aguardando aprovação'
            : 'Protocolo SEM_DADOS criado',
          newStatus: ProtocolStatus.VINCULADO,
          userId: createdById
        }
      });

      return {
        protocol,
        isComDados,
        hasModule: isComDados && !!service.moduleType
      };
    });

    // ============================================================================
    // APLICAR WORKFLOW E SLA (FORA DA TRANSAÇÃO)
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

    // ============================================================================
    // PROCESSAR CITIZEN LINKS (FORA DA TRANSAÇÃO)
    // ============================================================================

    try {
      const { processProtocolCitizenLinks } = await import('./protocol-citizen-links.service');
      const links = await processProtocolCitizenLinks(
        result.protocol.id,
        serviceId,
        citizenId,
        formData,
        createdById
      );

      if (links.length > 0) {
        console.log(`✅ ${links.length} citizen link(s) processado(s) para protocolo ${result.protocol.id}`);
      }
    } catch (error) {
      console.error('Erro ao processar citizen links:', error);
      // Não falhar a criação do protocolo se citizen links falharem
    }

    // ============================================================================
    // ⭐ HOOK AUTOMÁTICO: CONVERTER PROTOCOLO TFD → SOLICITAÇÃO TFD
    // ============================================================================

    if (result.protocol.moduleType === 'ENCAMINHAMENTOS_TFD') {
      try {
        const protocolToTFDService = (await import('./tfd/protocol-to-tfd.service')).default;
        const solicitacaoTFD = await protocolToTFDService.convertProtocolToTFD(result.protocol.id);

        console.log(`✅ Protocolo ${result.protocol.number} convertido automaticamente para solicitação TFD ${solicitacaoTFD.id}`);
      } catch (error) {
        console.error('❌ Erro ao converter protocolo para TFD:', error);
        // Não falhar a criação do protocolo se conversão TFD falhar
        // O protocolo continua existindo e pode ser convertido manualmente depois
      }
    }

    return result;
  }

  /**
   * Aplicar workflow ao protocolo
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
   * Aprovar protocolo e ativar entidade virtual
   */
  async approveProtocol(input: ApproveProtocolInput) {
    const { protocolId, userId, comment, additionalData } = input;

    // Buscar protocolo
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId },
      include: { service: true }
    });

    if (!protocol) {
      throw new Error('Protocolo não encontrado');
    }

    // Ativar entidade virtual no customData se for COM_DADOS
    if (protocol.service.serviceType === 'COM_DADOS' && protocol.customData) {
      await prisma.$transaction(async (tx) => {
        const customData = protocol.customData as Record<string, any>;

        // Atualizar metadados da entidade virtual
        const updatedCustomData = {
          ...customData,
          _meta: {
            ...(customData._meta || {}),
            status: 'ACTIVE',
            isActive: true,
            approvedAt: new Date().toISOString(),
            approvedBy: userId
          }
        };

        // Atualizar protocolo com customData atualizado
        await tx.protocolSimplified.update({
          where: { id: protocolId },
          data: {
            customData: updatedCustomData as Prisma.JsonObject
          }
        });
      });
    }

    // Usar motor centralizado de status
    const result = await protocolStatusEngine.updateStatus({
      protocolId,
      newStatus: ProtocolStatus.CONCLUIDO,
      actorId: userId,
      actorRole: UserRole.USER,
      comment: comment || 'Protocolo aprovado e concluído',
      metadata: {
        action: 'approval',
        additionalData
      }
    });

    return result.protocol;
  }

  /**
   * Rejeitar protocolo
   */
  async rejectProtocol(input: RejectProtocolInput) {
    const { protocolId, userId, reason } = input;

    // Buscar protocolo
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId }
    });

    if (!protocol) {
      throw new Error('Protocolo não encontrado');
    }

    // Usar motor centralizado de status (PENDENCIA para rejeição)
    const result = await protocolStatusEngine.updateStatus({
      protocolId,
      newStatus: ProtocolStatus.PENDENCIA,
      actorId: userId,
      actorRole: UserRole.USER,
      comment: `Protocolo rejeitado: ${reason}`,
      reason,
      metadata: {
        action: 'rejection'
      }
    });

    return result.protocol;
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

  /**
   * Buscar dados da entidade virtual de um protocolo
   */
  async getVirtualEntity(protocolId: string) {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId },
      include: {
        service: true,
        citizen: true
      }
    });

    if (!protocol) {
      throw new Error('Protocolo não encontrado');
    }

    if (!protocol.customData) {
      return null;
    }

    const customData = protocol.customData as Record<string, any>;
    const { _meta, ...entityData } = customData;

    return {
      protocolId: protocol.id,
      protocolNumber: protocol.number,
      entityType: protocol.moduleType,
      entityData,
      meta: _meta,
      service: protocol.service,
      citizen: {
        id: protocol.citizen.id,
        name: protocol.citizen.name,
        cpf: protocol.citizen.cpf
      }
    };
  }

  /**
   * Atualizar dados da entidade virtual
   */
  async updateVirtualEntity(
    protocolId: string,
    updates: Record<string, any>,
    userId: string
  ) {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId }
    });

    if (!protocol) {
      throw new Error('Protocolo não encontrado');
    }

    const customData = (protocol.customData as Record<string, any>) || {};
    const { _meta, ...currentData } = customData;

    const updatedCustomData = {
      ...currentData,
      ...updates,
      _meta: {
        ...(_meta || {}),
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      }
    };

    const updatedProtocol = await prisma.protocolSimplified.update({
      where: { id: protocolId },
      data: {
        customData: updatedCustomData as Prisma.JsonObject
      }
    });

    // Criar histórico
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId,
        action: 'ENTITY_UPDATED',
        comment: 'Dados da entidade virtual atualizados',
        userId
      }
    });

    return updatedProtocol;
  }
}

export const protocolModuleService = new ProtocolModuleService();
