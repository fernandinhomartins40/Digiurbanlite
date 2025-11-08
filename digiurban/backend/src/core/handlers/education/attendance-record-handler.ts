/**
 * ============================================================================
 * HANDLER: CONSULTA DE FREQUÊNCIA ESCOLAR
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { ModuleHandler } from '../../../modules/handlers/registry';

export class AttendanceRecordHandler implements ModuleHandler {
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

    // Criar registro de frequência
    const record = await prisma.attendanceRecord.create({
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
        grade: formData.grade,
        className: formData.className,
        shift: formData.shift,

        // Período da consulta
        periodType: formData.periodType || 'MONTHLY',
        referenceMonth: formData.referenceMonth,
        referenceYear: formData.referenceYear || new Date().getFullYear(),
        month: formData.month || formData.referenceMonth || new Date().getMonth() + 1,
        year: formData.year || formData.referenceYear || new Date().getFullYear(),
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,

        // Estatísticas de frequência
        totalDays: formData.totalDays || 0,
        presentDays: formData.presentDays || 0,
        absentDays: formData.absentDays || 0,
        justifiedAbsences: formData.justifiedAbsences || 0,
        unjustifiedAbsences: formData.unjustifiedAbsences || 0,
        attendancePercentage: formData.attendancePercentage || 0,
        percentage: formData.percentage || formData.attendancePercentage || 0,

        // Detalhes das faltas
        absenceDetails: formData.absenceDetails, // Array com datas e justificativas

        // Alertas
        hasLowAttendance: formData.hasLowAttendance || false,
        lowAttendanceThreshold: formData.lowAttendanceThreshold || 75,
        requiresIntervention: formData.requiresIntervention || false,

        // Ações tomadas
        parentNotified: formData.parentNotified || false,
        parentNotificationDate: formData.parentNotificationDate ? new Date(formData.parentNotificationDate) : null,
        interventionPlan: formData.interventionPlan,

        // Responsável pela consulta
        requestedById: formData.requestedById || citizenId,
        requestedByName: formData.requestedByName || citizen.name,
        requestedByRole: formData.requestedByRole || 'PARENT',

        // Status
        status: 'PENDING',
        isActive: false,

        // Observações
        observations: formData.observations,
        teacherNotes: formData.teacherNotes
      }
    });

    return record;
  }

  async activateEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.attendanceRecord.update({
      where: { id: entityId },
      data: {
        status: 'PROCESSED',
        isActive: true,
        processedAt: new Date()
      }
    });
  }

  async findByProtocolId(protocolId: string, prisma: PrismaClient): Promise<any | null> {
    return await prisma.attendanceRecord.findFirst({
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
    return await prisma.attendanceRecord.update({
      where: { id: entityId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async deleteEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.attendanceRecord.update({
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

    // Validar período
    if (formData.periodType === 'CUSTOM') {
      if (!formData.startDate || !formData.endDate) {
        errors.push('Datas de início e fim são obrigatórias para período personalizado');
      }
    } else if (formData.periodType === 'MONTHLY') {
      if (!formData.referenceMonth || !formData.referenceYear) {
        errors.push('Mês e ano de referência são obrigatórios');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
