/**
 * ============================================================================
 * SIGNAGE HANDLER - Placas, Faixas e Sinalização
 * ============================================================================
 *
 * Handler para solicitações relacionadas à sinalização viária e urbana.
 * Inclui: placas de trânsito, faixas de pedestres, sinalização horizontal/vertical
 */

import { prisma } from '../../../lib/prisma';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class SignageHandler {
  private static readonly SUPPORTED_TYPE = 'signage';

  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === this.SUPPORTED_TYPE;
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    try {
      const problem = await prisma.infrastructureProblem.create({
        data: {
                    protocol: protocol.number,
          serviceId: service.id,
          type: 'signage',
          description: requestData.description || protocol.description,
          location: requestData.location,
          coordinates: requestData.coordinates || null,
          photos: requestData.photos || null,
          status: 'pending',
          priority: this.calculatePriority(requestData),
          source: 'portal',
          metadata: {
            signageType: requestData.signageType, // "traffic_sign", "crosswalk", "horizontal", "vertical", "informative"
            issue: requestData.issue, // "missing", "damaged", "faded", "incorrectly_placed"
            trafficImpact: requestData.trafficImpact, // "low", "medium", "high"
            nearSchool: requestData.nearSchool || false,
            nearHospital: requestData.nearHospital || false,
            accidentHistory: requestData.accidentHistory || false,
            requestedSignType: requestData.requestedSignType, // Tipo específico de placa/sinalização
            additionalNotes: requestData.additionalNotes
        }
        }
        });

      return {
        success: true,
        entityId: problem.id,
        entityType: 'InfrastructureProblem',
        data: problem
        };
    } catch (error) {
      console.error('Erro ao criar solicitação de sinalização:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
  }

  /**
   * Calcula prioridade baseado na localização e impacto
   */
  private static calculatePriority(data: any): string {
    // Urgente: falta de sinalização perto de escola/hospital ou com histórico de acidentes
    if (
      (data.nearSchool || data.nearHospital || data.accidentHistory) &&
      data.issue === 'missing'
    ) {
      return 'urgent';
    }

    // Alta: sinalização danificada em área de alto tráfego
    if (data.trafficImpact === 'high' && data.issue === 'damaged') {
      return 'high';
    }

    // Normal: sinalização desgastada ou necessitando manutenção
    if (data.issue === 'faded' || data.trafficImpact === 'medium') {
      return 'normal';
    }

    // Baixa: outras situações
    return 'low';
  }

  /**
   * Listar solicitações de sinalização
   */
  static async list(tenantId: string, filters?: {
    status?: string;
    signageType?: string;
    issue?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
            type: 'signage'
        };

    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;

    const [items, total] = await Promise.all([
      prisma.infrastructureProblem.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ]
        }),
      prisma.infrastructureProblem.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
        }
        };
  }

  /**
   * Avaliar solicitação e planejar instalação/reparo
   */
  static async planWork(
    problemId: string,
    userId: string,
    plan: {
      signageSpecifications: string;
      materials: string[];
      estimatedCost: number;
      estimatedDuration: number; // horas
      needsTrafficManagement: boolean;
      scheduledDate?: Date;
      notes: string;
    }
  ) {
    return await prisma.infrastructureProblem.update({
      where: { id: problemId },
      data: {
        status: 'in_progress',
        metadata: {
          workPlan: {
            plannedBy: userId,
            plannedAt: new Date(),
            ...plan
        }
        }
        }
        });
  }

  /**
   * Executar instalação/reparo
   */
  static async executeWork(
    problemId: string,
    userId: string,
    execution: {
      teamMembers: string[];
      startTime: Date;
      endTime?: Date;
      materialsUsed: string[];
      completionPhotos?: any[];
      notes?: string;
    }
  ) {
    const updateData: any = {
      metadata: {
        execution: {
          executedBy: userId,
          ...execution
        }
        }
        };

    // Se tem endTime, marcar como concluído
    if (execution.endTime) {
      updateData.status = 'resolved';
      updateData.resolvedAt = execution.endTime;
      updateData.resolvedBy = userId;
      updateData.resolutionNotes = execution.notes || 'Trabalho concluído';
    }

    return await prisma.infrastructureProblem.update({
      where: { id: problemId },
      data: updateData
        });
  }

  /**
   * Inspecionar trabalho concluído
   */
  static async inspect(
    problemId: string,
    userId: string,
    inspection: {
      approved: boolean;
      notes: string;
      inspectionPhotos?: any[];
      issuesFound?: string[];
      needsCorrection?: boolean;
    }
  ) {
    return await prisma.infrastructureProblem.update({
      where: { id: problemId },
      data: {
        status: inspection.approved ? 'resolved' : 'in_progress',
        metadata: {
          inspection: {
            inspectedBy: userId,
            inspectedAt: new Date(),
            ...inspection
        }
        }
        }
        });
  }

  /**
   * Estatísticas de sinalização
   */
  static async getStats(tenantId: string) {
    const [total, pending, inProgress, resolved, byIssue, byPriority] = await Promise.all([
      prisma.infrastructureProblem.count({
        where: { type: 'signage' }
        }),
      prisma.infrastructureProblem.count({
        where: { type: 'signage', status: 'pending' }
        }),
      prisma.infrastructureProblem.count({
        where: { type: 'signage', status: 'in_progress' }
        }),
      prisma.infrastructureProblem.count({
        where: { type: 'signage', status: 'resolved' }
        }),
      prisma.infrastructureProblem.findMany({
        where: { type: 'signage' },
        select: { metadata: true }
      }),
      prisma.infrastructureProblem.groupBy({
        by: ['priority'],
        where: { type: 'signage' },
        _count: true
        }),
    ]);

    return {
      total,
      byStatus: { pending, inProgress, resolved },
      byIssue: this.groupByIssue(byIssue),
      byPriority
        };
  }

  private static groupByIssue(items: any[]) {
    const grouped: Record<string, number> = {};
    items.forEach((item) => {
      const issue = (item.metadata as any)?.issue || 'unknown';
      grouped[issue] = (grouped[issue] || 0) + 1;
    });
    return grouped;
  }
}
