import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class VaccinationHandler extends BaseModuleHandler {
  moduleType = 'health';
  entityName = 'VaccinationRecord';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    const vaccination = await tx.vaccinationRecord.create({
      data: {
                patientName: data.patientName,
        patientCpf: data.patientCpf || null,
        patientBirthDate: data.patientBirthDate ? new Date(data.patientBirthDate) : null,
        vaccine: data.vaccine,
        dose: data.dose || null,
        healthUnit: data.healthUnit || null,
        status: 'pending',
        observations: data.observations || null,
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId || null
      }
    });

    return {
      vaccination,
      message: 'Agendamento de vacinação criado. Aguardando confirmação da data.'
    };
  }
}
