/**
 * ============================================================================
 * HANDLER: ATENDIMENTOS EDUCAÇÃO
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { ModuleHandler } from '../../../modules/handlers/registry';

export class EducationAttendanceHandler implements ModuleHandler {
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

    // ✅ REFATORADO - Criar atendimento sem duplicação
    const attendance = await prisma.educationAttendance.create({
      data: {
        protocolId,
        citizenId, // ✅ Apenas vincula ao cidadão

        // Tipo de atendimento
        attendanceType: formData.attendanceType || 'GENERAL_INFO',
        category: formData.category || 'ADMINISTRATIVE',
        serviceType: formData.serviceType || formData.attendanceType || 'GENERAL_INFO',

        // Dados do estudante (se aplicável)
        studentName: formData.studentName,
        studentCpf: formData.studentCpf,
        studentBirthDate: formData.studentBirthDate ? new Date(formData.studentBirthDate) : null,
        studentRelationship: formData.studentRelationship,

        // Escola
        schoolId: formData.schoolId,
        schoolName: formData.schoolName,
        grade: formData.grade,
        shift: formData.shift,

        // Solicitação
        subject: formData.subject,
        description: formData.description,
        requestedServices: formData.requestedServices, // Array

        // Prioridade e urgência
        priority: formData.priority || 'NORMAL',
        urgency: formData.urgency || 'ROUTINE',

        // Anexos
        hasDocuments: formData.hasDocuments || false,
        attachments: formData.attachments,

        // Status
        status: 'OPEN',
        isActive: false,

        // Responsável pelo atendimento
        assignedToId: formData.assignedToId,
        assignedToName: formData.assignedToName,

        // Data agendada
        scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate) : null,

        // Observações
        observations: formData.observations,

        // Module type
        moduleType: 'ATENDIMENTOS_EDUCACAO'
      }
    });

    return attendance;
  }

  async activateEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.educationAttendance.update({
      where: { id: entityId },
      data: {
        status: 'IN_PROGRESS',
        isActive: true,
        startedAt: new Date()
      }
    });
  }

  async findByProtocolId(protocolId: string, prisma: PrismaClient): Promise<any | null> {
    return await prisma.educationAttendance.findFirst({
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
    return await prisma.educationAttendance.update({
      where: { id: entityId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async deleteEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.educationAttendance.update({
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
    if (!formData.attendanceType) {
      errors.push('Tipo de atendimento é obrigatório');
    }

    if (!formData.subject) {
      errors.push('Assunto é obrigatório');
    }

    if (!formData.description) {
      errors.push('Descrição é obrigatória');
    }

    // Se for relacionado a estudante, validar dados
    if (formData.studentName && !formData.studentRelationship) {
      errors.push('Informe o parentesco com o estudante');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
