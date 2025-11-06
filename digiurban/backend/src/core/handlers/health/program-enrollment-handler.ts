import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class HealthProgramEnrollmentHandler extends BaseModuleHandler {
  moduleType = 'health';
  entityName = 'CampaignEnrollment';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    const enrollment = await tx.campaignEnrollment.create({
      data: {
                campaignId: data.campaignId || null,
        citizenName: data.citizenName,
        citizenCpf: data.citizenCpf,
        patientBirthDate: data.patientBirthDate ? new Date(data.patientBirthDate) : null,
        patientPhone: data.patientPhone || null,
        status: 'enrolled',
        observations: data.observations || null,
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId || null
      }
    });

    return {
      enrollment,
      message: 'Inscrição no programa de saúde realizada com sucesso.'
    };
  }
}
