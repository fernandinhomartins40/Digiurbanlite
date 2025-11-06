import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class MedicalExamHandler extends BaseModuleHandler {
  moduleType = 'health';
  entityName = 'MedicalExam';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    const exam = await tx.medicalExam.create({
      data: {
                patientName: data.patientName,
        patientCpf: data.patientCpf || null,
        examType: data.examType,
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
      exam,
      message: 'Solicitação de exame criada. Aguardando agendamento.'
    };
  }
}
