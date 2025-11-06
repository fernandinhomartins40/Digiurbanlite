// ============================================================
// AGRICULTURE HANDLER - Distribuição de Sementes e Mudas
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';
type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class SeedDistributionHandler extends BaseModuleHandler {
  moduleType = 'agriculture';
  entityName = 'SeedDistribution';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol, serviceId } = action;

    if (action.action === 'create') {
      return this.createDistribution(data, protocol, serviceId, tx);
    }

    if (action.action === 'approve') {
      return this.approveDistribution(data, tx);
    }

    if (action.action === 'deliver') {
      return this.deliverDistribution(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createDistribution(
    data: any,
    protocol: string,
    serviceId: string,
    tx: PrismaTransaction
  ) {
    const distribution = await tx.seedDistribution.create({
      data: {
                producerName: data.producerName,
        producerCpf: data.producerCpf,
        producerPhone: data.producerPhone,
        propertyLocation: data.propertyLocation,
        propertyArea: data.propertyArea ? parseFloat(data.propertyArea) : null,
        requestType: data.requestType,
        items: data.items,
        purpose: data.purpose,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service'
      }
    });

    return { distribution };
  }

  private async approveDistribution(data: any, tx: PrismaTransaction) {
    const { distributionId, approvedQuantity, approvalNotes, approvedBy } = data;

    const distribution = await tx.seedDistribution.update({
      where: { id: distributionId },
      data: {
        status: 'approved',
        approvedQuantity: approvedQuantity || null,
        approvalNotes: approvalNotes || null,
        approvedBy,
        approvedAt: new Date()
      }
    });

    return { distribution };
  }

  private async deliverDistribution(data: any, tx: PrismaTransaction) {
    const { distributionId, deliveryDate, deliveredItems, deliveredBy, receivedBy } = data;

    const distribution = await tx.seedDistribution.update({
      where: { id: distributionId },
      data: {
        status: 'delivered',
        deliveryDate: new Date(deliveryDate),
        deliveredItems: deliveredItems || null,
        deliveredBy,
        receivedBy
      }
    });

    return { distribution };
  }
}
