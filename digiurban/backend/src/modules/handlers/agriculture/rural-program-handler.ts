// ============================================================
// AGRICULTURE HANDLER - Inscrição em Programa Rural
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

export class RuralProgramEnrollmentHandler extends BaseModuleHandler {
  moduleType = 'INSCRICAO_PROGRAMA_RURAL';
  entityName = 'RuralProgramEnrollment';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol, serviceId } = action;

    if (action.action === 'create') {
      return this.createEnrollment(data, protocol, serviceId, tx);
    }

    if (action.action === 'approve') {
      return this.approveEnrollment(data, tx);
    }

    if (action.action === 'reject') {
      return this.rejectEnrollment(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  /**
   * Criar inscrição em programa rural
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

    // ========== VALIDAÇÃO 3: Verificar se programa existe ==========
    if (!data.programId) {
      throw new Error('programId é obrigatório');
    }

    const program = await tx.ruralProgram.findUnique({
      where: { id: data.programId }
    });

    if (!program) {
      throw new Error('Programa rural não encontrado');
    }

    // ========== VALIDAÇÃO 4: Verificar se já está inscrito ==========
    const existingEnrollment = await tx.ruralProgramEnrollment.findFirst({
      where: {
        citizenId: data.citizenId,
        programId: data.programId,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    });

    if (existingEnrollment) {
      throw new Error('Cidadão já possui inscrição ativa neste programa');
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
    const enrollment = await tx.ruralProgramEnrollment.create({
      data: {
        citizenId: data.citizenId, // ✅ OBRIGATÓRIO
        programId: data.programId,
        protocolId: protocol,
        producerId,

        // Dados customizados do formulário do programa
        customData: data.customData || data.dadosCustomizados || null,
        documents: data.documents || data.documentos || null,
        observations: data.observations || data.observacoes || null,

        status: 'PENDING',
        enrollmentDate: new Date()
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
        program: {
          select: {
            id: true,
            name: true,
            programType: true,
            description: true
          }
        }
      }
    });

    return {
      enrollment,
      citizen: enrollment.citizen,
      program: enrollment.program
    };
  }

  /**
   * Aprovar inscrição
   */
  private async approveEnrollment(data: any, tx: PrismaTransaction) {
    const { enrollmentId, approvedBy, startDate } = data;

    if (!enrollmentId) {
      throw new Error('enrollmentId é obrigatório');
    }

    const enrollment = await tx.ruralProgramEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'APPROVED',
        approvedDate: new Date(),
        startDate: startDate ? new Date(startDate) : new Date()
      },
      include: {
        citizen: true,
        program: true
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
          action: 'APPROVED',
          comment: 'Inscrição em programa rural aprovada',
          newStatus: 'CONCLUIDO',
          userId: approvedBy
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

    const enrollment = await tx.ruralProgramEnrollment.update({
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
          newStatus: 'PENDENCIA',
          userId: rejectedBy
        }
      });
    }

    return { enrollment };
  }
}
