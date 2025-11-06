import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class SchoolTransferHandler extends BaseModuleHandler {
  moduleType = 'education';
  entityName = 'SchoolTransferRequest';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    // 1. Buscar estudante
    let student = null;

    if (data.studentCpf) {
      student = await tx.student.findFirst({
        where: {
                    cpf: data.studentCpf
        }
      });
    }

    // 2. Criar solicitação de transferência
    const transferRequest = await tx.schoolTransferRequest.create({
      data: {
                studentId: student?.id || null,
        studentName: data.studentName,
        currentSchool: data.currentSchool || null,
        targetSchool: data.targetSchool || null,
        targetSchoolName: data.targetSchoolName,
        grade: data.grade,
        reason: data.reason,
        documents: data.documents || null,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId || null
      }
    });

    return {
      student,
      transferRequest,
      message: 'Solicitação de transferência criada. Aguardando processamento.'
    };
  }
}

// Alias para compatibilidade
export { SchoolTransferHandler as StudentTransferHandler };
