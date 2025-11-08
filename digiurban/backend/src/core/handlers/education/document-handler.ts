/**
 * ============================================================================
 * HANDLER: SOLICITAÇÃO DE DOCUMENTO ESCOLAR
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { ModuleHandler } from '../../../modules/handlers/registry';

export class SchoolDocumentHandler implements ModuleHandler {
  async createEntity(
    protocolId: string,
    formData: Record<string, any>,
    citizenId: string,
    prisma: PrismaClient
  ): Promise<{ id: string; [key: string]: any }> {
    // Buscar cidadão (solicitante)
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId }
    });

    if (!citizen) {
      throw new Error('Cidadão não encontrado');
    }

    // ✅ REFATORADO - Criar solicitação sem duplicação
    const document = await prisma.schoolDocument.create({
      data: {
        protocolId,
        citizenId, // ✅ Apenas vincula ao cidadão

        // Dados do estudante
        studentName: formData.studentName,
        studentCpf: formData.studentCpf,
        studentBirthDate: formData.studentBirthDate ? new Date(formData.studentBirthDate) : null,
        relationshipToStudent: formData.relationshipToStudent,

        // Escola
        schoolId: formData.schoolId,
        schoolName: formData.schoolName,
        lastGrade: formData.lastGrade,
        lastYear: formData.lastYear,

        // Tipo de documento
        documentType: formData.documentType || 'CERTIFICATE',
        documentSubtype: formData.documentSubtype,

        // Quantidade
        copies: formData.copies || 1,

        // Finalidade
        purpose: formData.purpose,
        purposeDetails: formData.purposeDetails,

        // Período/anos solicitados
        requestedYears: formData.requestedYears, // Array de anos
        requestedPeriods: formData.requestedPeriods, // Array de períodos

        // Entrega
        deliveryMethod: formData.deliveryMethod || 'PICKUP',
        deliveryAddress: formData.deliveryAddress,
        pickupPersonName: formData.pickupPersonName,
        pickupPersonCpf: formData.pickupPersonCpf,
        pickupPersonRelationship: formData.pickupPersonRelationship,

        // Urgência
        isUrgent: formData.isUrgent || false,
        urgencyReason: formData.urgencyReason,
        expectedDeliveryDate: formData.expectedDeliveryDate ? new Date(formData.expectedDeliveryDate) : null,

        // Taxa
        hasFee: formData.hasFee || false,
        feeAmount: formData.feeAmount || 0,
        feeStatus: formData.hasFee ? 'PENDING' : 'NOT_APPLICABLE',

        // Status
        status: 'PENDING',
        isActive: false,

        // Observações
        observations: formData.observations,
        internalNotes: formData.internalNotes
      }
    });

    return document;
  }

  async activateEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.schoolDocument.update({
      where: { id: entityId },
      data: {
        status: 'IN_PREPARATION',
        isActive: true,
        approvedAt: new Date()
      }
    });
  }

  async findByProtocolId(protocolId: string, prisma: PrismaClient): Promise<any | null> {
    return await prisma.schoolDocument.findFirst({
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
    return await prisma.schoolDocument.update({
      where: { id: entityId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async deleteEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.schoolDocument.update({
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

    if (!formData.relationshipToStudent) {
      errors.push('Parentesco com o estudante é obrigatório');
    }

    if (!formData.schoolName && !formData.schoolId) {
      errors.push('Escola é obrigatória');
    }

    if (!formData.documentType) {
      errors.push('Tipo de documento é obrigatório');
    }

    if (!formData.purpose) {
      errors.push('Finalidade do documento é obrigatória');
    }

    if (!formData.deliveryMethod) {
      errors.push('Método de entrega é obrigatório');
    }

    // Validações condicionais
    if (formData.deliveryMethod === 'PICKUP' && formData.pickupPersonName && !formData.pickupPersonCpf) {
      errors.push('CPF da pessoa que vai retirar é obrigatório');
    }

    if (formData.deliveryMethod === 'MAIL' && !formData.deliveryAddress) {
      errors.push('Endereço de entrega é obrigatório para envio por correio');
    }

    if (formData.isUrgent && !formData.urgencyReason) {
      errors.push('Motivo da urgência é obrigatório');
    }

    if (formData.copies && (formData.copies < 1 || formData.copies > 10)) {
      errors.push('Número de cópias deve estar entre 1 e 10');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
