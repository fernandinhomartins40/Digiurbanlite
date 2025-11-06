// ============================================================
// ENVIRONMENT HANDLER - Certificação Orgânica
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';
type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class OrganicCertificationHandler extends BaseModuleHandler {
  moduleType = 'environment';
  entityName = 'OrganicCertification';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol, serviceId } = action;

    if (action.action === 'create') {
      return this.createCertification(data, protocol, serviceId, tx);
    }

    if (action.action === 'update') {
      return this.updateCertification(data, tx);
    }

    if (action.action === 'approve') {
      return this.approveCertification(data, tx);
    }

    if (action.action === 'schedule_inspection') {
      return this.scheduleInspection(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createCertification(
    data: any,
    protocol: string,
    serviceId: string,
    tx: PrismaTransaction
  ) {
    // Criar solicitação de certificação orgânica
    const certification = await tx.organicCertification.create({
      data: {
                producerName: data.producerName,
        producerCpf: data.producerCpf,
        producerPhone: data.producerPhone,
        producerEmail: data.producerEmail || null,
        propertyName: data.propertyName || null,
        propertyLocation: data.propertyLocation,
        propertyArea: parseFloat(data.propertyArea),
        coordinates: data.coordinates || null,
        products: data.products,
        productionSystem: data.productionSystem,
        status: 'pending',
        documents: data.documents || null,
        protocol,
        serviceId,
        source: 'service'
      }
    });

    return { certification };
  }

  private async updateCertification(data: any, tx: PrismaTransaction) {
    const { certificationId, ...updateData } = data;

    const certification = await tx.organicCertification.update({
      where: { id: certificationId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return { certification };
  }

  private async scheduleInspection(data: any, tx: PrismaTransaction) {
    const { certificationId, inspectionDate, inspectorId } = data;

    const certification = await tx.organicCertification.update({
      where: { id: certificationId },
      data: {
        status: 'inspected',
        lastInspectionDate: new Date(inspectionDate),
        inspectorId
      }
    });

    return { certification };
  }

  private async approveCertification(data: any, tx: PrismaTransaction) {
    const {
      certificationId,
      certificationNumber,
      validFrom,
      validUntil,
      nextInspectionDate,
      approvedBy
    } = data;

    const certification = await tx.organicCertification.update({
      where: { id: certificationId },
      data: {
        status: 'approved',
        certificationNumber,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        nextInspectionDate: nextInspectionDate ? new Date(nextInspectionDate) : null,
        approvedBy,
        approvedAt: new Date()
      }
    });

    return { certification };
  }
}
