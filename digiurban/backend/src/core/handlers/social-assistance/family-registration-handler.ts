import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class FamilyRegistrationHandler extends BaseModuleHandler {
  moduleType = 'social_assistance';
  entityName = 'FamilyRegistration';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    const familyRegistration = await tx.familyRegistration.create({
      data: {
                responsibleName: data.responsibleName,
        responsibleCpf: data.responsibleCpf,
        phone: data.phone || null,
        address: data.address,
        familyMembers: data.familyMembers || [],
        familyIncome: data.familyIncome ? parseFloat(data.familyIncome) : null,
        housingType: data.housingType || null,
        vulnerability: data.vulnerability || null,
        needsAssessment: data.needsAssessment || null,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId || null
      }
    });

    return {
      familyRegistration,
      message: 'Cadastro familiar criado. Aguardando validação.'
    };
  }
}
