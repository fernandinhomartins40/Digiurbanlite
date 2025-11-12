import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class SocialBenefitRequestHandler extends BaseModuleHandler {
  moduleType = 'social_assistance';
  entityName = 'SocialBenefitRequest';

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
    const benefitRequest = await tx.socialBenefitRequest.create({
      data: {
        citizenId: data.citizenId, // ✅ Apenas vincula ao cidadão
        familyIncome: data.familyIncome ? parseFloat(data.familyIncome) : null,
        familySize: data.familySize ? parseInt(data.familySize) : null,
        benefitType: data.benefitType,
        quantity: data.quantity || 1,
        justification: data.justification,
        documents: data.documents || null,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId
      }
    });

    return {
      benefitRequest,
      message: 'Solicitação de benefício criada. Aguardando avaliação do assistente social.'
    };
  }
}
