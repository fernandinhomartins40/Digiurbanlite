// ============================================================
// URBAN PLANNING HANDLER - Atendimentos de Planejamento Urbano
// FASE 3: Planejamento Urbano
// ============================================================

import { BaseModuleHandler } from '../../../core/handlers/base-handler';
import { ModuleAction } from '../../../types/module-handler';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class UrbanPlanningAttendanceHandler extends BaseModuleHandler {
  moduleType = 'ATENDIMENTOS_PLANEJAMENTO';
  entityName = 'UrbanPlanningAttendance';

  async execute(action: ModuleAction, tx: PrismaTransaction): Promise<any> {
    const { data, protocol } = action;

    if (action.action === 'create') {
      return this.createAttendance(data, protocol, tx);
    }

    if (action.action === 'update') {
      return this.updateAttendance(data, tx);
    }

    if (action.action === 'resolve') {
      return this.resolveAttendance(data, tx);
    }

    throw new Error(`Action ${action.action} not supported`);
  }

  private async createAttendance(
    data: any,
    protocol: string,
    tx: PrismaTransaction
  ) {
    if (!data.citizenName || !data.citizenCpf || !data.subject || !data.description) {
      throw new Error('Campos obrigatórios: citizenName, citizenCpf, subject, description');
    }

    const attendance = await tx.urbanPlanningAttendance.create({
      data: {
        protocolId: protocol,
        citizenName: data.citizenName,
        citizenCpf: data.citizenCpf,
        citizenPhone: data.citizenPhone || data.telefone,
        citizenEmail: data.citizenEmail || data.email || null,
        subject: data.subject || data.assunto,
        description: data.description || data.descricao,
        attendanceType: data.attendanceType || data.tipoAtendimento || 'CONSULTA',
        category: data.category || data.categoria || null,
        priority: data.priority || data.prioridade || 'NORMAL',
        status: 'OPEN',
        isActive: true,
      },
    });

    return { attendance };
  }

  private async updateAttendance(data: any, tx: PrismaTransaction) {
    const { attendanceId, ...updateData } = data;

    const attendance = await tx.urbanPlanningAttendance.update({
      where: { id: attendanceId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return { attendance };
  }

  private async resolveAttendance(data: any, tx: PrismaTransaction) {
    const { attendanceId, resolution } = data;

    const attendance = await tx.urbanPlanningAttendance.update({
      where: { id: attendanceId },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { attendance };
  }

  async list(tx: PrismaTransaction, filters?: any): Promise<any> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (filters?.status) where.status = filters.status;
    if (filters?.citizenCpf) where.citizenCpf = filters.citizenCpf;

    const [items, total] = await Promise.all([
      tx.urbanPlanningAttendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      tx.urbanPlanningAttendance.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
}
