import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class SchoolTransferHandler extends BaseModuleHandler {
  moduleType = 'education';
  entityName = 'SchoolTransferRequest';

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

    // ✅ CRIAR solicitação de transferência sem duplicação
    const transferRequest = await tx.schoolTransferRequest.create({
      data: {
        citizenId: data.citizenId, // ✅ Vincula ao cidadão (responsável)
        studentName: data.studentName,
        studentCpf: data.studentCpf || null,
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
        createdBy: data.citizenId
      }
    });

    return {
      transferRequest,
      message: 'Solicitação de transferência criada. Aguardando processamento.'
    };
  }
}

// Alias para compatibilidade
export { SchoolTransferHandler as StudentTransferHandler };
