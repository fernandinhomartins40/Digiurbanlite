// ============================================================
// AGRICULTURE HANDLER - Atendimentos Agricultura
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

export class AgricultureAttendanceHandler extends BaseModuleHandler {
  moduleType = 'ATENDIMENTOS_AGRICULTURA';
  entityName = 'AgricultureAttendance';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol, serviceId } = action;

    if (action.action === 'create') {
      return this.createAttendance(data, protocol, serviceId, tx);
    }

    if (action.action === 'update') {
      return this.updateAttendance(data, tx);
    }

    if (action.action === 'schedule') {
      return this.scheduleVisit(data, tx);
    }

    if (action.action === 'complete') {
      return this.completeAttendance(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  /**
   * Criar atendimento de agricultura
   * ✅ REFATORADO: Sem duplicação de dados, apenas citizenId
   */
  private async createAttendance(
    data: any,
    protocol: string,
    serviceId: string,
    tx: PrismaTransaction
  ) {
    // ========== VALIDAÇÃO 1: citizenId obrigatório ==========
    if (!data.citizenId) {
      throw new Error('citizenId é obrigatório. O atendimento deve ser vinculado a um cidadão existente.');
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

    // ========== VALIDAÇÃO 3: Campos obrigatórios ==========
    if (!data.serviceType && !data.tipoServico) {
      throw new Error('Tipo de serviço é obrigatório');
    }

    if (!data.subject && !data.assunto) {
      throw new Error('Assunto do atendimento é obrigatório');
    }

    if (!data.description && !data.descricao) {
      throw new Error('Descrição do atendimento é obrigatória');
    }

    // ========== VALIDAÇÃO 4: Verificar se há produtor rural vinculado (opcional) ==========
    let producerId = data.producerId || null;
    if (!producerId) {
      const producer = await tx.ruralProducer.findUnique({
        where: { citizenId: data.citizenId }
      });
      if (producer && producer.isActive) {
        producerId = producer.id;
      }
    }

    // ✅ Criar atendimento SEM duplicações - apenas dados específicos
    const attendance = await tx.agricultureAttendance.create({
      data: {
        citizenId: data.citizenId, // ✅ OBRIGATÓRIO
        protocolId: protocol,
        producerId, // ✅ Opcional - vincula ao produtor se existir

        // ✅ APENAS campos específicos do atendimento
        serviceType: data.serviceType || data.tipoServico,
        subject: data.subject || data.assunto,
        description: data.description || data.descricao,
        category: data.category || data.categoria || null,
        urgency: data.urgency || data.urgencia || 'NORMAL',

        // Dados da propriedade (se informados)
        propertyName: data.propertyName || data.nomePropriedade || null,
        propertySize: data.propertySize ? parseFloat(data.propertySize) : null,
        location: data.location || data.localizacao || null,
        crops: data.crops || data.culturas || null,
        livestock: data.livestock || data.criacoes || null,

        // Agendamento
        preferredVisitDate: data.preferredVisitDate ? new Date(data.preferredVisitDate) : null,

        // Status inicial
        status: 'PENDING'
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
      attendance,
      // ✅ Retornar dados do cidadão via relação (não duplicados)
      citizen: attendance.citizen
    };
  }

  /**
   * Atualizar atendimento
   */
  private async updateAttendance(data: any, tx: PrismaTransaction) {
    const {
      attendanceId,
      serviceType,
      subject,
      description,
      category,
      urgency,
      status
    } = data;

    if (!attendanceId) {
      throw new Error('attendanceId é obrigatório');
    }

    const attendance = await tx.agricultureAttendance.update({
      where: { id: attendanceId },
      data: {
        ...(serviceType && { serviceType }),
        ...(subject && { subject }),
        ...(description && { description }),
        ...(category && { category }),
        ...(urgency && { urgency }),
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

    return { attendance };
  }

  /**
   * Agendar visita
   */
  private async scheduleVisit(data: any, tx: PrismaTransaction) {
    const { attendanceId, scheduledDate, technician } = data;

    if (!attendanceId) {
      throw new Error('attendanceId é obrigatório');
    }

    if (!scheduledDate) {
      throw new Error('Data de agendamento é obrigatória');
    }

    const attendance = await tx.agricultureAttendance.update({
      where: { id: attendanceId },
      data: {
        status: 'SCHEDULED',
        scheduledDate: new Date(scheduledDate),
        technician: technician || null
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

    return { attendance };
  }

  /**
   * Completar atendimento
   */
  private async completeAttendance(data: any, tx: PrismaTransaction) {
    const {
      attendanceId,
      visitDate,
      findings,
      recommendations,
      resolution,
      followUpDate,
      satisfaction
    } = data;

    if (!attendanceId) {
      throw new Error('attendanceId é obrigatório');
    }

    const attendance = await tx.agricultureAttendance.update({
      where: { id: attendanceId },
      data: {
        status: 'COMPLETED',
        visitDate: visitDate ? new Date(visitDate) : new Date(),
        findings: findings || null,
        recommendations: recommendations || null,
        resolution: resolution || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
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
    if (attendance.protocolId) {
      await tx.protocolSimplified.update({
        where: { id: attendance.protocolId },
        data: { status: 'CONCLUIDO', concludedAt: new Date() }
      });

      await tx.protocolHistorySimplified.create({
        data: {
          protocolId: attendance.protocolId,
          action: 'COMPLETED',
          comment: 'Atendimento de agricultura concluído',
          newStatus: 'CONCLUIDO'
        }
      });
    }

    return { attendance };
  }
}
