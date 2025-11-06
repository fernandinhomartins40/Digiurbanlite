import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class SocialProgramEnrollmentHandler extends BaseModuleHandler {
  moduleType = 'social_assistance';
  entityName = 'SocialProgramEnrollment';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    const enrollment = await tx.socialProgramEnrollment.create({
      data: {
                programId: data.programId || null,
        citizenName: data.citizenName,
        citizenCpf: data.citizenCpf,
        phone: data.phone || null,
        address: data.address || null,
        familyIncome: data.familyIncome ? parseFloat(data.familyIncome) : null,
        familySize: data.familySize ? parseInt(data.familySize) : null,
        vulnerability: data.vulnerability || null,
        documents: data.documents || null,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId || null
      }
    });

    return {
      enrollment,
      message: 'Inscrição no programa social criada. Aguardando análise socioeconômica.'
    };
  }
}
