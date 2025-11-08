// PUBLIC SERVICES HANDLER - Atendimentos / FASE 3
import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class PublicServiceAttendanceHandlerPhase3 extends BaseModuleHandler {
  moduleType = 'ATENDIMENTOS_SERVICOS_PUBLICOS';
  entityName = 'PublicServiceAttendancePhase3';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    if (action.action === 'create') {
      return { attendance: await tx.publicServiceAttendancePhase3.create({ data: {
        protocolId: action.protocol, citizenName: action.data.citizenName, citizenCpf: action.data.citizenCpf,
        citizenPhone: action.data.citizenPhone, citizenEmail: action.data.citizenEmail || null,
        subject: action.data.subject, description: action.data.description,
        attendanceType: action.data.attendanceType || 'SOLICITACAO', category: action.data.category || null,
        priority: action.data.priority || 'NORMAL', location: action.data.location || null,
        neighborhood: action.data.neighborhood || null, status: 'OPEN', isActive: true,
      }})};
    }
    if (action.action === 'resolve') {
      return { attendance: await tx.publicServiceAttendancePhase3.update({
        where: { id: action.data.attendanceId }, data: { status: 'RESOLVED', resolution: action.data.resolution, resolvedAt: new Date() }
      })};
    }
    throw new Error(`Action ${action.action} not supported`);
  }
}
