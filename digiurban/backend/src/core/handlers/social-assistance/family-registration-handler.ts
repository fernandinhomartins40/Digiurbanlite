import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class FamilyRegistrationHandler extends BaseModuleHandler {
  moduleType = 'social_assistance';
  entityName = 'FamilyRegistration';

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

    // ✅ CRIAR cadastro familiar sem duplicação
    const familyRegistration = await tx.familyRegistration.create({
      data: {
        citizenId: data.citizenId, // ✅ Apenas vincula ao cidadão (responsável)
        familyMembers: data.familyMembers || [],
        familyIncome: data.familyIncome ? parseFloat(data.familyIncome) : null,
        housingType: data.housingType || null,
        vulnerability: data.vulnerability || null,
        needsAssessment: data.needsAssessment || null,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId
      }
    });

    return {
      familyRegistration,
      message: 'Cadastro familiar criado. Aguardando validação.'
    };
  }
}
