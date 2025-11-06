import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class HomeVisitHandler extends BaseModuleHandler {
  moduleType = 'social_assistance';
  entityName = 'SocialHomeVisit';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    const homeVisit = await tx.socialHomeVisit.create({
      data: {
                citizenName: data.citizenName,
        citizenCpf: data.citizenCpf || null,
        address: data.address,
        phone: data.phone || null,
        visitReason: data.visitReason,
        visitType: data.visitType || 'avaliacao',
        status: 'pending',
        observations: data.observations || null,
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId || null
      }
    });

    return {
      homeVisit,
      message: 'Solicitação de visita domiciliar criada. Aguardando agendamento.'
    };
  }
}
