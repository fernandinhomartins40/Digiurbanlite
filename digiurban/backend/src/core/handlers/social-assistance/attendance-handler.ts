/**
 * ============================================================================
 * HANDLER: ATENDIMENTOS ASSISTÊNCIA SOCIAL
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { ModuleHandler } from '../../../modules/handlers/registry';

export class SocialAttendanceHandler implements ModuleHandler {
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
    const attendance = await prisma.socialAssistanceAttendance.create({
      data: {
        protocolId,
        citizenId, // ✅ Apenas vincula ao cidadão

        // Campos obrigatórios
        protocol: formData.protocol || protocolId || `PROT-${Date.now()}`,
        serviceType: formData.serviceType || formData.attendanceType || 'GENERAL_INFORMATION',
        subject: formData.subject || formData.socialDemand || 'Atendimento de Assistência Social',
        description: formData.description || formData.socialDemand || 'Atendimento registrado',

        // Tipo de atendimento
        attendanceType: formData.attendanceType || 'GENERAL_INFORMATION',
        category: formData.category || 'ORIENTATION',

        // Demanda social
        socialDemand: formData.socialDemand,
        socialIssue: formData.socialIssue, // Array de questões sociais
        vulnerabilityLevel: formData.vulnerabilityLevel || 'LOW',

        // Composição familiar
        familySize: formData.familySize || 1,
        dependents: formData.dependents || 0,
        minors: formData.minors || 0,
        elderly: formData.elderly || 0,
        disabledMembers: formData.disabledMembers || 0,

        // Situação econômica
        monthlyIncome: formData.monthlyIncome || 0,
        unemployed: formData.unemployed || false,
        informalWork: formData.informalWork || false,
        housingSituation: formData.housingSituation,

        // Programas e benefícios atuais
        hasNIS: formData.hasNIS || false,
        nisNumber: formData.nisNumber,
        hasCadUnico: formData.hasCadUnico || false,
        cadUnicoNumber: formData.cadUnicoNumber,
        hasBolsaFamilia: formData.hasBolsaFamilia || false,
        otherBenefits: formData.otherBenefits, // Array

        // Solicitações específicas
        requestedServices: formData.requestedServices, // Array
        requestedBenefits: formData.requestedBenefits, // Array

        // Encaminhamentos
        needsReferral: formData.needsReferral || false,
        referralType: formData.referralType,
        referralDestination: formData.referralDestination,

        // Equipamento SUAS
        crasId: formData.crasId,
        crasName: formData.crasName,
        creasId: formData.creasId,
        creasName: formData.creasName,

        // Assistente social responsável
        socialWorkerId: formData.socialWorkerId,
        socialWorkerName: formData.socialWorkerName,

        // Prioridade
        priority: formData.priority || 'NORMAL',
        isUrgent: formData.isUrgent || false,
        urgencyReason: formData.urgencyReason,

        // Status
        status: 'OPEN',
        isActive: false,

        // Observações
        observations: formData.observations,
        socialWorkerNotes: formData.socialWorkerNotes,
        actionPlan: formData.actionPlan
      }
    });

    return attendance;
  }

  async activateEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.socialAssistanceAttendance.update({
      where: { id: entityId },
      data: {
        status: 'IN_PROGRESS',
        isActive: true,
        startedAt: new Date()
      }
    });
  }

  async findByProtocolId(protocolId: string, prisma: PrismaClient): Promise<any | null> {
    return await prisma.socialAssistanceAttendance.findFirst({
      where: { protocolId }
    });
  }

  async updateEntity(
    entityId: string,
    data: Record<string, any>,
    prisma: PrismaClient
  ): Promise<any> {
    return await prisma.socialAssistanceAttendance.update({
      where: { id: entityId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async deleteEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.socialAssistanceAttendance.update({
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

    if (!formData.socialDemand) {
      errors.push('Demanda social é obrigatória');
    }

    if (!formData.familySize || formData.familySize < 1) {
      errors.push('Número de pessoas na família é obrigatório e deve ser maior que zero');
    }

    if (formData.monthlyIncome && formData.monthlyIncome < 0) {
      errors.push('Renda mensal não pode ser negativa');
    }

    // Validações condicionais
    if (formData.hasCadUnico && !formData.cadUnicoNumber) {
      errors.push('Número do CadÚnico é obrigatório quando informado que possui');
    }

    if (formData.hasNIS && !formData.nisNumber) {
      errors.push('Número do NIS é obrigatório quando informado que possui');
    }

    if (formData.needsReferral && !formData.referralType) {
      errors.push('Tipo de encaminhamento é obrigatório');
    }

    if (formData.isUrgent && !formData.urgencyReason) {
      errors.push('Motivo da urgência é obrigatório');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
