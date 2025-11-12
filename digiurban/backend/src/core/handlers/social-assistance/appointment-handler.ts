/**
 * ============================================================================
 * HANDLER: AGENDAMENTO DE ATENDIMENTO SOCIAL
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { ModuleHandler } from '../../../modules/handlers/registry';

export class SocialAppointmentHandler implements ModuleHandler {
  async createEntity(
    protocolId: string,
    formData: Record<string, any>,
    citizenId: string,
    prisma: PrismaClient
  ): Promise<{ id: string; [key: string]: any }> {
    // Buscar cidadão
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId }
    });

    if (!citizen) {
      throw new Error('Cidadão não encontrado');
    }

    // ✅ REFATORADO - Criar agendamento sem duplicação
    const appointment = await prisma.socialAppointment.create({
      data: {
        protocolId,
        citizenId, // ✅ Apenas vincula ao cidadão

        // Tipo de agendamento
        appointmentType: formData.appointmentType || 'INITIAL_INTERVIEW',
        serviceType: formData.serviceType,

        // Campo obrigatório
        purpose: formData.purpose || formData.reason || formData.appointmentType || 'Agendamento',

        // Data e horário
        appointmentDate: formData.appointmentDate ? new Date(formData.appointmentDate) : new Date(),
        appointmentTime: formData.appointmentTime || '08:00',
        estimatedDuration: formData.estimatedDuration || 60, // minutos

        // Local
        equipmentType: formData.equipmentType || 'CRAS',
        equipmentId: formData.equipmentId,
        equipmentName: formData.equipmentName,
        roomNumber: formData.roomNumber,

        // Assistente social
        socialWorkerId: formData.socialWorkerId,
        socialWorkerName: formData.socialWorkerName,

        // Motivo do agendamento
        reason: formData.reason,
        description: formData.description,
        referredBy: formData.referredBy,
        referralReason: formData.referralReason,

        // Prioridade
        priority: formData.priority || 'NORMAL',
        isUrgent: formData.isUrgent || false,
        urgencyJustification: formData.urgencyJustification,

        // Situação do cidadão
        isFirstTime: formData.isFirstTime || false,
        previousAttendances: formData.previousAttendances || 0,
        hasCadUnico: formData.hasCadUnico || false,
        vulnerabilityLevel: formData.vulnerabilityLevel,

        // Documentos necessários
        requiredDocuments: formData.requiredDocuments, // Array
        hasAllDocuments: formData.hasAllDocuments || false,

        // Acompanhante
        hasCompanion: formData.hasCompanion || false,
        companionName: formData.companionName,
        companionRelationship: formData.companionRelationship,

        // Acessibilidade
        needsAccessibility: formData.needsAccessibility || false,
        accessibilityNeeds: formData.accessibilityNeeds, // Array
        needsInterpreter: formData.needsInterpreter || false,
        interpreterLanguage: formData.interpreterLanguage,

        // Confirmação
        confirmed: formData.confirmed || false,
        confirmationMethod: formData.confirmationMethod,
        confirmedAt: formData.confirmed ? new Date() : null,

        // Lembrete
        reminderSent: false,
        reminderDate: null,

        // Status
        status: 'SCHEDULED',
        isActive: false,

        // Observações
        observations: formData.observations,
        internalNotes: formData.internalNotes
      }
    });

    return appointment;
  }

  async activateEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.socialAppointment.update({
      where: { id: entityId },
      data: {
        status: 'CONFIRMED',
        confirmed: true,
        isActive: true,
        confirmedAt: new Date()
      }
    });
  }

  async findByProtocolId(protocolId: string, prisma: PrismaClient): Promise<any | null> {
    return await prisma.socialAppointment.findFirst({
      where: { protocolId },
      include: {
        protocol: true,
        citizen: true
      }
    });
  }

  async updateEntity(
    entityId: string,
    data: Record<string, any>,
    prisma: PrismaClient
  ): Promise<any> {
    return await prisma.socialAppointment.update({
      where: { id: entityId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async deleteEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.socialAppointment.update({
      where: { id: entityId },
      data: {
        isActive: false,
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    });
  }

  validateFormData(formData: Record<string, any>): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Validações obrigatórias
    if (!formData.appointmentType) {
      errors.push('Tipo de agendamento é obrigatório');
    }

    if (!formData.appointmentDate) {
      errors.push('Data do agendamento é obrigatória');
    }

    if (!formData.appointmentTime) {
      errors.push('Horário do agendamento é obrigatório');
    }

    if (!formData.equipmentName && !formData.equipmentId) {
      errors.push('Equipamento (CRAS/CREAS) é obrigatório');
    }

    if (!formData.reason) {
      errors.push('Motivo do agendamento é obrigatório');
    }

    // Validar data futura
    if (formData.appointmentDate) {
      const appointmentDate = new Date(formData.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (appointmentDate < today) {
        errors.push('Data do agendamento deve ser hoje ou uma data futura');
      }
    }

    // Validações condicionais
    if (formData.hasCompanion && !formData.companionName) {
      errors.push('Nome do acompanhante é obrigatório');
    }

    if (formData.needsInterpreter && !formData.interpreterLanguage) {
      errors.push('Idioma do intérprete é obrigatório');
    }

    if (formData.isUrgent && !formData.urgencyJustification) {
      errors.push('Justificativa da urgência é obrigatória');
    }

    if (formData.estimatedDuration && (formData.estimatedDuration < 15 || formData.estimatedDuration > 480)) {
      errors.push('Duração estimada deve estar entre 15 minutos e 8 horas');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
