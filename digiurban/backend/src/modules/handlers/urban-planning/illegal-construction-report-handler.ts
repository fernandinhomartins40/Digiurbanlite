// ============================================================
// URBAN PLANNING HANDLER - Denúncia de Construção Irregular
// FASE 3: Planejamento Urbano
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class IllegalConstructionReportHandler extends BaseModuleHandler {
  moduleType = 'DENUNCIA_CONSTRUCAO_IRREGULAR';
  entityName = 'IllegalConstructionReport';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol } = action;

    if (action.action === 'create') {
      return this.createReport(data, protocol, tx);
    }

    if (action.action === 'schedule_inspection') {
      return this.scheduleInspection(data, tx);
    }

    if (action.action === 'complete_inspection') {
      return this.completeInspection(data, tx);
    }

    if (action.action === 'resolve') {
      return this.resolveReport(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createReport(
    data: any,
    protocol: string,
    tx: PrismaTransaction
  ) {
    const requiredFields = ['address', 'neighborhood', 'violationType', 'description'];

    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
    }

    const isAnonymous = !data.reporterName && !data.reporterCpf;

    const report = await tx.illegalConstructionReport.create({
      data: {
        protocolId: protocol,
        reporterName: isAnonymous ? null : data.reporterName,
        reporterCpf: isAnonymous ? null : data.reporterCpf,
        reporterPhone: isAnonymous ? null : data.reporterPhone,
        isAnonymous,
        address: data.address,
        number: data.number || null,
        neighborhood: data.neighborhood,
        reference: data.reference || null,
        coordinates: data.coordinates || null,
        violationType: data.violationType,
        description: data.description,
        hasPhotos: data.hasPhotos || false,
        photoUrls: data.photoUrls || null,
        status: 'RECEIVED',
        isActive: true,
      },
    });

    return { report };
  }

  private async scheduleInspection(data: any, tx: PrismaTransaction) {
    const { reportId, inspectionDate } = data;

    const report = await tx.illegalConstructionReport.update({
      where: { id: reportId },
      data: {
        status: 'INSPECTION_SCHEDULED',
        inspectionScheduled: new Date(inspectionDate),
        updatedAt: new Date(),
      },
    });

    return { report };
  }

  private async completeInspection(data: any, tx: PrismaTransaction) {
    const { reportId, inspectorNotes } = data;

    const report = await tx.illegalConstructionReport.update({
      where: { id: reportId },
      data: {
        status: 'INSPECTED',
        inspectedAt: new Date(),
        inspectorNotes,
        updatedAt: new Date(),
      },
    });

    return { report };
  }

  private async resolveReport(data: any, tx: PrismaTransaction) {
    const { reportId, resolution } = data;

    const report = await tx.illegalConstructionReport.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { report };
  }

  async list(tx: PrismaTransaction, filters?: any): Promise<any> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (filters?.status) where.status = filters.status;
    if (filters?.neighborhood) where.neighborhood = filters.neighborhood;

    const [items, total] = await Promise.all([
      tx.illegalConstructionReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      tx.illegalConstructionReport.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
}
