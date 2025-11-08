/**
 * ============================================================================
 * HANDLER: CONSULTA DE NOTAS/BOLETIM
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { ModuleHandler } from '../../../modules/handlers/registry';

export class GradeRecordHandler implements ModuleHandler {
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

    // Criar registro de notas
    const record = await prisma.gradeRecord.create({
      data: {
        protocolId,
        citizenId,

        // Dados do estudante
        studentId: formData.studentId,
        studentName: formData.studentName,
        studentCpf: formData.studentCpf,

        // Escola e turma
        schoolId: formData.schoolId,
        schoolName: formData.schoolName,
        gradeLevel: formData.gradeLevel || formData.grade, // Série/ano escolar
        className: formData.className,
        shift: formData.shift,

        // Período
        periodType: formData.periodType || 'BIMESTER',
        periodNumber: formData.periodNumber || 1,
        academicYear: formData.academicYear || new Date().getFullYear(),
        period: formData.period || `${formData.periodNumber || 1}º ${formData.periodType || 'BIMESTRE'}`,
        subject: formData.subject || 'TODAS',

        // Notas (compatibilidade)
        grade: formData.averageGrade || formData.grade || 0,

        // Disciplinas e notas
        subjects: formData.subjects, // Array de objetos com matéria, nota, etc

        // Estatísticas gerais
        totalSubjects: formData.totalSubjects || 0,
        averageGrade: formData.averageGrade || 0,
        passedSubjects: formData.passedSubjects || 0,
        failedSubjects: formData.failedSubjects || 0,
        passingGrade: formData.passingGrade || 6.0,

        // Status do estudante
        studentStatus: formData.studentStatus || 'ENROLLED',
        isApproved: formData.isApproved || false,
        hasRecovery: formData.hasRecovery || false,
        recoverySubjects: formData.recoverySubjects, // Array

        // Frequência relacionada
        overallAttendancePercentage: formData.overallAttendancePercentage,

        // Observações do professor/conselho
        teacherComments: formData.teacherComments,
        councilComments: formData.councilComments,

        // Responsável pela consulta
        requestedById: formData.requestedById || citizenId,
        requestedByName: formData.requestedByName || citizen.name,
        requestedByRole: formData.requestedByRole || 'PARENT',

        // Status
        status: 'PENDING',
        isActive: false,

        // Observações
        observations: formData.observations,
        internalNotes: formData.internalNotes
      }
    });

    return record;
  }

  async activateEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.gradeRecord.update({
      where: { id: entityId },
      data: {
        status: 'PROCESSED',
        isActive: true,
        processedAt: new Date()
      }
    });
  }

  async findByProtocolId(protocolId: string, prisma: PrismaClient): Promise<any | null> {
    return await prisma.gradeRecord.findFirst({
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
    return await prisma.gradeRecord.update({
      where: { id: entityId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async deleteEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.gradeRecord.update({
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

    if (!formData.grade) {
      errors.push('Série/ano é obrigatório');
    }

    if (!formData.periodType) {
      errors.push('Tipo de período é obrigatório');
    }

    if (!formData.periodNumber) {
      errors.push('Número do período é obrigatório');
    }

    if (!formData.academicYear) {
      errors.push('Ano letivo é obrigatório');
    }

    // Validar período
    if (formData.periodType === 'BIMESTER' && (formData.periodNumber < 1 || formData.periodNumber > 4)) {
      errors.push('Bimestre deve estar entre 1 e 4');
    }

    if (formData.periodType === 'TRIMESTER' && (formData.periodNumber < 1 || formData.periodNumber > 3)) {
      errors.push('Trimestre deve estar entre 1 e 3');
    }

    if (formData.periodType === 'SEMESTER' && (formData.periodNumber < 1 || formData.periodNumber > 2)) {
      errors.push('Semestre deve estar entre 1 e 2');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
