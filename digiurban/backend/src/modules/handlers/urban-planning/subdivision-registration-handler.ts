// ============================================================
// URBAN PLANNING HANDLER - Cadastro de Loteamento
// FASE 3: Planejamento Urbano
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class SubdivisionRegistrationHandler extends BaseModuleHandler {
  moduleType = 'CADASTRO_LOTEAMENTO';
  entityName = 'SubdivisionRegistration';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol } = action;

    if (action.action === 'create') {
      return this.createSubdivision(data, protocol, tx);
    }

    if (action.action === 'approve') {
      return this.approveSubdivision(data, tx);
    }

    if (action.action === 'update') {
      return this.updateSubdivision(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createSubdivision(
    data: any,
    protocol: string,
    tx: PrismaTransaction
  ) {
    const requiredFields = [
      'subdivisionName', 'ownerName', 'phone',
      'location', 'neighborhood', 'totalArea', 'totalLots',
      'engineerName', 'engineerCrea'
    ];

    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
    }

    if (!data.ownerCpf && !data.ownerCnpj) {
      throw new Error('CPF ou CNPJ do proprietário é obrigatório');
    }

    const subdivision = await tx.subdivisionRegistration.create({
      data: {
        protocolId: protocol,
        subdivisionName: data.subdivisionName,
        ownerName: data.ownerName,
        ownerCpf: data.ownerCpf || null,
        ownerCnpj: data.ownerCnpj || null,
        phone: data.phone,
        email: data.email || null,
        location: data.location,
        neighborhood: data.neighborhood,
        totalArea: parseFloat(data.totalArea),
        totalLots: parseInt(data.totalLots),
        publicAreaPercent: data.publicAreaPercent ? parseFloat(data.publicAreaPercent) : null,
        greenAreaPercent: data.greenAreaPercent ? parseFloat(data.greenAreaPercent) : null,
        hasInfrastructure: data.hasInfrastructure || false,
        hasPavement: data.hasPavement || false,
        hasWater: data.hasWater || false,
        hasSewage: data.hasSewage || false,
        hasElectricity: data.hasElectricity || false,
        engineerName: data.engineerName,
        engineerCrea: data.engineerCrea,
        artNumber: data.artNumber || null,
        observations: data.observations || null,
        status: 'ANALYSIS',
        isActive: true,
      },
    });

    return { subdivision };
  }

  private async approveSubdivision(data: any, tx: PrismaTransaction) {
    const { subdivisionId, registrationNumber } = data;

    const subdivision = await tx.subdivisionRegistration.update({
      where: { id: subdivisionId },
      data: {
        status: 'APPROVED',
        approvalDate: new Date(),
        registrationNumber: registrationNumber || `LOT-${Date.now()}`,
        updatedAt: new Date(),
      },
    });

    return { subdivision };
  }

  private async updateSubdivision(data: any, tx: PrismaTransaction) {
    const { subdivisionId, ...updateData } = data;

    const subdivision = await tx.subdivisionRegistration.update({
      where: { id: subdivisionId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return { subdivision };
  }

  async list(tx: PrismaTransaction, filters?: any): Promise<any> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (filters?.status) where.status = filters.status;
    if (filters?.neighborhood) where.neighborhood = filters.neighborhood;

    const [items, total] = await Promise.all([
      tx.subdivisionRegistration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      tx.subdivisionRegistration.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
}
