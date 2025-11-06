import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class DocumentRequestHandler extends BaseModuleHandler {
  moduleType = 'social_assistance';
  entityName = 'DocumentRequest';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    const documentRequest = await tx.documentRequest.create({
      data: {
                citizenName: data.citizenName,
        citizenCpf: data.citizenCpf,
        phone: data.phone || null,
        documentType: data.documentType,
        reason: data.reason,
        urgency: data.urgency || 'normal',
        status: 'pending',
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId || null
      }
    });

    return {
      documentRequest,
      message: 'Solicitação de documento criada. Aguardando processamento.'
    };
  }
}
