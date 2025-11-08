// PUBLIC SERVICES HANDLER - Solicitação de Capina / FASE 3
import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class WeedingRequestHandlerPhase3 extends BaseModuleHandler {
  moduleType = 'SOLICITACAO_CAPINA';
  entityName = 'WeedingRequestPhase3';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    if (action.action === 'create') {
      return { request: await tx.weedingRequestPhase3.create({ data: {
        protocolId: action.protocol, requesterName: action.data.requesterName, requesterCpf: action.data.requesterCpf || null,
        requesterPhone: action.data.requesterPhone, requesterEmail: action.data.requesterEmail || null,
        address: action.data.address, neighborhood: action.data.neighborhood,
        reference: action.data.reference || null, coordinates: action.data.coordinates || null,
        areaType: action.data.areaType, estimatedArea: action.data.estimatedArea ? parseFloat(action.data.estimatedArea) : null,
        description: action.data.description, hasPhotos: action.data.hasPhotos || false, photoUrls: action.data.photoUrls || null,
        priority: action.data.priority || 'NORMAL', status: 'PENDING', isActive: true,
      }})};
    }
    if (action.action === 'complete') {
      return { request: await tx.weedingRequestPhase3.update({
        where: { id: action.data.requestId }, data: { status: 'COMPLETED', completedAt: new Date() }
      })};
    }
    throw new Error(`Action ${action.action} not supported`);
  }
}
