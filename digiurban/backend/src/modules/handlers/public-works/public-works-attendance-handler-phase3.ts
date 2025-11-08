// ============================================================
// PUBLIC WORKS HANDLER - Atendimentos de Obras Públicas
// FASE 3: Obras Públicas
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class PublicWorksAttendanceHandlerPhase3 extends BaseModuleHandler {
  moduleType = 'ATENDIMENTOS_OBRAS';
  entityName = 'PublicWorksAttendancePhase3';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol } = action;
    if (action.action === 'create') return this.createAttendance(data, protocol, tx);
    if (action.action === 'resolve') return this.resolveAttendance(data, tx);
    throw new Error(`Action ${action.action} not supported`);
  }

  private async createAttendance(data: any, protocol: string, tx: PrismaTransaction) {
    return { attendance: await tx.publicWorksAttendancePhase3.create({
      data: {
        protocolId: protocol,
        citizenName: data.citizenName,
        citizenCpf: data.citizenCpf,
        citizenPhone: data.citizenPhone,
        citizenEmail: data.citizenEmail || null,
        subject: data.subject,
        description: data.description,
        attendanceType: data.attendanceType || 'SOLICITACAO',
        category: data.category || null,
        priority: data.priority || 'NORMAL',
        location: data.location || null,
        neighborhood: data.neighborhood || null,
        reference: data.reference || null,
        status: 'OPEN',
        isActive: true,
      },
    })};
  }

  private async resolveAttendance(data: any, tx: PrismaTransaction) {
    return { attendance: await tx.publicWorksAttendancePhase3.update({
      where: { id: data.attendanceId },
      data: { status: 'RESOLVED', resolution: data.resolution, resolvedAt: new Date() },
    })};
  }
}
