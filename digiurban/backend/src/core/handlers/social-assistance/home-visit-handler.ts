import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class HomeVisitHandler extends BaseModuleHandler {
  moduleType = 'social_assistance';
  entityName = 'SocialHomeVisit';

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

    // ✅ CRIAR visita domiciliar sem duplicação
    const homeVisit = await tx.socialHomeVisit.create({
      data: {
        citizenId: data.citizenId, // ✅ Apenas vincula ao cidadão
        visitReason: data.visitReason,
        visitType: data.visitType || 'avaliacao',
        status: 'pending',
        observations: data.observations || null,
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId
      }
    });

    return {
      homeVisit,
      message: 'Solicitação de visita domiciliar criada. Aguardando agendamento.'
    };
  }
}
