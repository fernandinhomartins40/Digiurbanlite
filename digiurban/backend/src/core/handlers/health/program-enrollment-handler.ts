import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class HealthProgramEnrollmentHandler extends BaseModuleHandler {
  moduleType = 'health';
  entityName = 'CampaignEnrollment';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    if (!data.citizenId) {
      throw new Error('citizenId é obrigatório');
    }

    const citizen = await tx.citizen.findUnique({
      where: { id: data.citizenId }
    });

    if (!citizen || !citizen.isActive) {
      throw new Error('Cidadão não encontrado ou inativo');
    }

    const enrollment = await tx.campaignEnrollment.create({
      data: {
        citizenId: data.citizenId,
        campaignId: data.campaignId || null,
        status: 'enrolled',
        observations: data.observations || null,
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId
      }
    });

    return {
      enrollment,
      message: 'Inscrição no programa de saúde realizada com sucesso.'
    };
  }
}
