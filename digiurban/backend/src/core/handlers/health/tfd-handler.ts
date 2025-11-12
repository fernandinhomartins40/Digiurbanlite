/**
 * ============================================================================
 * HANDLER: ENCAMINHAMENTOS TFD (Tratamento Fora do Domicílio)
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { ModuleHandler } from '../../../modules/handlers/registry';

export class TFDHandler implements ModuleHandler {
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

    // ✅ REFATORADO - Criar registro de TFD sem duplicação
    const tfd = await prisma.healthTransportRequest.create({
      data: {
        protocolId,
        citizenId, // ✅ Apenas vincula ao cidadão

        // Campos obrigatórios
        origin: formData.origin || formData.referringUnit || 'Origem não especificada',
        destination: formData.destination || formData.destinationHospital || formData.destinationCity || 'Destino não especificado',
        transportType: formData.transportType || 'TFD',
        reason: formData.reason || formData.medicalJustification || 'Tratamento Fora do Domicílio',

        // Dados do encaminhamento
        requestType: formData.requestType || 'TFD',
        specialty: formData.specialty,
        referringDoctor: formData.referringDoctor,
        referringUnit: formData.referringUnit,
        destinationCity: formData.destinationCity,
        destinationState: formData.destinationState,
        destinationHospital: formData.destinationHospital,

        // Detalhes médicos
        diagnosis: formData.diagnosis,
        medicalJustification: formData.medicalJustification,
        urgencyLevel: formData.urgencyLevel || 'NORMAL',

        // Documentação
        hasMedicalReport: formData.hasMedicalReport || false,
        hasExams: formData.hasExams || false,
        hasReferral: formData.hasReferral || true,

        // Acompanhante
        needsCompanion: formData.needsCompanion || false,
        companionName: formData.companionName,
        companionCpf: formData.companionCpf,
        companionRelationship: formData.companionRelationship,

        // Data prevista
        expectedDate: formData.expectedDate ? new Date(formData.expectedDate) : null,

        // Status
        status: 'REQUESTED',
        isActive: false,

        // Observações
        observations: formData.observations
      }
    });

    return tfd;
  }

  async activateEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.healthTransportRequest.update({
      where: { id: entityId },
      data: {
        status: 'APPROVED',
        isActive: true,
        approvedAt: new Date()
      }
    });
  }

  async findByProtocolId(protocolId: string, prisma: PrismaClient): Promise<any | null> {
    return await prisma.healthTransportRequest.findFirst({
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
    return await prisma.healthTransportRequest.update({
      where: { id: entityId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async deleteEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.healthTransportRequest.update({
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
    if (!formData.specialty) {
      errors.push('Especialidade é obrigatória');
    }

    if (!formData.destinationCity) {
      errors.push('Cidade de destino é obrigatória');
    }

    if (!formData.destinationState) {
      errors.push('Estado de destino é obrigatório');
    }

    if (!formData.diagnosis) {
      errors.push('Diagnóstico é obrigatório');
    }

    if (!formData.medicalJustification) {
      errors.push('Justificativa médica é obrigatória');
    }

    if (formData.needsCompanion && !formData.companionName) {
      errors.push('Nome do acompanhante é obrigatório quando necessário');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
