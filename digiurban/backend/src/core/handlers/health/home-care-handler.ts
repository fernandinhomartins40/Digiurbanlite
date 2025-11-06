import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class HomeCareHandler extends BaseModuleHandler {
  moduleType = 'health';
  entityName = 'HomeCare';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    const homeCare = await tx.homeCare.create({
      data: {
                patientName: data.patientName,
        patientCpf: data.patientCpf || null,
        patientPhone: data.patientPhone || null,
        address: data.address,
        careType: data.careType,
        frequency: data.frequency || null,
        status: 'pending',
        observations: data.observations || null,
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId || null
      }
    });

    return {
      homeCare,
      message: 'Solicitação de atendimento domiciliar criada. Aguardando avaliação.'
    };
  }
}
