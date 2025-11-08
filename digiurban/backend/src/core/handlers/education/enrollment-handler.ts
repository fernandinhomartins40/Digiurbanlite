import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class StudentEnrollmentHandler extends BaseModuleHandler {
  moduleType = 'education';
  entityName = 'StudentEnrollmentRequest';

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

    // ✅ CRIAR solicitação de matrícula sem duplicação
    const enrollment = await tx.studentEnrollmentRequest.create({
      data: {
        citizenId: data.citizenId, // ✅ Apenas vincula ao cidadão
        studentName: data.studentName,
        studentBirthDate: new Date(data.birthDate),
        studentCpf: data.studentCpf || null,
        grade: data.desiredGrade,
        year: new Date().getFullYear(),
        schoolId: data.schoolId || null,
        specialNeeds: data.specialNeeds || null,
        observations: data.observations || null,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId
      }
    });

    return {
      enrollment,
      message: 'Solicitação de matrícula criada. Aguardando aprovação da secretaria.'
    };
  }
}
