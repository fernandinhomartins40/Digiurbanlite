// ============================================================
// URBAN PLANNING HANDLER - Aprovação de Projeto Arquitetônico
// FASE 3: Planejamento Urbano
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class ProjectApprovalHandler extends BaseModuleHandler {
  moduleType = 'APROVACAO_PROJETO';
  entityName = 'ProjectApproval';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol } = action;

    if (action.action === 'create') {
      return this.createProjectApproval(data, protocol, tx);
    }

    if (action.action === 'approve') {
      return this.approveProject(data, tx);
    }

    if (action.action === 'reject') {
      return this.rejectProject(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createProjectApproval(
    data: any,
    protocol: string,
    tx: PrismaTransaction
  ) {
    const requiredFields = [
      'ownerName', 'ownerCpf', 'ownerPhone',
      'propertyAddress', 'neighborhood',
      'projectType', 'constructionArea', 'totalArea', 'floors',
      'architectName', 'architectCau', 'architectPhone'
    ];

    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
    }

    const projectApproval = await tx.projectApproval.create({
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
        projectCategory: data.projectCategory || 'NEW',
        constructionArea: parseFloat(data.constructionArea),
        totalArea: parseFloat(data.totalArea),
        floors: parseInt(data.floors),
        units: data.units ? parseInt(data.units) : null,
        architectName: data.architectName,
        architectCau: data.architectCau,
        architectPhone: data.architectPhone,
        rrtNumber: data.rrtNumber || null,
        observations: data.observations || null,
        status: 'ANALYSIS',
        analysisStartedAt: new Date(),
        isActive: true,
      },
    });

    return { projectApproval };
  }

  private async approveProject(data: any, tx: PrismaTransaction) {
    const { projectId, technicalOpinion } = data;

    const project = await tx.projectApproval.update({
      where: { id: projectId },
      data: {
        status: 'APPROVED',
        technicalOpinion,
        approvedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { project };
  }

  private async rejectProject(data: any, tx: PrismaTransaction) {
    const { projectId, rejectionReason } = data;

    const project = await tx.projectApproval.update({
      where: { id: projectId },
      data: {
        status: 'REJECTED',
        rejectionReason,
        rejectedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { project };
  }

  async list(tx: PrismaTransaction, filters?: any): Promise<any> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (filters?.status) where.status = filters.status;
    if (filters?.ownerCpf) where.ownerCpf = filters.ownerCpf;

    const [items, total] = await Promise.all([
      tx.projectApproval.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      tx.projectApproval.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
}
