import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class SchoolMaterialHandler extends BaseModuleHandler {
  moduleType = 'education';
  entityName = 'SchoolMaterialRequest';

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

    // ✅ CRIAR solicitação de material sem duplicação
    const materialRequest = await tx.schoolMaterialRequest.create({
      data: {
        citizenId: data.citizenId, // ✅ Vincula ao cidadão (responsável)
        studentName: data.studentName,
        studentCpf: data.studentCpf || null,
        grade: data.grade,
        schoolId: data.schoolId || null,
        items: data.items || [],
        quantity: data.quantity || 1,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId
      }
    });

    return {
      materialRequest,
      message: 'Solicitação de material escolar criada. Aguardando aprovação.'
    };
  }
}
