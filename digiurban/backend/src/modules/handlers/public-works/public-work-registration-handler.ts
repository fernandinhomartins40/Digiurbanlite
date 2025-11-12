// ============================================================
// PUBLIC WORKS HANDLER - Cadastro de Obra Pública
// FASE 3: Obras Públicas
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class PublicWorkRegistrationHandler extends BaseModuleHandler {
  moduleType = 'CADASTRO_OBRA_PUBLICA';
  entityName = 'PublicWorkRegistration';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol } = action;
    if (action.action === 'create') return this.createWork(data, protocol, tx);
    if (action.action === 'update_progress') return this.updateProgress(data, tx);
    if (action.action === 'complete') return this.completeWork(data, tx);
    throw new Error(`Action ${action.action} not supported`);
  }

  private async createWork(data: any, protocol: string, tx: PrismaTransaction) {
    return { work: await tx.publicWorkRegistration.create({
      data: {
        protocolId: protocol,
        workName: data.workName,
        workType: data.workType,
        description: data.description,
        location: data.location,
        neighborhood: data.neighborhood,
        address: data.address || null,
        budget: data.budget ? parseFloat(data.budget) : null,
        contractedCompany: data.contractedCompany || null,
        cnpj: data.cnpj || null,
        contractNumber: data.contractNumber || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
        engineerName: data.engineerName || null,
        engineerCrea: data.engineerCrea || null,
        progress: 0,
        status: 'PLANNED',
        observations: data.observations || null,
        isActive: true,
      },
    })};
  }

  private async updateProgress(data: any, tx: PrismaTransaction) {
    const progress = Math.min(100, Math.max(0, parseFloat(data.progress)));
    const status = progress >= 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'PLANNED';

    return { work: await tx.publicWorkRegistration.update({
      where: { id: data.workId },
      data: { progress, status },
    })};
  }

  private async completeWork(data: any, tx: PrismaTransaction) {
    return { work: await tx.publicWorkRegistration.update({
      where: { id: data.workId },
      data: { status: 'COMPLETED', progress: 100, actualEndDate: new Date() },
    })};
  }
}
