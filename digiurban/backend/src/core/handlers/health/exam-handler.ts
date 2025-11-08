import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class MedicalExamHandler extends BaseModuleHandler {
  moduleType = 'health';
  entityName = 'MedicalExam';

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

    const exam = await tx.medicalExam.create({
      data: {
        citizenId: data.citizenId,
        examType: data.examType,
        healthUnit: data.healthUnit || null,
        status: 'pending',
        observations: data.observations || null,
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId
      }
    });

    return {
      exam,
      message: 'Solicitação de exame criada. Aguardando agendamento.'
    };
  }
}
