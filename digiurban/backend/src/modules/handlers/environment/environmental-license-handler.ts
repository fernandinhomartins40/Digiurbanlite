// ============================================================
// ENVIRONMENT HANDLER - Licenças Ambientais
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';
type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class EnvironmentalLicenseHandler extends BaseModuleHandler {
  moduleType = 'environment';
  entityName = 'EnvironmentalLicense';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol, serviceId } = action;

    if (action.action === 'create') {
      return this.createLicense(data, protocol, serviceId, tx);
    }

    if (action.action === 'update') {
      return this.updateLicense(data, tx);
    }

    if (action.action === 'approve') {
      return this.approveLicense(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createLicense(
    data: any,
    protocol: string,
    serviceId: string,
    tx: PrismaTransaction
  ) {
    // Criar licença ambiental pendente
    const license = await tx.environmentalLicense.create({
      data: {
                applicantName: data.applicantName,
        applicantCpf: data.applicantCpf,
        applicantPhone: data.applicantPhone,
        applicantEmail: data.applicantEmail || null,
        licenseType: data.licenseType,
        activityType: data.activityType,
        description: data.description,
        location: data.location,
        coordinates: data.coordinates || null,
        area: data.area ? parseFloat(data.area) : null,
        licenseNumber: `LIC-${Date.now()}`,
        activity: data.activity || data.activityType,
        applicationDate: new Date(),
        status: 'pending',
        documents: data.documents || null,
        protocolId: protocol,
        serviceId,
        source: 'service'
      }
    });

    return { license };
  }

  private async updateLicense(data: any, tx: PrismaTransaction) {
    const { licenseId, ...updateData } = data;

    const license = await tx.environmentalLicense.update({
      where: { id: licenseId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return { license };
  }

  private async approveLicense(data: any, tx: PrismaTransaction) {
    const { licenseId, validFrom, validUntil, conditions, approvedBy } = data;

    const license = await tx.environmentalLicense.update({
      where: { id: licenseId },
      data: {
        status: 'approved',
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        conditions: conditions || null,
        approvedBy,
        approvedAt: new Date()
      }
    });

    return { license };
  }
}
