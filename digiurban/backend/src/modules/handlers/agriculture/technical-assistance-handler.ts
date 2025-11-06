// ============================================================
// AGRICULTURE HANDLER - Assistência Técnica Rural
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';
type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class TechnicalAssistanceHandler extends BaseModuleHandler {
  moduleType = 'ASSISTENCIA_TECNICA';
  entityName = 'TechnicalAssistance';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol, serviceId } = action;

    if (action.action === 'create') {
      return this.createAssistance(data, protocol, serviceId, tx);
    }

    if (action.action === 'schedule') {
      return this.scheduleAssistance(data, tx);
    }

    if (action.action === 'complete') {
      return this.completeAssistance(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createAssistance(
    data: any,
    protocol: string,
    serviceId: string,
    tx: PrismaTransaction
  ) {
    const assistance = await tx.technicalAssistance.create({
      data: {
                producerName: data.producerName,
        producerCpf: data.producerCpf,
        producerPhone: data.producerPhone,
        propertyName: data.propertyName || data.producerName,
        propertyLocation: data.propertyLocation,
        propertyArea: data.propertyArea ? parseFloat(data.propertyArea) : null,
        propertySize: data.propertySize ? parseFloat(data.propertySize) : 0,
        location: data.location || data.propertyLocation,
        assistanceType: data.assistanceType,
        subject: data.subject || data.assistanceType,
        description: data.description,
        cropTypes: data.cropTypes || null,
        status: 'pending',
        priority: data.priority || 'normal',
        technician: data.technician || 'Não designado',
        visitDate: data.visitDate ? new Date(data.visitDate) : new Date(),
        recommendations: data.recommendations || '',
        requestDate: new Date(),
        scheduledVisit: data.scheduledVisit ? new Date(data.scheduledVisit) : undefined,
        completedAt: undefined,
        protocolId: protocol,
        serviceId,
        source: 'service'
      }
    });

    return { assistance };
  }

  private async scheduleAssistance(data: any, tx: PrismaTransaction) {
    const { assistanceId, scheduledDate, technicianId } = data;

    const assistance = await tx.technicalAssistance.update({
      where: { id: assistanceId },
      data: {
        status: 'scheduled',
        scheduledDate: new Date(scheduledDate),
        technicianId
      }
    });

    return { assistance };
  }

  private async completeAssistance(data: any, tx: PrismaTransaction) {
    const {
      assistanceId,
      visitDate,
      visitReport,
      recommendations,
      photos,
      followUpRequired,
      completedBy
    } = data;

    const assistance = await tx.technicalAssistance.update({
      where: { id: assistanceId },
      data: {
        status: 'completed',
        visitDate: new Date(visitDate),
        visitReport: visitReport || null,
        recommendations: recommendations || null,
        photos: photos || null,
        followUpRequired: followUpRequired || false,
        completedBy,
        completedAt: new Date()
      }
    });

    return { assistance };
  }
}
