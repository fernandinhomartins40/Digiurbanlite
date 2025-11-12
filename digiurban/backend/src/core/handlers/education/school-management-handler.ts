/**
 * ============================================================================
 * HANDLER: GESTÃO ESCOLAR
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { ModuleHandler } from '../../../modules/handlers/registry';

export class SchoolManagementHandler implements ModuleHandler {
  async createEntity(
    protocolId: string,
    formData: Record<string, any>,
    citizenId: string,
    prisma: PrismaClient
  ): Promise<{ id: string; [key: string]: any }> {
    // Buscar cidadão (gestor ou responsável)
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId }
    });

    if (!citizen) {
      throw new Error('Cidadão não encontrado');
    }

    // ✅ REFATORADO - Criar registro sem duplicação
    const management = await prisma.schoolManagement.create({
      data: {
        protocolId,
        citizenId, // ✅ Apenas vincula ao cidadão

        // Tipo de solicitação/gestão
        requestType: formData.requestType || 'GENERAL',
        category: formData.category,
        managementType: formData.managementType || formData.requestType || 'GENERAL',

        // Escola
        schoolId: formData.schoolId,
        schoolName: formData.schoolName,
        schoolType: formData.schoolType,

        // Assunto
        subject: formData.subject,
        description: formData.description,

        // Área de gestão
        managementArea: formData.managementArea, // PEDAGOGIC, ADMINISTRATIVE, FINANCIAL, etc

        // Dados específicos por tipo
        affectedPeople: formData.affectedPeople || 0,
        affectedClasses: formData.affectedClasses || 0,
        estimatedBudget: formData.estimatedBudget || 0,
        proposedSolution: formData.proposedSolution,

        // Recursos necessários
        requiresEquipment: formData.requiresEquipment || false,
        requiredEquipment: formData.requiredEquipment,
        requiresStaff: formData.requiresStaff || false,
        requiredStaffType: formData.requiredStaffType,
        requiresInfrastructure: formData.requiresInfrastructure || false,
        infrastructureDetails: formData.infrastructureDetails,

        // Prioridade e urgência
        priority: formData.priority || 'NORMAL',
        urgencyLevel: formData.urgencyLevel || 'ROUTINE',
        expectedImplementationDate: formData.expectedImplementationDate
          ? new Date(formData.expectedImplementationDate)
          : null,

        // Justificativa
        justification: formData.justification,

        // Aprovações necessárias
        requiresSecretaryApproval: formData.requiresSecretaryApproval || false,
        requiresBudgetApproval: formData.requiresBudgetApproval || false,
        requiresCouncilApproval: formData.requiresCouncilApproval || false,

        // Documentação
        hasAttachments: formData.hasAttachments || false,
        attachments: formData.attachments,

        // Status
        status: 'PENDING_REVIEW',
        isActive: false,

        // Responsável pela análise
        assignedToId: formData.assignedToId,
        assignedToName: formData.assignedToName,

        // Observações
        observations: formData.observations,
        internalNotes: formData.internalNotes
      }
    });

    return management;
  }

  async activateEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.schoolManagement.update({
      where: { id: entityId },
      data: {
        status: 'APPROVED',
        isActive: true,
        approvedAt: new Date()
      }
    });
  }

  async findByProtocolId(protocolId: string, prisma: PrismaClient): Promise<any | null> {
    return await prisma.schoolManagement.findFirst({
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
    return await prisma.schoolManagement.update({
      where: { id: entityId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async deleteEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.schoolManagement.update({
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
    if (!formData.requestType) {
      errors.push('Tipo de solicitação é obrigatório');
    }

    if (!formData.schoolName && !formData.schoolId) {
      errors.push('Escola é obrigatória');
    }

    if (!formData.subject) {
      errors.push('Assunto é obrigatório');
    }

    if (!formData.description) {
      errors.push('Descrição é obrigatória');
    }

    if (!formData.managementArea) {
      errors.push('Área de gestão é obrigatória');
    }

    // Validações condicionais
    if (formData.requiresEquipment && !formData.requiredEquipment) {
      errors.push('Especifique os equipamentos necessários');
    }

    if (formData.requiresStaff && !formData.requiredStaffType) {
      errors.push('Especifique o tipo de pessoal necessário');
    }

    if (formData.requiresInfrastructure && !formData.infrastructureDetails) {
      errors.push('Detalhe as necessidades de infraestrutura');
    }

    if (formData.estimatedBudget && formData.estimatedBudget < 0) {
      errors.push('Orçamento estimado não pode ser negativo');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
