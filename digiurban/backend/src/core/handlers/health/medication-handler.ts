import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class MedicationDispenseHandler extends BaseModuleHandler {
  moduleType = 'health';
  entityName = 'MedicationDispense';

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

    const medication = await tx.medicationDispense.create({
      data: {
        citizenId: data.citizenId,
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
        createdBy: data.citizenId
      }
    });

    return {
      medication,
      message: 'Solicitação de medicamento criada. Aguardando aprovação e liberação na farmácia.'
    };
  }
}
