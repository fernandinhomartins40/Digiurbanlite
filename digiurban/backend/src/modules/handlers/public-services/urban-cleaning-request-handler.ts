// PUBLIC SERVICES HANDLER - Limpeza Urbana / FASE 3
import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class UrbanCleaningRequestHandler extends BaseModuleHandler {
  moduleType = 'LIMPEZA_URBANA';
  entityName = 'UrbanCleaningRequest';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    if (action.action === 'create') {
      return { request: await tx.urbanCleaningRequest.create({ data: {
        protocolId: action.protocol, requesterName: action.data.requesterName, requesterCpf: action.data.requesterCpf || null,
        requesterPhone: action.data.requesterPhone, requesterEmail: action.data.requesterEmail || null,
        cleaningType: action.data.cleaningType, address: action.data.address, neighborhood: action.data.neighborhood,
        reference: action.data.reference || null, coordinates: action.data.coordinates || null,
        description: action.data.description, estimatedArea: action.data.estimatedArea ? parseFloat(action.data.estimatedArea) : null,
        hasPhotos: action.data.hasPhotos || false, photoUrls: action.data.photoUrls || null,
        status: 'PENDING', isActive: true,
      }})};
    }
    if (action.action === 'complete') {
      return { request: await tx.urbanCleaningRequest.update({
        where: { id: action.data.requestId }, data: { status: 'COMPLETED', completedAt: new Date() }
      })};
    }
    throw new Error(`Action ${action.action} not supported`);
  }
}
