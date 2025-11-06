// ============================================================
// URBAN PLANNING HANDLER - Numeração de Imóveis
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';
type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class PropertyNumberingHandler extends BaseModuleHandler {
  moduleType = 'urban_planning';
  entityName = 'PropertyNumbering';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol, serviceId } = action;

    if (action.action === 'create') {
      return this.createNumbering(data, protocol, serviceId, tx);
    }

    if (action.action === 'schedule_inspection') {
      return this.scheduleInspection(data, tx);
    }

    if (action.action === 'assign_number') {
      return this.assignNumber(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createNumbering(
    data: any,
    protocol: string,
    serviceId: string,
    tx: PrismaTransaction
  ) {
    const numbering = await tx.propertyNumbering.create({
      data: {
                applicantName: data.applicantName,
        applicantCpf: data.applicantCpf,
        applicantPhone: data.applicantPhone,
        propertyAddress: data.propertyAddress,
        neighborhood: data.neighborhood,
        reference: data.reference || null,
        coordinates: data.coordinates || null,
        numberingType: data.numberingType,
        reason: data.reason,
        currentNumber: data.currentNumber || null,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service'
      }
    });

    return { numbering };
  }

  private async scheduleInspection(data: any, tx: PrismaTransaction) {
    const { numberingId, inspectionDate, inspectorId } = data;

    const numbering = await tx.propertyNumbering.update({
      where: { id: numberingId },
      data: {
        status: 'inspected',
        inspectionDate: new Date(inspectionDate),
        inspectorId
      }
    });

    return { numbering };
  }

  private async assignNumber(data: any, tx: PrismaTransaction) {
    const {
      numberingId,
      assignedNumber,
      inspectionReport,
      photos,
      approvedBy
    } = data;

    const numbering = await tx.propertyNumbering.update({
      where: { id: numberingId },
      data: {
        status: 'assigned',
        assignedNumber,
        assignmentDate: new Date(),
        inspectionReport: inspectionReport || null,
        photos: photos || null,
        approvedBy,
        approvedAt: new Date()
      }
    });

    return { numbering };
  }
}
