import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class SchoolMealHandler extends BaseModuleHandler {
  moduleType = 'education';
  entityName = 'SchoolMeal';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    // 1. Buscar ou criar estudante
    let student = null;

    if (data.studentCpf) {
      student = await tx.student.findFirst({
        where: {
                    cpf: data.studentCpf
        }
      });
    }

    if (!student && data.studentName) {
      student = await tx.student.create({
        data: {
                    name: data.studentName,
          birthDate: data.birthDate ? new Date(data.birthDate) : new Date(),
          cpf: data.studentCpf || null,
          parentName: data.parentName,
          parentPhone: data.parentPhone,
          address: data.address,
          isActive: true
        }
      });
    }

    // 2. Criar solicitação de dieta especial
    const meal = await tx.schoolMeal.create({
      data: {
                studentId: student?.id || null,
        shift: data.shift,
        dietType: data.dietType,
        restrictions: data.restrictions,
        medicalCert: data.medicalCert || null,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId || null
      }
    });

    return {
      student,
      meal,
      message: 'Solicitação de dieta especial criada. Aguardando aprovação.'
    };
  }
}
