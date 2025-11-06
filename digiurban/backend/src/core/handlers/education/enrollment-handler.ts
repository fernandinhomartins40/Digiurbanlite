import { BaseModuleHandler } from '../base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';
export class StudentEnrollmentHandler extends BaseModuleHandler {
  moduleType = 'education';
  entityName = 'StudentEnrollment';

  async execute(action: ModuleAction, tx: any) {
    const { data, protocol, serviceId } = action;

    // 1. Criar ou buscar estudante
    let student = null;

    if (data.studentCpf) {
      student = await tx.student.findFirst({
        where: {
                    cpf: data.studentCpf
        }
      });
    }

    if (!student) {
      student = await tx.student.create({
        data: {
                    name: data.studentName,
          birthDate: new Date(data.birthDate),
          cpf: data.studentCpf || null,
          parentName: data.parentName,
          parentPhone: data.parentPhone,
          address: data.address,
          specialNeeds: data.specialNeeds || null,
          isActive: true
        }
      });
    }

    // 2. Criar matrícula pendente (admin define a turma depois)
    const enrollment = await tx.studentEnrollment.create({
      data: {
                studentId: student.id,
        classId: null, // Admin define depois
        grade: data.desiredGrade,
        year: new Date().getFullYear(),
        status: 'pending_approval',
        protocol,
        serviceId,
        source: 'service',
        createdBy: data.citizenId || null
      }
    });

    return {
      student,
      enrollment,
      message: 'Matrícula criada com sucesso. Aguardando aprovação da secretaria.'
    };
  }
}
