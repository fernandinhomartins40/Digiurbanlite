// PUBLIC SERVICES HANDLER - Iluminação Pública / FASE 3
import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class PublicLightingRequestHandler extends BaseModuleHandler {
  moduleType = 'ILUMINACAO_PUBLICA';
  entityName = 'PublicLightingRequest';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    if (action.action === 'create') {
      return { request: await tx.publicLightingRequest.create({ data: {
        protocolId: action.protocol, requesterName: action.data.requesterName, requesterCpf: action.data.requesterCpf || null,
        requesterPhone: action.data.requesterPhone, requesterEmail: action.data.requesterEmail || null,
        requestType: action.data.requestType, problemType: action.data.problemType || null,
        address: action.data.address, number: action.data.number || null, neighborhood: action.data.neighborhood,
        reference: action.data.reference || null, coordinates: action.data.coordinates || null,
        description: action.data.description, urgency: action.data.urgency || false,
        hasPhotos: action.data.hasPhotos || false, photoUrls: action.data.photoUrls || null,
        status: 'PENDING', isActive: true,
      }})};
    }
    if (action.action === 'complete') {
      return { request: await tx.publicLightingRequest.update({
        where: { id: action.data.requestId }, data: { status: 'COMPLETED', repairedAt: new Date() }
      })};
    }
    throw new Error(`Action ${action.action} not supported`);
  }
}
