// ============================================================
// URBAN PLANNING HANDLER - Alvarás de Construção
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';
type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class BuildingPermitHandler extends BaseModuleHandler {
  moduleType = 'urban_planning';
  entityName = 'BuildingPermit';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol, serviceId } = action;

    if (action.action === 'create') {
      return this.createPermit(data, protocol, serviceId, tx);
    }

    if (action.action === 'review') {
      return this.reviewPermit(data, tx);
    }

    if (action.action === 'approve') {
      return this.approvePermit(data, tx);
    }

    if (action.action === 'reject') {
      return this.rejectPermit(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createPermit(
    data: any,
    protocol: string,
    serviceId: string,
    tx: PrismaTransaction
  ) {
    const permit = await tx.buildingPermit.create({
      data: {
                applicantName: data.applicantName,
        applicantCpf: data.applicantCpf,
        applicantPhone: data.applicantPhone,
        applicantEmail: data.applicantEmail || null,
        permitType: data.permitType,
        constructionType: data.constructionType,
        propertyAddress: data.propertyAddress,
        propertyNumber: data.propertyNumber || null,
        neighborhood: data.neighborhood,
        lotNumber: data.lotNumber || null,
        blockNumber: data.blockNumber || null,
        totalArea: parseFloat(data.totalArea),
        builtArea: parseFloat(data.builtArea),
        floors: parseInt(data.floors) || 1,
        projectValue: data.projectValue ? parseFloat(data.projectValue) : null,
        documents: data.documents || null,
        status: 'pending'
      }
    });

    return { permit };
  }

  private async reviewPermit(data: any, tx: PrismaTransaction) {
    const { permitId, technicalAnalysis, requirements, observations, reviewedBy } = data;

    const permit = await tx.buildingPermit.update({
      where: { id: permitId },
      data: {
        status: 'under_review',
        technicalAnalysis: technicalAnalysis || null,
        requirements: requirements || null,
        observations: observations || null,
        reviewedBy,
        reviewedAt: new Date()
      }
    });

    return { permit };
  }

  private async approvePermit(data: any, tx: PrismaTransaction) {
    const { permitId, permitNumber, issuedDate, validUntil, approvedBy } = data;

    const permit = await tx.buildingPermit.update({
      where: { id: permitId },
      data: {
        status: 'approved',
        permitNumber,
        issuedDate: new Date(issuedDate),
        validUntil: new Date(validUntil),
        approvedBy,
        approvedAt: new Date()
      }
    });

    return { permit };
  }

  private async rejectPermit(data: any, tx: PrismaTransaction) {
    const { permitId, observations, reviewedBy } = data;

    const permit = await tx.buildingPermit.update({
      where: { id: permitId },
      data: {
        status: 'rejected',
        observations: observations || null,
        reviewedBy,
        reviewedAt: new Date()
      }
    });

    return { permit };
  }
}
