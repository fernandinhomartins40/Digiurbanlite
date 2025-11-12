// ============================================================
// PUBLIC WORKS HANDLER - Inspeção de Obra
// FASE 3: Obras Públicas
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class WorkInspectionHandlerPhase3 extends BaseModuleHandler {
  moduleType = 'INSPECAO_OBRA';
  entityName = 'WorkInspectionPhase3';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol } = action;
    if (action.action === 'create') return this.createInspection(data, protocol, tx);
    if (action.action === 'schedule_next') return this.scheduleNext(data, tx);
    throw new Error(`Action ${action.action} not supported`);
  }

  private async createInspection(data: any, protocol: string, tx: PrismaTransaction) {
    return { inspection: await tx.workInspectionPhase3.create({
      data: {
        protocolId: protocol,
        workName: data.workName,
        workLocation: data.workLocation,
        contractNumber: data.contractNumber || null,
        inspectionDate: data.inspectionDate ? new Date(data.inspectionDate) : new Date(),
        inspectorName: data.inspectorName,
        inspectorRole: data.inspectorRole || null,
        progressPercent: parseFloat(data.progressPercent),
        qualityRating: data.qualityRating,
        findings: data.findings,
        nonCompliances: data.nonCompliances || null,
        recommendations: data.recommendations || null,
        hasPhotos: data.hasPhotos || false,
        photoUrls: data.photoUrls || null,
        requiresAction: data.requiresAction || false,
        actionDeadline: data.actionDeadline ? new Date(data.actionDeadline) : null,
        observations: data.observations || null,
        status: 'COMPLETED',
        isActive: true,
      },
    })};
  }

  private async scheduleNext(data: any, tx: PrismaTransaction) {
    return { inspection: await tx.workInspectionPhase3.update({
      where: { id: data.inspectionId },
      data: { nextInspection: new Date(data.nextInspectionDate) },
    })};
  }
}
