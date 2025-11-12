import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class SchoolMealHandler extends BaseModuleHandler {
  moduleType = 'education';
  entityName = 'SchoolMealRequest';

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

    // ✅ CRIAR solicitação de dieta especial sem duplicação
    const meal = await tx.schoolMealRequest.create({
      data: {
        citizenId: data.citizenId, // ✅ Vincula ao cidadão (responsável)
        studentName: data.studentName,
        studentCpf: data.studentCpf || null,
        shift: data.shift,
        dietType: data.dietType,
        restrictions: data.restrictions,
        medicalCert: data.medicalCert || null,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId
      }
    });

    return {
      meal,
      message: 'Solicitação de dieta especial criada. Aguardando aprovação.'
    };
  }
}
