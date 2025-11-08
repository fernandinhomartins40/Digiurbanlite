// ============================================================
// PUBLIC WORKS HANDLER - Solicitação de Reparo de Via
// FASE 3: Obras Públicas
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class RoadRepairRequestHandlerPhase3 extends BaseModuleHandler {
  moduleType = 'SOLICITACAO_REPARO_VIA';
  entityName = 'RoadRepairRequestPhase3';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol } = action;
    if (action.action === 'create') return this.createRequest(data, protocol, tx);
    if (action.action === 'schedule') return this.scheduleRepair(data, tx);
    if (action.action === 'complete') return this.completeRepair(data, tx);
    throw new Error(`Action ${action.action} not supported`);
  }

  private async createRequest(data: any, protocol: string, tx: PrismaTransaction) {
    const priority = this.calculatePriority(data.severity, data.problemType);
    return { request: await tx.roadRepairRequestPhase3.create({
      data: {
        protocolId: protocol,
        requesterName: data.requesterName,
        requesterCpf: data.requesterCpf || null,
        requesterPhone: data.requesterPhone,
        requesterEmail: data.requesterEmail || null,
        address: data.address,
        number: data.number || null,
        neighborhood: data.neighborhood,
        reference: data.reference || null,
        coordinates: data.coordinates || null,
        problemType: data.problemType,
        severity: data.severity,
        description: data.description,
        affectedArea: data.affectedArea ? parseFloat(data.affectedArea) : null,
        hasPhotos: data.hasPhotos || false,
        photoUrls: data.photoUrls || null,
        status: 'PENDING',
        priority,
        isActive: true,
      },
    })};
  }

  private calculatePriority(severity: string, problemType: string): string {
    if (severity === 'CRITICA') return 'URGENT';
    if (severity === 'ALTA') return 'HIGH';
    if (problemType === 'BURACO' && severity === 'MEDIA') return 'HIGH';
    return 'NORMAL';
  }

  private async scheduleRepair(data: any, tx: PrismaTransaction) {
    return { request: await tx.roadRepairRequestPhase3.update({
      where: { id: data.requestId },
      data: { status: 'SCHEDULED', repairScheduled: new Date(data.scheduledDate) },
    })};
  }

  private async completeRepair(data: any, tx: PrismaTransaction) {
    return { request: await tx.roadRepairRequestPhase3.update({
      where: { id: data.requestId },
      data: { status: 'COMPLETED', repairedAt: new Date(), observations: data.observations },
    })};
  }
}
