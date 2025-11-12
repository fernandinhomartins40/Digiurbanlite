/**
 * ============================================================================
 * HANDLER: GESTÃO DE CRAS/CREAS (Equipamentos SUAS)
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { ModuleHandler } from '../../../modules/handlers/registry';

export class SocialEquipmentHandler implements ModuleHandler {
  async createEntity(
    protocolId: string,
    formData: Record<string, any>,
    citizenId: string,
    prisma: PrismaClient
  ): Promise<{ id: string; [key: string]: any }> {
    // Buscar cidadão (geralmente coordenador ou gestor)
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId }
    });

    if (!citizen) {
      throw new Error('Cidadão não encontrado');
    }

    // Criar registro de equipamento SUAS
    const equipment = await prisma.socialEquipment.create({
      data: {
        protocolId,
        citizenId,

        // Tipo de equipamento
        equipmentType: formData.equipmentType || 'CRAS',

        // Dados básicos
        equipmentName: formData.equipmentName || formData.name || '',
        code: formData.code,
        cnpj: formData.cnpj,

        // Endereço
        address: formData.address,
        addressNumber: formData.addressNumber,
        addressComplement: formData.addressComplement,
        neighborhood: formData.neighborhood,
        city: formData.city || 'Cidade atual',
        state: formData.state || 'Estado atual',
        zipCode: formData.zipCode,
        coordinates: formData.coordinates, // { lat, lng }

        // Contato
        phone: formData.phone,
        email: formData.email,
        website: formData.website,

        // Horário de funcionamento
        operatingHours: formData.operatingHours, // Objeto JSON
        operatingDays: formData.operatingDays || 'SEG_A_SEX',

        // Capacidade
        capacity: formData.capacity || 0,
        currentOccupancy: formData.currentOccupancy || 0,
        maxMonthlyAttendances: formData.maxMonthlyAttendances || 0,

        // Área de cobertura
        coverageArea: formData.coverageArea, // Array de bairros
        coveragePopulation: formData.coveragePopulation || 0,
        referenceFamilies: formData.referenceFamilies || 0,

        // Coordenação
        coordinatorId: formData.coordinatorId || citizenId,
        coordinatorName: formData.coordinatorName || citizen.name,
        coordinatorPhone: formData.coordinatorPhone || citizen.phone,
        coordinatorEmail: formData.coordinatorEmail || citizen.email,

        // Equipe
        socialWorkers: formData.socialWorkers || 0,
        psychologists: formData.psychologists || 0,
        educators: formData.educators || 0,
        supportStaff: formData.supportStaff || 0,
        totalStaff: formData.totalStaff || 0,

        // Serviços oferecidos
        offeredServices: formData.offeredServices, // Array
        programs: formData.programs, // Array
        groups: formData.groups, // Array

        // Infraestrutura
        hasAccessibility: formData.hasAccessibility || false,
        accessibilityFeatures: formData.accessibilityFeatures, // Array
        rooms: formData.rooms || 0,
        computerLab: formData.computerLab || false,
        kitchen: formData.kitchen || false,
        playground: formData.playground || false,
        sportsArea: formData.sportsArea || false,

        // Transporte
        hasVehicle: formData.hasVehicle || false,
        vehicleType: formData.vehicleType,
        vehiclePlate: formData.vehiclePlate,

        // Documentação
        municipalDecree: formData.municipalDecree,
        creationDate: formData.creationDate ? new Date(formData.creationDate) : null,
        lastInspectionDate: formData.lastInspectionDate ? new Date(formData.lastInspectionDate) : null,

        // Status
        status: 'PENDING_APPROVAL',
        isActive: false,
        operationStatus: formData.operationStatus || 'OPERATIONAL',

        // Observações
        observations: formData.observations,
        internalNotes: formData.internalNotes
      }
    });

    return equipment;
  }

  async activateEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.socialEquipment.update({
      where: { id: entityId },
      data: {
        status: 'ACTIVE',
        isActive: true,
        operationStatus: 'OPERATIONAL',
        approvedAt: new Date()
      }
    });
  }

  async findByProtocolId(protocolId: string, prisma: PrismaClient): Promise<any | null> {
    return await prisma.socialEquipment.findFirst({
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
    return await prisma.socialEquipment.update({
      where: { id: entityId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async deleteEntity(entityId: string, prisma: PrismaClient): Promise<void> {
    await prisma.socialEquipment.update({
      where: { id: entityId },
      data: {
        isActive: false,
        status: 'INACTIVE',
        operationStatus: 'CLOSED'
      }
    });
  }

  validateFormData(formData: Record<string, any>): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Validações obrigatórias
    if (!formData.equipmentType) {
      errors.push('Tipo de equipamento (CRAS/CREAS) é obrigatório');
    }

    if (!formData.name) {
      errors.push('Nome do equipamento é obrigatório');
    }

    if (!formData.address) {
      errors.push('Endereço é obrigatório');
    }

    if (!formData.neighborhood) {
      errors.push('Bairro é obrigatório');
    }

    if (!formData.phone) {
      errors.push('Telefone é obrigatório');
    }

    if (!formData.coordinatorName) {
      errors.push('Nome do coordenador é obrigatório');
    }

    // Validações condicionais
    if (formData.cnpj && !/^\d{14}$/.test(formData.cnpj)) {
      errors.push('CNPJ deve conter 14 dígitos');
    }

    if (formData.capacity && formData.capacity < 0) {
      errors.push('Capacidade não pode ser negativa');
    }

    if (formData.currentOccupancy && formData.capacity && formData.currentOccupancy > formData.capacity) {
      errors.push('Ocupação atual não pode ser maior que a capacidade');
    }

    if (formData.totalStaff !== undefined) {
      const calculatedTotal = (formData.socialWorkers || 0) +
                             (formData.psychologists || 0) +
                             (formData.educators || 0) +
                             (formData.supportStaff || 0);

      if (formData.totalStaff !== calculatedTotal) {
        errors.push('Total de funcionários deve ser igual à soma das categorias');
      }
    }

    if (formData.hasVehicle && !formData.vehicleType) {
      errors.push('Tipo de veículo é obrigatório quando informado que possui');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
