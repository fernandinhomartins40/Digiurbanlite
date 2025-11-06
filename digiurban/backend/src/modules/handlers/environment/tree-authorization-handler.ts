// ============================================================
// ENVIRONMENT HANDLER - Autorização de Poda/Supressão de Árvores
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';
type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class TreeAuthorizationHandler extends BaseModuleHandler {
  moduleType = 'environment';
  entityName = 'TreeAuthorization';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol, serviceId } = action;

    if (action.action === 'create') {
      return this.createAuthorization(data, protocol, serviceId, tx);
    }

    if (action.action === 'update') {
      return this.updateAuthorization(data, tx);
    }

    if (action.action === 'approve') {
      return this.approveAuthorization(data, tx);
    }

    if (action.action === 'schedule_inspection') {
      return this.scheduleInspection(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createAuthorization(
    data: any,
    protocol: string,
    serviceId: string,
    tx: PrismaTransaction
  ) {
    // Criar autorização de árvore pendente
    const authorization = await tx.treeAuthorization.create({
      data: {
                applicantName: data.applicantName,
        applicantCpf: data.applicantCpf,
        applicantPhone: data.applicantPhone,
        authorizationType: data.authorizationType,
        reason: data.reason,
        location: data.location,
        coordinates: data.coordinates || null,
        photos: data.photos || null,
        treeCount: data.treeCount ? parseInt(data.treeCount) : 1,
        treeSpecies: data.treeSpecies || null,
        treeData: data.treeData || null,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service'
      }
    });

    return { authorization };
  }

  private async updateAuthorization(data: any, tx: PrismaTransaction) {
    const { authorizationId, ...updateData } = data;

    const authorization = await tx.treeAuthorization.update({
      where: { id: authorizationId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return { authorization };
  }

  private async scheduleInspection(data: any, tx: PrismaTransaction) {
    const { authorizationId, inspectionDate, inspectorId } = data;

    const authorization = await tx.treeAuthorization.update({
      where: { id: authorizationId },
      data: {
        status: 'inspected',
        inspectionDate: new Date(inspectionDate),
        inspectorId
      }
    });

    return { authorization };
  }

  private async approveAuthorization(data: any, tx: PrismaTransaction) {
    const {
      authorizationId,
      requiresCompensation,
      compensationPlan,
      approvedBy
    } = data;

    const authorization = await tx.treeAuthorization.update({
      where: { id: authorizationId },
      data: {
        status: 'approved',
        requiresCompensation: requiresCompensation || false,
        compensationPlan: compensationPlan || null,
        approvedBy,
        approvedAt: new Date()
      }
    });

    return { authorization };
  }
}
