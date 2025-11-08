/**
 * ============================================================================
 * HANDLER: REGISTRO DE OCORRÊNCIA ESCOLAR
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { ModuleHandler } from '../../../modules/handlers/registry';

export class DisciplinaryRecordHandler implements ModuleHandler {
  async createEntity(
    protocolId: string,
    formData: Record<string, any>,
    citizenId: string,
    prisma: PrismaClient
  ): Promise<{ id: string; [key: string]: any }> {
    // Buscar cidadão (geralmente responsável)
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId }
    });

    if (!citizen) {
      throw new Error('Cidadão não encontrado');
    }

    // Criar registro disciplinar
    const record = await prisma.disciplinaryRecord.create({
      data: {
        protocolId,
        citizenId,

        // Dados do estudante
        studentId: formData.studentId,
        studentName: formData.studentName,
        studentCpf: formData.studentCpf,
        studentGrade: formData.studentGrade,

        // Escola
        schoolId: formData.schoolId,
        schoolName: formData.schoolName,

        // Tipo de ocorrência
        incidentType: formData.incidentType || 'BEHAVIOR',
        severity: formData.severity || 'MILD',

        // Data e horário
        incidentDate: formData.incidentDate ? new Date(formData.incidentDate) : new Date(),
        incidentTime: formData.incidentTime,
        incidentLocation: formData.incidentLocation,

        // Descrição
        description: formData.description,
        witnesses: formData.witnesses, // Array de testemunhas

        // Envolvidos
        involvedStudents: formData.involvedStudents, // Array
        involvedStaff: formData.involvedStaff, // Array

        // Ação tomada
        actionTaken: formData.actionTaken,
        counselingProvided: formData.counselingProvided || false,
        parentNotified: formData.parentNotified || false,
        parentNotificationDate: formData.parentNotified && formData.parentNotificationDate
          ? new Date(formData.parentNotificationDate)
          : null,

        // Medidas disciplinares
        disciplinaryAction: formData.disciplinaryAction,
        measures: formData.measures || formData.disciplinaryAction || 'Aguardando medidas',
        suspensionDays: formData.suspensionDays || 0,
        suspensionStartDate: formData.suspensionStartDate ? new Date(formData.suspensionStartDate) : null,
        suspensionEndDate: formData.suspensionEndDate ? new Date(formData.suspensionEndDate) : null,

        // Acompanhamento
        requiresFollowUp: formData.requiresFollowUp || false,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate) : null,
        followUpResponsible: formData.followUpResponsible,

        // Responsável pelo registro
        reportedById: formData.reportedById,
        reportedByName: formData.reportedByName,
        reportedByRole: formData.reportedByRole,
        responsibleTeacher: formData.responsibleTeacher || formData.reportedByName || 'Não informado',

        // Status
        status: 'PENDING_REVIEW',
        isActive: false,

        // Observações
        observations: formData.observations,
        internalNotes: formData.internalNotes
      }
    });

    return record;
  }

  async activateEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.disciplinaryRecord.update({
      where: { id: entityId },
      data: {
        status: 'REVIEWED',
        isActive: true,
        reviewedAt: new Date()
      }
    });
  }

  async findByProtocolId(protocolId: string, prisma: PrismaClient): Promise<any | null> {
    return await prisma.disciplinaryRecord.findFirst({
      where: { protocolId },
      include: {
        protocol: true
      }
    });
  }

  async updateEntity(
    entityId: string,
    data: Record<string, any>,
    prisma: PrismaClient
  ): Promise<any> {
    return await prisma.disciplinaryRecord.update({
      where: { id: entityId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async deleteEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.disciplinaryRecord.update({
      where: { id: entityId },
      data: {
        isActive: false,
        status: 'CANCELLED'
      }
    });
  }

  validateFormData(formData: Record<string, any>): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Validações obrigatórias
    if (!formData.studentName) {
      errors.push('Nome do estudante é obrigatório');
    }

    if (!formData.schoolName && !formData.schoolId) {
      errors.push('Escola é obrigatória');
    }

    if (!formData.incidentType) {
      errors.push('Tipo de ocorrência é obrigatório');
    }

    if (!formData.description) {
      errors.push('Descrição da ocorrência é obrigatória');
    }

    if (!formData.incidentDate) {
      errors.push('Data da ocorrência é obrigatória');
    }

    if (!formData.reportedByName) {
      errors.push('Responsável pelo registro é obrigatório');
    }

    // Validar suspensão
    if (formData.disciplinaryAction === 'SUSPENSION') {
      if (!formData.suspensionDays || formData.suspensionDays <= 0) {
        errors.push('Dias de suspensão devem ser informados');
      }
      if (!formData.suspensionStartDate) {
        errors.push('Data de início da suspensão é obrigatória');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
