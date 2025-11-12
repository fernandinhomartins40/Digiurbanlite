/**
 * ============================================================================
 * HANDLER: CADASTRO DE PACIENTE
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { ModuleHandler } from '../../../modules/handlers/registry';

export class PatientRegistrationHandler implements ModuleHandler {
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

    // Verificar se já existe cadastro de paciente
    const existingPatient = await prisma.patient.findFirst({
      where: { citizenId }
    });

    if (existingPatient) {
      throw new Error('Cidadão já possui cadastro de paciente');
    }

    // ✅ REFATORADO - Criar cadastro de paciente sem duplicações
    const patient = await prisma.patient.create({
      data: {
        protocolId,
        citizenId, // ✅ Apenas vincula ao cidadão

        // ✅ Dados do cidadão vêm da relação citizen.*
        registeredBy: formData.registeredBy || citizenId,

        // Cartão SUS (específico de saúde)
        susCardNumber: formData.susCardNumber,

        // Contato de emergência (específico do cadastro de paciente)
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        emergencyContactRelationship: formData.emergencyContactRelationship,

        // Dados de saúde específicos
        bloodType: formData.bloodType,
        allergies: formData.allergies,
        chronicDiseases: formData.chronicDiseases,
        currentMedications: formData.currentMedications,
        previousSurgeries: formData.previousSurgeries,

        // Unidade de saúde preferencial
        preferredHealthUnitId: formData.preferredHealthUnitId,

        // Grupos de risco
        isPregnant: formData.isPregnant || false,
        isDiabetic: formData.isDiabetic || false,
        isHypertensive: formData.isHypertensive || false,
        hasHeartDisease: formData.hasHeartDisease || false,
        hasRespiratoryDisease: formData.hasRespiratoryDisease || false,

        // Status
        status: 'PENDING_APPROVAL',
        isActive: false,

        // Observações
        observations: formData.observations
      }
    });

    return patient;
  }

  async activateEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.patient.update({
      where: { id: entityId },
      data: {
        status: 'ACTIVE',
        isActive: true,
        approvedAt: new Date()
      }
    });
  }

  async findByProtocolId(protocolId: string, prisma: PrismaClient): Promise<any | null> {
    return await prisma.patient.findFirst({
      where: { protocolId },
      include: {
        protocol: true,
        citizen: true // ✅ Incluir dados do cidadão
      }
    });
  }

  async updateEntity(
    entityId: string,
    data: Record<string, any>,
    prisma: PrismaClient
  ): Promise<any> {
    return await prisma.patient.update({
      where: { id: entityId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async deleteEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.patient.update({
      where: { id: entityId },
      data: {
        isActive: false,
        status: 'INACTIVE'
      }
    });
  }

  validateFormData(formData: Record<string, any>): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // ✅ Validações específicas do cadastro de paciente (não dados do cidadão)
    if (!formData.susCardNumber) {
      errors.push('Número do Cartão SUS é obrigatório');
    }

    if (!formData.emergencyContactName || !formData.emergencyContactPhone) {
      errors.push('Contato de emergência é obrigatório');
    }

    // Validar formato do Cartão SUS (15 dígitos)
    if (formData.susCardNumber && !/^\d{15}$/.test(formData.susCardNumber)) {
      errors.push('Cartão SUS deve conter 15 dígitos');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
