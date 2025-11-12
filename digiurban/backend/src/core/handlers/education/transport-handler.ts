import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class SchoolTransportHandler extends BaseModuleHandler {
  moduleType = 'education';
  entityName = 'SchoolTransportRequest';

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

    // ✅ CRIAR solicitação de transporte sem duplicação
    const transport = await tx.schoolTransportRequest.create({
      data: {
        citizenId: data.citizenId, // ✅ Vincula ao cidadão (responsável)
        studentName: data.studentName,
        studentCpf: data.studentCpf || null,
        studentBirthDate: data.birthDate ? new Date(data.birthDate) : null,
        route: data.route || 'A definir',
        shift: data.shift,
        pickupAddress: data.address,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId
      }
    });

    return {
      transport,
      message: 'Solicitação de transporte criada. A rota será definida pela secretaria.'
    };
  }
}
