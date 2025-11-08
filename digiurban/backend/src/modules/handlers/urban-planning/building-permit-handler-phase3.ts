// ============================================================
// URBAN PLANNING HANDLER - Alvará de Construção
// FASE 3: Planejamento Urbano
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class BuildingPermitHandlerPhase3 extends BaseModuleHandler {
  moduleType = 'ALVARA_CONSTRUCAO';
  entityName = 'BuildingPermit';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol } = action;

    if (action.action === 'create') {
      return this.createBuildingPermit(data, protocol, tx);
    }

    if (action.action === 'approve') {
      return this.approvePermit(data, tx);
    }

    if (action.action === 'issue') {
      return this.issuePermit(data, tx);
    }

    if (action.action === 'reject') {
      return this.rejectPermit(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createBuildingPermit(
    data: any,
    protocol: string,
    tx: PrismaTransaction
  ) {
    const requiredFields = [
      'ownerName', 'ownerCpf', 'ownerPhone',
      'propertyAddress', 'neighborhood',
      'projectType', 'constructionArea', 'totalArea', 'floors',
      'engineerName', 'engineerCrea', 'engineerPhone'
    ];

    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
    }

    const buildingPermit = await tx.buildingPermit.create({
      data: {
        protocolId: protocol,
        ownerName: data.ownerName,
        ownerCpf: data.ownerCpf,
        ownerPhone: data.ownerPhone,
        ownerEmail: data.ownerEmail || null,
        propertyAddress: data.propertyAddress,
        propertyNumber: data.propertyNumber || null,
        neighborhood: data.neighborhood,
        lotNumber: data.lotNumber || null,
        block: data.block || null,
        subdivision: data.subdivision || null,
        registryNumber: data.registryNumber || null,
        projectType: data.projectType,
        constructionArea: parseFloat(data.constructionArea),
        totalArea: parseFloat(data.totalArea),
        floors: parseInt(data.floors),
        rooms: data.rooms ? parseInt(data.rooms) : null,
        parking: data.parking ? parseInt(data.parking) : null,
        engineerName: data.engineerName,
        engineerCrea: data.engineerCrea,
        engineerPhone: data.engineerPhone,
        artNumber: data.artNumber || null,
        projectApprovalId: data.projectApprovalId || null,
        observations: data.observations || null,
        status: 'ANALYSIS',
        analysisStartedAt: new Date(),
        isActive: true,
      },
    });

    return { buildingPermit };
  }

  private async approvePermit(data: any, tx: PrismaTransaction) {
    const { permitId } = data;

    const permit = await tx.buildingPermit.update({
      where: { id: permitId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { permit };
  }

  private async issuePermit(data: any, tx: PrismaTransaction) {
    const { permitId, validityMonths = 24 } = data;

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + validityMonths);

    const permit = await tx.buildingPermit.update({
      where: { id: permitId },
      data: {
        status: 'ISSUED',
        issuedAt: new Date(),
        expiresAt,
        updatedAt: new Date(),
      },
    });

    return { permit };
  }

  private async rejectPermit(data: any, tx: PrismaTransaction) {
    const { permitId, rejectionReason } = data;

    const permit = await tx.buildingPermit.update({
      where: { id: permitId },
      data: {
        status: 'REJECTED',
        rejectionReason,
        updatedAt: new Date(),
      },
    });

    return { permit };
  }

  async list(tx: PrismaTransaction, filters?: any): Promise<any> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (filters?.status) where.status = filters.status;
    if (filters?.ownerCpf) where.ownerCpf = filters.ownerCpf;

    const [items, total] = await Promise.all([
      tx.buildingPermit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          projectApproval: true,
        },
      }),
      tx.buildingPermit.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
}
