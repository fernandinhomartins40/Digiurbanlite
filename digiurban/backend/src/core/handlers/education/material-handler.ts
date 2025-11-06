import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class SchoolMaterialHandler extends BaseModuleHandler {
  moduleType = 'education';
  entityName = 'SchoolMaterialRequest';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    // 1. Buscar estudante se CPF fornecido
    let student = null;

    if (data.studentCpf) {
      student = await tx.student.findFirst({
        where: {
                    cpf: data.studentCpf
        }
      });
    }

    // 2. Criar solicitação de material
    const materialRequest = await tx.schoolMaterialRequest.create({
      data: {
                studentId: student?.id || null,
        studentName: data.studentName,
        grade: data.grade,
        schoolId: data.schoolId || null,
        items: data.items || [],
        quantity: data.quantity || 1,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId || null
      }
    });

    return {
      student,
      materialRequest,
      message: 'Solicitação de material escolar criada. Aguardando aprovação.'
    };
  }
}
