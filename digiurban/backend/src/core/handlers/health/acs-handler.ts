/**
 * ============================================================================
 * HANDLER: GESTÃO DE ACS (Agentes Comunitários de Saúde)
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { ModuleHandler } from '../../../modules/handlers/registry';

export class ACSHandler implements ModuleHandler {
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

    // Verificar se já existe cadastro de ACS para este cidadão
    const existingACS = await prisma.communityHealthAgent.findFirst({
      where: { citizenId }
    });

    if (existingACS) {
      throw new Error('Cidadão já possui cadastro como Agente Comunitário de Saúde');
    }

    // ✅ REFATORADO - Criar cadastro de ACS sem duplicação
    const acs = await prisma.communityHealthAgent.create({
      data: {
        protocolId,
        citizenId, // ✅ Apenas vincula ao cidadão

        // Campos obrigatórios
        hireDate: formData.hireDate || formData.hiringDate ? new Date(formData.hireDate || formData.hiringDate) : new Date(),
        assignedArea: formData.assignedArea || formData.coverageArea || 'Área não especificada',

        // Dados profissionais
        registrationNumber: formData.registrationNumber,
        contractType: formData.contractType || 'CLT',

        // Unidade de Saúde
        healthUnitId: formData.healthUnitId,
        healthUnitName: formData.healthUnitName,

        // Área de atuação
        neighborhoods: formData.neighborhoods, // Array de bairros
        microarea: formData.microarea,
        estimatedFamilies: formData.estimatedFamilies || 0,
        estimatedPeople: formData.estimatedPeople || 0,

        // Formação e capacitação
        education: formData.education || 'ENSINO_MEDIO',
        hasCourseCompletion: formData.hasCourseCompletion || false,
        courseCompletionDate: formData.courseCompletionDate ? new Date(formData.courseCompletionDate) : null,
        additionalTraining: formData.additionalTraining,

        // Dados de trabalho
        workSchedule: formData.workSchedule,
        weeklyHours: formData.weeklyHours || 40,
        workDays: formData.workDays,

        // Equipamentos
        hasTablet: formData.hasTablet || false,
        hasUniform: formData.hasUniform || false,
        hasBag: formData.hasBag || false,
        hasIdentificationCard: formData.hasIdentificationCard || false,

        // Supervisor
        supervisorId: formData.supervisorId,
        supervisorName: formData.supervisorName,

        // Status
        status: 'PENDING_APPROVAL',
        isActive: false,

        // Observações
        observations: formData.observations
      }
    });

    return acs;
  }

  async activateEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.communityHealthAgent.update({
      where: { id: entityId },
      data: {
        status: 'ACTIVE',
        isActive: true,
        approvedAt: new Date()
      }
    });
  }

  async findByProtocolId(protocolId: string, prisma: PrismaClient): Promise<any | null> {
    return await prisma.communityHealthAgent.findFirst({
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
    return await prisma.communityHealthAgent.update({
      where: { id: entityId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async deleteEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.communityHealthAgent.update({
      where: { id: entityId },
      data: {
        isActive: false,
        status: 'INACTIVE',
        terminationDate: new Date()
      }
    });
  }

  validateFormData(formData: Record<string, any>): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Validações obrigatórias
    if (!formData.registrationNumber) {
      errors.push('Número de registro/matrícula é obrigatório');
    }

    if (!formData.healthUnitId && !formData.healthUnitName) {
      errors.push('Unidade de Saúde é obrigatória');
    }

    if (!formData.coverageArea) {
      errors.push('Área de cobertura é obrigatória');
    }

    if (!formData.microarea) {
      errors.push('Microárea é obrigatória');
    }

    if (!formData.contractType) {
      errors.push('Tipo de contrato é obrigatório');
    }

    if (!formData.education) {
      errors.push('Escolaridade é obrigatória');
    }

    // Validar data de contratação
    if (formData.hiringDate) {
      const hiringDate = new Date(formData.hiringDate);
      const today = new Date();

      if (hiringDate > today) {
        errors.push('Data de contratação não pode ser futura');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
