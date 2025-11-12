import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class MedicalAppointmentHandler extends BaseModuleHandler {
  moduleType = 'health';
  entityName = 'MedicalAppointment';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    // ✅ VALIDAR citizenId obrigatório
    if (!data.citizenId) {
      throw new Error('citizenId é obrigatório para agendamento de consulta');
    }

    // ✅ VALIDAR se cidadão existe
    const citizen = await tx.citizen.findUnique({
      where: { id: data.citizenId }
    });

    if (!citizen || !citizen.isActive) {
      throw new Error('Cidadão não encontrado ou inativo');
    }

    // ✅ CRIAR agendamento sem duplicação de dados
    const appointment = await tx.medicalAppointment.create({
      data: {
        citizenId: data.citizenId, // ✅ Apenas vincula ao cidadão
        specialty: data.specialty,
        healthUnit: data.healthUnit || null,
        preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
        preferredShift: data.preferredShift || null,
        status: 'pending',
        observations: data.observations || null,
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId
      }
    });

    return {
      appointment,
      message: 'Solicitação de consulta médica criada. Aguardando agendamento pela unidade de saúde.'
    };
  }
}
