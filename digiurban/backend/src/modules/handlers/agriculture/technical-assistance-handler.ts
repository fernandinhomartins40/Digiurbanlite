// ============================================================
// AGRICULTURE HANDLER - Assistência Técnica Rural
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

export class TechnicalAssistanceHandler extends BaseModuleHandler {
  moduleType = 'ASSISTENCIA_TECNICA';
  entityName = 'TechnicalAssistance';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol, serviceId } = action;

    if (action.action === 'create') {
      return this.createAssistance(data, protocol, serviceId, tx);
    }

    if (action.action === 'schedule') {
      return this.scheduleAssistance(data, tx);
    }

    if (action.action === 'complete') {
      return this.completeAssistance(data, tx);
    }

    if (action.action === 'cancel') {
      return this.cancelAssistance(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  /**
   * Criar solicitação de assistência técnica
   * ✅ REFATORADO: Sem duplicação de dados, apenas citizenId
   */
  private async createAssistance(
    data: any,
    protocol: string,
    serviceId: string,
    tx: PrismaTransaction
  ) {
    // ========== VALIDAÇÃO 1: citizenId obrigatório ==========
    if (!data.citizenId) {
      throw new Error('citizenId é obrigatório. A solicitação deve ser vinculada a um cidadão existente.');
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

    // ========== VALIDAÇÃO 3: Campos obrigatórios específicos ==========
    if (!data.assistanceType && !data.tipoAssistencia) {
      throw new Error('Tipo de assistência é obrigatório (ex: ORIENTACAO_TECNICA, ANALISE_SOLO, CONTROLE_PRAGAS)');
    }

    if (!data.description && !data.descricao) {
      throw new Error('Descrição do problema/necessidade é obrigatória');
    }

    // ========== VALIDAÇÃO 4: Verificar se há produtor rural vinculado (opcional) ==========
    let producerId = data.producerId || null;
    if (!producerId) {
      // Tentar encontrar produtor pelo citizenId
      const producer = await tx.ruralProducer.findUnique({
        where: { citizenId: data.citizenId }
      });
      if (producer && producer.isActive) {
        producerId = producer.id;
      }
    }

    // ✅ Criar assistência técnica SEM duplicações - apenas dados específicos
    const assistance = await tx.technicalAssistance.create({
      data: {
        citizenId: data.citizenId, // ✅ OBRIGATÓRIO
        protocolId: protocol,
        producerId, // ✅ Opcional - vincula ao produtor se existir

        // ✅ APENAS campos específicos da assistência
        assistanceType: data.assistanceType || data.tipoAssistencia,
        subject: data.subject || data.assunto || data.assistanceType,
        description: data.description || data.descricao,
        urgency: data.urgency || data.urgencia || 'NORMAL',

        // Dados da propriedade (se informados)
        propertyName: data.propertyName || data.nomePropriedade || null,
        propertySize: data.propertySize ? parseFloat(data.propertySize) : null,
        propertyArea: data.propertyArea ? parseFloat(data.propertyArea) : null,
        location: data.location || data.localizacao || null,
        coordinates: data.coordinates || data.coordenadas || null,

        // Culturas e criações
        crop: data.crop || data.cultura || null,
        cropTypes: data.cropTypes || data.tiposCulturas || null,
        livestock: data.livestock || data.criacoes || null,
        mainCrops: data.mainCrops || data.culturaisPrincipais || null,

        // Agendamento
        requestDate: new Date(),
        preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,

        // Status inicial
        status: 'PENDING',
        priority: data.priority || data.prioridade || 'normal',

        // Técnico (ainda não designado)
        technician: null,
        technicianId: null,

        // Metadados
        serviceId,
        source: 'online'
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
      assistance,
      // ✅ Retornar dados do cidadão via relação (não duplicados)
      citizen: assistance.citizen
    };
  }

  /**
   * Agendar visita técnica
   */
  private async scheduleAssistance(data: any, tx: PrismaTransaction) {
    const { assistanceId, scheduledDate, technicianId, technician } = data;

    if (!assistanceId) {
      throw new Error('assistanceId é obrigatório');
    }

    if (!scheduledDate) {
      throw new Error('Data de agendamento é obrigatória');
    }

    const assistance = await tx.technicalAssistance.update({
      where: { id: assistanceId },
      data: {
        status: 'SCHEDULED',
        scheduledDate: new Date(scheduledDate),
        technicianId: technicianId || null,
        technician: technician || null,
        scheduledVisit: new Date(scheduledDate)
      },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            phone: true
          }
        }
      }
    });

    return { assistance };
  }

  /**
   * Completar assistência técnica com relatório
   */
  private async completeAssistance(data: any, tx: PrismaTransaction) {
    const {
      assistanceId,
      visitDate,
      findings,
      recommendations,
      visitReport,
      photos,
      materials,
      costs,
      followUpRequired,
      followUpDate,
      followUpNotes,
      completedBy,
      satisfaction
    } = data;

    if (!assistanceId) {
      throw new Error('assistanceId é obrigatório');
    }

    const assistance = await tx.technicalAssistance.update({
      where: { id: assistanceId },
      data: {
        status: 'COMPLETED',
        visitDate: visitDate ? new Date(visitDate) : new Date(),
        findings: findings || null,
        recommendations: recommendations || null,
        visitReport: visitReport || null,
        photos: photos || null,
        materials: materials || null,
        costs: costs ? parseFloat(costs) : null,
        followUpRequired: followUpRequired || false,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        followUpNotes: followUpNotes || null,
        completedBy: completedBy || null,
        completedAt: new Date(),
        satisfaction: satisfaction || null
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

    // Atualizar protocolo para concluído
    if (assistance.protocolId) {
      await tx.protocolSimplified.update({
        where: { id: assistance.protocolId },
        data: { status: 'CONCLUIDO', concludedAt: new Date() }
      });

      await tx.protocolHistorySimplified.create({
        data: {
          protocolId: assistance.protocolId,
          action: 'COMPLETED',
          comment: 'Assistência técnica concluída',
          newStatus: 'CONCLUIDO'
        }
      });
    }

    return { assistance };
  }

  /**
   * Cancelar assistência técnica
   */
  private async cancelAssistance(data: any, tx: PrismaTransaction) {
    const { assistanceId, reason } = data;

    if (!assistanceId) {
      throw new Error('assistanceId é obrigatório');
    }

    const assistance = await tx.technicalAssistance.update({
      where: { id: assistanceId },
      data: {
        status: 'CANCELLED',
        observations: reason || 'Cancelado'
      },
      include: {
        citizen: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Atualizar protocolo
    if (assistance.protocolId) {
      await tx.protocolSimplified.update({
        where: { id: assistance.protocolId },
        data: { status: 'CANCELADO' }
      });

      await tx.protocolHistorySimplified.create({
        data: {
          protocolId: assistance.protocolId,
          action: 'CANCELLED',
          comment: reason || 'Assistência técnica cancelada',
          newStatus: 'CANCELADO'
        }
      });
    }

    return { assistance };
  }
}
