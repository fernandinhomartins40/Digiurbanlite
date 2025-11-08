// PUBLIC SERVICES HANDLER - Coleta Especial / FASE 3
import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class SpecialCollectionRequestHandler extends BaseModuleHandler {
  moduleType = 'COLETA_ESPECIAL';
  entityName = 'SpecialCollectionRequest';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    if (action.action === 'create') {
      return { request: await tx.specialCollectionRequest.create({ data: {
        protocolId: action.protocol, requesterName: action.data.requesterName, requesterCpf: action.data.requesterCpf || null,
        requesterPhone: action.data.requesterPhone, requesterEmail: action.data.requesterEmail || null,
        collectionType: action.data.collectionType, address: action.data.address, number: action.data.number || null,
        neighborhood: action.data.neighborhood, reference: action.data.reference || null,
        itemDescription: action.data.itemDescription, estimatedVolume: action.data.estimatedVolume || null,
        itemQuantity: action.data.itemQuantity ? parseInt(action.data.itemQuantity) : null,
        preferredDate: action.data.preferredDate ? new Date(action.data.preferredDate) : null,
        status: 'PENDING', isActive: true,
      }})};
    }
    if (action.action === 'schedule') {
      return { request: await tx.specialCollectionRequest.update({
        where: { id: action.data.requestId }, data: { status: 'SCHEDULED', scheduledDate: new Date(action.data.scheduledDate) }
      })};
    }
    if (action.action === 'complete') {
      return { request: await tx.specialCollectionRequest.update({
        where: { id: action.data.requestId }, data: { status: 'COMPLETED', collectedAt: new Date() }
      })};
    }
    throw new Error(`Action ${action.action} not supported`);
  }
}
