import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class HomeCareHandler extends BaseModuleHandler {
  moduleType = 'health';
  entityName = 'HomeCare';

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

    const homeCare = await tx.homeCare.create({
      data: {
        citizenId: data.citizenId,
        careType: data.careType,
        frequency: data.frequency || null,
        status: 'pending',
        observations: data.observations || null,
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId
      }
    });

    return {
      homeCare,
      message: 'Solicitação de atendimento domiciliar criada. Aguardando avaliação.'
    };
  }
}
