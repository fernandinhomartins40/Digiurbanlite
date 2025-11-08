// ============================================================
// AGRICULTURE HANDLER - Inscrição em Curso Rural
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

export class RuralTrainingEnrollmentHandler extends BaseModuleHandler {
  moduleType = 'INSCRICAO_CURSO_RURAL';
  entityName = 'RuralTrainingEnrollment';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol, serviceId } = action;

    if (action.action === 'create') {
      return this.createEnrollment(data, protocol, serviceId, tx);
    }

    if (action.action === 'approve') {
      return this.approveEnrollment(data, tx);
    }

    if (action.action === 'complete') {
      return this.completeTraining(data, tx);
    }

    if (action.action === 'reject') {
      return this.rejectEnrollment(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  /**
   * Criar inscrição em curso/treinamento rural
   * ✅ REFATORADO: citizenId obrigatório, sem duplicação
   */
  private async createEnrollment(
    data: any,
    protocol: string,
    serviceId: string,
    tx: PrismaTransaction
  ) {
    // ========== VALIDAÇÃO 1: citizenId obrigatório ==========
    if (!data.citizenId) {
      throw new Error('citizenId é obrigatório. A inscrição deve ser vinculada a um cidadão.');
    }

    // ========== VALIDAÇÃO 2: Usar CitizenLookupService ==========
    const citizenService = new CitizenLookupService();
    const citizen = await citizenService.findById(data.citizenId);

    if (!citizen) {
      throw new Error('Cidadão não encontrado');
    }

    if (!citizen.isActive) {
      throw new Error('Cidadão não está ativo');
    }

    // ========== VALIDAÇÃO 3: Verificar se treinamento existe ==========
    if (!data.trainingId) {
      throw new Error('trainingId é obrigatório');
    }

    const training = await tx.ruralTraining.findUnique({
      where: { id: data.trainingId }
    });

    if (!training) {
      throw new Error('Curso/treinamento rural não encontrado');
    }

    // Verificar vagas disponíveis
    if (training.currentParticipants >= training.maxParticipants) {
      throw new Error('Curso está com vagas esgotadas');
    }

    // ========== VALIDAÇÃO 4: Verificar se já está inscrito ==========
    const existingEnrollment = await tx.ruralTrainingEnrollment.findFirst({
      where: {
        citizenId: data.citizenId,
        trainingId: data.trainingId,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    });

    if (existingEnrollment) {
      throw new Error('Cidadão já possui inscrição ativa neste curso');
    }

    // ========== Verificar produtor (opcional) ==========
    let producerId = data.producerId || null;
    if (!producerId) {
      const producer = await tx.ruralProducer.findUnique({
        where: { citizenId: data.citizenId }
      });
      if (producer) {
        producerId = producer.id;
      }
    }

    // ✅ Criar inscrição SEM duplicações
    const enrollment = await tx.ruralTrainingEnrollment.create({
      data: {
        citizenId: data.citizenId, // ✅ OBRIGATÓRIO
        trainingId: data.trainingId,
        protocolId: protocol,
        producerId,

        // Dados customizados do formulário do curso
        customData: data.customData || data.dadosCustomizados || null,
        documents: data.documents || data.documentos || null,
        observations: data.observations || data.observacoes || null,

        status: 'PENDING',
        enrollmentDate: new Date(),
        certificateIssued: false
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
        },
        training: {
          select: {
            id: true,
            title: true,
            trainingType: true,
            description: true,
            startDate: true,
            duration: true
          }
        }
      }
    });

    return {
      enrollment,
      citizen: enrollment.citizen,
      training: enrollment.training
    };
  }

  /**
   * Aprovar inscrição
   */
  private async approveEnrollment(data: any, tx: PrismaTransaction) {
    const { enrollmentId, approvedBy } = data;

    if (!enrollmentId) {
      throw new Error('enrollmentId é obrigatório');
    }

    // Incrementar contador de participantes
    const enrollment = await tx.ruralTrainingEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { training: true }
    });

    if (!enrollment) {
      throw new Error('Inscrição não encontrada');
    }

    // Atualizar inscrição
    const updated = await tx.ruralTrainingEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'APPROVED',
        approvedDate: new Date()
      },
      include: {
        citizen: true,
        training: true
      }
    });

    // Incrementar participantes no treinamento
    await tx.ruralTraining.update({
      where: { id: enrollment.trainingId },
      data: {
        currentParticipants: { increment: 1 }
      }
    });

    // Atualizar protocolo
    if (updated.protocolId) {
      await tx.protocolSimplified.update({
        where: { id: updated.protocolId },
        data: { status: 'PROGRESSO' }
      });

      await tx.protocolHistorySimplified.create({
        data: {
          protocolId: updated.protocolId,
          action: 'APPROVED',
          comment: 'Inscrição em curso rural aprovada',
          newStatus: 'EM_ANDAMENTO',
          userId: approvedBy
        }
      });
    }

    return { enrollment: updated };
  }

  /**
   * Completar treinamento e emitir certificado
   */
  private async completeTraining(data: any, tx: PrismaTransaction) {
    const { enrollmentId, completedBy, grade, feedback } = data;

    if (!enrollmentId) {
      throw new Error('enrollmentId é obrigatório');
    }

    const enrollment = await tx.ruralTrainingEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'COMPLETED',
        completionDate: new Date(),
        certificateIssued: true,
        adminNotes: feedback || null
      },
      include: {
        citizen: true,
        training: true
      }
    });

    // Atualizar protocolo
    if (enrollment.protocolId) {
      await tx.protocolSimplified.update({
        where: { id: enrollment.protocolId },
        data: { status: 'CONCLUIDO', concludedAt: new Date() }
      });

      await tx.protocolHistorySimplified.create({
        data: {
          protocolId: enrollment.protocolId,
          action: 'COMPLETED',
          comment: 'Curso concluído, certificado emitido',
          newStatus: 'CONCLUIDO'
        }
      });
    }

    return { enrollment };
  }

  /**
   * Rejeitar inscrição
   */
  private async rejectEnrollment(data: any, tx: PrismaTransaction) {
    const { enrollmentId, rejectionReason, rejectedBy } = data;

    if (!enrollmentId) {
      throw new Error('enrollmentId é obrigatório');
    }

    if (!rejectionReason) {
      throw new Error('Motivo da rejeição é obrigatório');
    }

    const enrollment = await tx.ruralTrainingEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'REJECTED',
        rejectedDate: new Date(),
        rejectionReason
      },
      include: {
        citizen: true
      }
    });

    // Atualizar protocolo
    if (enrollment.protocolId) {
      await tx.protocolSimplified.update({
        where: { id: enrollment.protocolId },
        data: { status: 'PENDENCIA' }
      });

      await tx.protocolHistorySimplified.create({
        data: {
          protocolId: enrollment.protocolId,
          action: 'REJECTED',
          comment: `Inscrição rejeitada: ${rejectionReason}`,
          newStatus: 'REJEITADO',
          userId: rejectedBy
        }
      });
    }

    return { enrollment };
  }
}
