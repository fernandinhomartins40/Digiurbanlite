// ============================================================
// ENVIRONMENT HANDLER - Denúncias Ambientais
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';
type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class EnvironmentalComplaintHandler extends BaseModuleHandler {
  moduleType = 'environment';
  entityName = 'EnvironmentalComplaint';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol, serviceId } = action;

    if (action.action === 'create') {
      return this.createComplaint(data, protocol, serviceId, tx);
    }

    if (action.action === 'update') {
      return this.updateComplaint(data, tx);
    }

    if (action.action === 'assign') {
      return this.assignComplaint(data, tx);
    }

    if (action.action === 'resolve') {
      return this.resolveComplaint(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createComplaint(
    data: any,
    protocol: string,
    serviceId: string,
    tx: PrismaTransaction
  ) {
    // Criar denúncia ambiental
    const isAnonymous = data.isAnonymous === true || data.isAnonymous === 'true';

    const complaint = await tx.environmentalComplaint.create({
      data: {
                complainantName: isAnonymous ? null : data.complainantName,
        complainantPhone: isAnonymous ? null : data.complainantPhone,
        complainantEmail: isAnonymous ? null : data.complainantEmail,
        isAnonymous,
        complaintType: data.complaintType,
        description: data.description,
        location: data.location,
        coordinates: data.coordinates || null,
        photos: data.photos || null,
        severity: data.severity || 'medium',
        occurrenceDate: data.occurrenceDate ? new Date(data.occurrenceDate) : new Date(),
        status: 'pending',
        priority: data.priority || 'normal',
        protocol,
        serviceId,
        source: 'service'
      }
    });

    return { complaint };
  }

  private async updateComplaint(data: any, tx: PrismaTransaction) {
    const { complaintId, ...updateData } = data;

    const complaint = await tx.environmentalComplaint.update({
      where: { id: complaintId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return { complaint };
  }

  private async assignComplaint(data: any, tx: PrismaTransaction) {
    const { complaintId, assignedTo, investigationDate } = data;

    const complaint = await tx.environmentalComplaint.update({
      where: { id: complaintId },
      data: {
        status: 'investigating',
        assignedTo,
        investigationDate: investigationDate ? new Date(investigationDate) : null
      }
    });

    return { complaint };
  }

  private async resolveComplaint(data: any, tx: PrismaTransaction) {
    const { complaintId, status, actionsTaken, resolvedBy } = data;

    const complaint = await tx.environmentalComplaint.update({
      where: { id: complaintId },
      data: {
        status, // 'resolved' ou 'unfounded'
        actionsTaken: actionsTaken || null,
        resolvedBy,
        resolvedAt: new Date()
      }
    });

    return { complaint };
  }
}
