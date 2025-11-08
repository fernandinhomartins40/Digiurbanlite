/**
 * ============================================================================
 * HANDLER: TRANSPORTE DE PACIENTES
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { ModuleHandler } from '../../../modules/handlers/registry';

export class PatientTransportHandler implements ModuleHandler {
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

    // ✅ REFATORADO - Criar registro de transporte sem duplicação
    const transport = await prisma.healthTransport.create({
      data: {
        protocolId,
        citizenId, // ✅ Apenas vincula ao cidadão

        // Campos obrigatórios
        scheduledDate: formData.scheduledDate || formData.transportDate ? new Date(formData.scheduledDate || formData.transportDate) : new Date(),
        origin: formData.origin || formData.originAddress || 'Origem não especificada',
        destination: formData.destination || formData.destinationAddress || formData.destinationName || 'Destino não especificado',

        // Dados do transporte
        transportType: formData.transportType || 'AMBULANCE',
        transportDate: formData.transportDate ? new Date(formData.transportDate) : new Date(),
        transportTime: formData.transportTime || '08:00',

        // Origem e Destino
        originAddress: formData.originAddress,
        originNeighborhood: formData.originNeighborhood,
        originReference: formData.originReference,

        destinationType: formData.destinationType || 'HEALTH_UNIT',
        destinationAddress: formData.destinationAddress,
        destinationName: formData.destinationName,
        destinationCity: formData.destinationCity || 'Cidade atual',

        // Motivo e detalhes médicos
        reason: formData.reason,
        urgencyLevel: formData.urgencyLevel || 'SCHEDULED',
        medicalCondition: formData.medicalCondition,
        requiresOxygen: formData.requiresOxygen || false,
        requiresStretcher: formData.requiresStretcher || false,
        requiresWheelchair: formData.requiresWheelchair || false,

        // Acompanhante
        hasCompanion: formData.hasCompanion || false,
        companionName: formData.companionName,
        companionPhone: formData.companionPhone,

        // Status
        status: 'SCHEDULED',
        isActive: false,

        // Observações
        observations: formData.observations,
        specialInstructions: formData.specialInstructions
      }
    });

    return transport;
  }

  async activateEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.healthTransport.update({
      where: { id: entityId },
      data: {
        status: 'CONFIRMED',
        isActive: true,
        confirmedAt: new Date()
      }
    });
  }

  async findByProtocolId(protocolId: string, prisma: PrismaClient): Promise<any | null> {
    return await prisma.healthTransport.findFirst({
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
    return await prisma.healthTransport.update({
      where: { id: entityId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async deleteEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.healthTransport.update({
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
    if (!formData.transportDate) {
      errors.push('Data do transporte é obrigatória');
    }

    if (!formData.originAddress) {
      errors.push('Endereço de origem é obrigatório');
    }

    if (!formData.destinationAddress) {
      errors.push('Endereço de destino é obrigatório');
    }

    if (!formData.reason) {
      errors.push('Motivo do transporte é obrigatório');
    }

    // Validar data futura para transportes agendados
    if (formData.transportDate && formData.urgencyLevel === 'SCHEDULED') {
      const transportDate = new Date(formData.transportDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (transportDate < today) {
        errors.push('Data do transporte deve ser hoje ou uma data futura');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
