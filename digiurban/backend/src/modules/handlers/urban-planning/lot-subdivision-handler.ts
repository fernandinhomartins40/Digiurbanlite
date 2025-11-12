// ============================================================
// URBAN PLANNING HANDLER - Desmembramento de Lotes
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';
type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class LotSubdivisionHandler extends BaseModuleHandler {
  moduleType = 'urban_planning';
  entityName = 'LotSubdivision';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol, serviceId } = action;

    if (action.action === 'create') {
      return this.createSubdivision(data, protocol, serviceId, tx);
    }

    if (action.action === 'review') {
      return this.reviewSubdivision(data, tx);
    }

    if (action.action === 'approve') {
      return this.approveSubdivision(data, tx);
    }

    if (action.action === 'register') {
      return this.registerSubdivision(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createSubdivision(
    data: any,
    protocol: string,
    serviceId: string,
    tx: PrismaTransaction
  ) {
    const subdivision = await tx.lotSubdivision.create({
      data: {
                ownerName: data.ownerName,
        ownerCpf: data.ownerCpf,
        ownerPhone: data.ownerPhone,
        ownerEmail: data.ownerEmail || null,
        originalAddress: data.originalAddress,
        originalLotNumber: data.originalLotNumber || null,
        originalBlockNumber: data.originalBlockNumber || null,
        originalArea: parseFloat(data.originalArea),
        cadastralNumber: data.cadastralNumber || null,
        newLotsCount: parseInt(data.newLotsCount),
        newLotsData: data.newLotsData,
        surveyorName: data.surveyorName || null,
        surveyorCrea: data.surveyorCrea || null,
        documents: data.documents || null,
        surveyPlans: data.surveyPlans || null,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service'
      }
    });

    return { subdivision };
  }

  private async reviewSubdivision(data: any, tx: PrismaTransaction) {
    const {
      subdivisionId,
      technicalAnalysis,
      meetsRequirements,
      observations,
      reviewedBy
    } = data;

    const subdivision = await tx.lotSubdivision.update({
      where: { id: subdivisionId },
      data: {
        status: 'under_review',
        technicalAnalysis: technicalAnalysis || null,
        meetsRequirements: meetsRequirements || false,
        observations: observations || null,
        reviewedBy,
        reviewedAt: new Date()
      }
    });

    return { subdivision };
  }

  private async approveSubdivision(data: any, tx: PrismaTransaction) {
    const { subdivisionId, approvalNumber, approvedBy } = data;

    const subdivision = await tx.lotSubdivision.update({
      where: { id: subdivisionId },
      data: {
        status: 'approved',
        approvalNumber,
        approvedDate: new Date(),
        approvedBy
      }
    });

    return { subdivision };
  }

  private async registerSubdivision(data: any, tx: PrismaTransaction) {
    const { subdivisionId, registryNumber, registryDate } = data;

    const subdivision = await tx.lotSubdivision.update({
      where: { id: subdivisionId },
      data: {
        status: 'registered',
        registryNumber,
        registryDate: new Date(registryDate)
      }
    });

    return { subdivision };
  }
}
