// PUBLIC SERVICES HANDLER - Solicitação de Desobstrução / FASE 3
import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class DrainageUnblockRequestHandler extends BaseModuleHandler {
  moduleType = 'SOLICITACAO_DESOBSTRUCAO';
  entityName = 'DrainageUnblockRequest';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    if (action.action === 'create') {
      const priority = action.data.causingFlooding || action.data.severity === 'TOTAL' ? 'HIGH' : 'NORMAL';
      return { request: await tx.drainageUnblockRequest.create({ data: {
        protocolId: action.protocol, requesterName: action.data.requesterName, requesterCpf: action.data.requesterCpf || null,
        requesterPhone: action.data.requesterPhone, requesterEmail: action.data.requesterEmail || null,
        address: action.data.address, neighborhood: action.data.neighborhood,
        reference: action.data.reference || null, coordinates: action.data.coordinates || null,
        obstructionType: action.data.obstructionType, severity: action.data.severity, description: action.data.description,
        causingFlooding: action.data.causingFlooding || false, hasPhotos: action.data.hasPhotos || false,
        photoUrls: action.data.photoUrls || null, priority, status: 'PENDING', isActive: true,
      }})};
    }
    if (action.action === 'complete') {
      return { request: await tx.drainageUnblockRequest.update({
        where: { id: action.data.requestId }, data: { status: 'COMPLETED', completedAt: new Date() }
      })};
    }
    throw new Error(`Action ${action.action} not supported`);
  }
}
