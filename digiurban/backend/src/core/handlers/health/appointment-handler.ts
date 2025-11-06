import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class MedicalAppointmentHandler extends BaseModuleHandler {
  moduleType = 'health';
  entityName = 'MedicalAppointment';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    const appointment = await tx.medicalAppointment.create({
      data: {
                patientName: data.patientName,
        patientCpf: data.patientCpf || null,
        patientPhone: data.patientPhone || null,
        specialty: data.specialty,
        healthUnit: data.healthUnit || null,
        preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
        preferredShift: data.preferredShift || null,
        status: 'pending',
        observations: data.observations || null,
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId || null
      }
    });

    return {
      appointment,
      message: 'Solicitação de consulta médica criada. Aguardando agendamento pela unidade de saúde.'
    };
  }
}
