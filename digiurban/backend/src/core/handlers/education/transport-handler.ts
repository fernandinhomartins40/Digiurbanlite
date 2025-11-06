import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';

export class SchoolTransportHandler extends BaseModuleHandler {
  moduleType = 'education';
  entityName = 'SchoolTransport';

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

    // 2. Criar solicitação de transporte
    const transport = await tx.schoolTransport.create({
      data: {
                studentId: student?.id || null,
        route: data.route || 'A definir',
        shift: data.shift,
        address: data.address,
        status: 'pending',
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId || null
      }
    });

    return {
      student,
      transport,
      message: 'Solicitação de transporte criada. A rota será definida pela secretaria.'
    };
  }
}
