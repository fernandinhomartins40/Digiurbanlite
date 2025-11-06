import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class SocialBenefitRequestHandler extends BaseModuleHandler {
  moduleType = 'social_assistance';
  entityName = 'SocialBenefitRequest';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    const benefitRequest = await tx.socialBenefitRequest.create({
      data: {
                citizenName: data.citizenName,
        citizenCpf: data.citizenCpf,
        phone: data.phone || null,
        address: data.address || null,
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
        createdBy: data.citizenId || null
      }
    });

    return {
      benefitRequest,
      message: 'Solicitação de benefício criada. Aguardando avaliação do assistente social.'
    };
  }
}
