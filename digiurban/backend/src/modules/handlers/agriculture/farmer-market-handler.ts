// ============================================================
// AGRICULTURE HANDLER - Cadastro Feira do Produtor
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';
type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class FarmerMarketRegistrationHandler extends BaseModuleHandler {
  moduleType = 'agriculture';
  entityName = 'FarmerMarketRegistration';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol, serviceId } = action;

    if (action.action === 'create') {
      return this.createRegistration(data, protocol, serviceId, tx);
    }

    if (action.action === 'inspect') {
      return this.inspectProducer(data, tx);
    }

    if (action.action === 'approve') {
      return this.approveRegistration(data, tx);
    }

    if (action.action === 'suspend') {
      return this.suspendRegistration(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createRegistration(
    data: any,
    protocol: string,
    serviceId: string,
    tx: PrismaTransaction
  ) {
    const registration = await tx.farmerMarketRegistration.create({
      data: {
                producerName: data.producerName,
        producerCpf: data.producerCpf,
        producerPhone: data.producerPhone,
        producerEmail: data.producerEmail || null,
        propertyLocation: data.propertyLocation,
        propertyArea: data.propertyArea ? parseFloat(data.propertyArea) : null,
        products: data.products,
        productionType: data.productionType,
        hasOrganicCert: data.hasOrganicCert === true || data.hasOrganicCert === 'true',
        certificationId: data.certificationId || null,
        needsStall: data.needsStall === true || data.needsStall === 'true',
        stallPreference: data.stallPreference || null,
        documents: data.documents || null,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service'
      }
    });

    return { registration };
  }

  private async inspectProducer(data: any, tx: PrismaTransaction) {
    const { registrationId, inspectedBy, inspectionDate } = data;

    const registration = await tx.farmerMarketRegistration.update({
      where: { id: registrationId },
      data: {
        inspectedBy,
        inspectionDate: new Date(inspectionDate)
      }
    });

    return { registration };
  }

  private async approveRegistration(data: any, tx: PrismaTransaction) {
    const {
      registrationId,
      registrationNumber,
      validFrom,
      validUntil,
      approvedBy
    } = data;

    const registration = await tx.farmerMarketRegistration.update({
      where: { id: registrationId },
      data: {
        status: 'active',
        registrationNumber,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        approvedBy,
        approvedAt: new Date()
      }
    });

    return { registration };
  }

  private async suspendRegistration(data: any, tx: PrismaTransaction) {
    const { registrationId } = data;

    const registration = await tx.farmerMarketRegistration.update({
      where: { id: registrationId },
      data: {
        status: 'suspended'
      }
    });

    return { registration };
  }
}
