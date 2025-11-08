import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class DocumentRequestHandler extends BaseModuleHandler {
  moduleType = 'social_assistance';
  entityName = 'DocumentRequest';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    // ✅ VALIDAR citizenId obrigatório
    if (!data.citizenId) {
      throw new Error('citizenId é obrigatório');
    }

    // ✅ VALIDAR se cidadão existe
    const citizen = await tx.citizen.findUnique({
      where: { id: data.citizenId }
    });

    if (!citizen || !citizen.isActive) {
      throw new Error('Cidadão não encontrado ou inativo');
    }

    // ✅ CRIAR solicitação sem duplicação
    const documentRequest = await tx.documentRequest.create({
      data: {
        citizenId: data.citizenId, // ✅ Apenas vincula ao cidadão
        documentType: data.documentType,
        reason: data.reason,
        urgency: data.urgency || 'normal',
        status: 'pending',
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId
      }
    });

    return {
      documentRequest,
      message: 'Solicitação de documento criada. Aguardando processamento.'
    };
  }
}
