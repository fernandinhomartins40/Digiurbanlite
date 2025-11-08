// PUBLIC SERVICES HANDLER - Solicitação de Poda / FASE 3
import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class TreePruningRequestHandlerPhase3 extends BaseModuleHandler {
  moduleType = 'SOLICITACAO_PODA';
  entityName = 'TreePruningRequestPhase3';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    if (action.action === 'create') {
      const priority = action.data.urgency || action.data.pruningReason === 'RISCO_QUEDA' ? 'HIGH' : 'NORMAL';
      return { request: await tx.treePruningRequestPhase3.create({ data: {
        protocolId: action.protocol, requesterName: action.data.requesterName, requesterCpf: action.data.requesterCpf || null,
        requesterPhone: action.data.requesterPhone, requesterEmail: action.data.requesterEmail || null,
        address: action.data.address, neighborhood: action.data.neighborhood,
        reference: action.data.reference || null, coordinates: action.data.coordinates || null,
        treeType: action.data.treeType || null, treeHeight: action.data.treeHeight || null,
        pruningReason: action.data.pruningReason, urgency: action.data.urgency || false,
        nearPowerLines: action.data.nearPowerLines || false, hasPhotos: action.data.hasPhotos || false,
        photoUrls: action.data.photoUrls || null, priority, status: 'PENDING', isActive: true,
      }})};
    }
    if (action.action === 'complete') {
      return { request: await tx.treePruningRequestPhase3.update({
        where: { id: action.data.requestId }, data: { status: 'COMPLETED', completedAt: new Date() }
      })};
    }
    throw new Error(`Action ${action.action} not supported`);
  }
}
