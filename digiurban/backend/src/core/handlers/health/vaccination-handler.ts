import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class VaccinationHandler extends BaseModuleHandler {
  moduleType = 'health';
  entityName = 'VaccinationRecord';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    // ✅ VALIDAR citizenId obrigatório
    if (!data.citizenId) {
      throw new Error('citizenId é obrigatório para agendamento de vacinação');
    }

    // ✅ VALIDAR se cidadão existe
    const citizen = await tx.citizen.findUnique({
      where: { id: data.citizenId }
    });

    if (!citizen || !citizen.isActive) {
      throw new Error('Cidadão não encontrado ou inativo');
    }

    // ✅ CRIAR agendamento sem duplicação de dados
    const vaccination = await tx.vaccinationRecord.create({
      data: {
        citizenId: data.citizenId, // ✅ Apenas vincula ao cidadão
        vaccine: data.vaccine,
        dose: data.dose || null,
        healthUnit: data.healthUnit || null,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        scheduledTime: data.scheduledTime || null,
        status: 'pending',
        observations: data.observations || null,
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId
      }
    });

    return {
      vaccination,
      message: 'Agendamento de vacinação criado. Aguardando confirmação da data.'
    };
  }
}
