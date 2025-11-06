import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class MedicationDispenseHandler extends BaseModuleHandler {
  moduleType = 'health';
  entityName = 'MedicationDispense';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    const medication = await tx.medicationDispense.create({
      data: {
                patientName: data.patientName,
        patientCpf: data.patientCpf,
        medicationName: data.medicationName,
        dosage: data.dosage || null,
        quantity: data.quantity || 1,
        prescriptionId: data.prescriptionId || null,
        unitId: data.unitId || null,
        status: 'pending',
        observations: data.observations || null,
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId || null
      }
    });

    return {
      medication,
      message: 'Solicitação de medicamento criada. Aguardando aprovação e liberação na farmácia.'
    };
  }
}
