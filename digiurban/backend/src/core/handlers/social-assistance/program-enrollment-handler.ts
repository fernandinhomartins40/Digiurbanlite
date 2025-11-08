import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class SocialProgramEnrollmentHandler extends BaseModuleHandler {
  moduleType = 'social_assistance';
  entityName = 'SocialProgramEnrollment';

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

    // ✅ CRIAR inscrição no programa sem duplicação
    const enrollment = await tx.socialProgramEnrollment.create({
      data: {
        citizenId: data.citizenId, // ✅ Apenas vincula ao cidadão
        programId: data.programId || null,
        familyIncome: data.familyIncome ? parseFloat(data.familyIncome) : null,
        familySize: data.familySize ? parseInt(data.familySize) : null,
        vulnerability: data.vulnerability || null,
        documents: data.documents || null,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId
      }
    });

    return {
      enrollment,
      message: 'Inscrição no programa social criada. Aguardando análise socioeconômica.'
    };
  }
}
