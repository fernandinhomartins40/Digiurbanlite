/**
 * ============================================================================
 * ACCESSIBILITY HANDLER - Rampas e Adaptações para Acessibilidade
 * ============================================================================
 *
 * Handler para solicitações de adequações de acessibilidade urbana.
 * Inclui: rampas, sinalização tátil, rebaixamento de calçadas, etc.
 */

import { prisma } from '../../../lib/prisma';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class AccessibilityHandler {
  private static readonly SUPPORTED_TYPE = 'accessibility';

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
          type: 'accessibility',
          description: requestData.description || protocol.description,
          location: requestData.location,
          coordinates: requestData.coordinates || null,
          photos: requestData.photos || null,
          status: 'pending',
          priority: 'high', // Acessibilidade sempre tem prioridade alta
          source: 'portal',
          metadata: {
            accessibilityType: requestData.accessibilityType, // "ramp", "tactile", "lowering", "handrail"
            currentBarrier: requestData.currentBarrier, // Descrição da barreira atual
            affectsDisabled: requestData.affectsDisabled || true,
            publicBuilding: requestData.publicBuilding || false,
            schoolNearby: requestData.schoolNearby || false,
            healthUnitNearby: requestData.healthUnitNearby || false,
            estimatedUsers: requestData.estimatedUsers, // Quantidade estimada de beneficiados
            urgencyJustification: requestData.urgencyJustification,
            technicalRequirements: requestData.technicalRequirements
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
      console.error('Erro ao criar solicitação de acessibilidade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
  }

  /**
   * Listar solicitações de acessibilidade
   */
  static async list(tenantId: string, filters?: {
    status?: string;
    accessibilityType?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
            type: 'accessibility'
        };

    if (filters?.status) where.status = filters.status;

    const [items, total] = await Promise.all([
      prisma.infrastructureProblem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
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
   * Avaliar e priorizar solicitação
   */
  static async evaluate(
    problemId: string,
    userId: string,
    evaluation: {
      technicalFeasibility: 'viable' | 'needs_study' | 'not_viable';
      estimatedCost: number;
      estimatedDuration: number; // dias
      priority: 'urgent' | 'high' | 'normal';
      notes: string;
    }
  ) {
    return await prisma.infrastructureProblem.update({
      where: { id: problemId },
      data: {
        priority: evaluation.priority,
        status: evaluation.technicalFeasibility === 'viable' ? 'in_progress' : 'pending',
        metadata: {
          evaluation: {
            evaluatedBy: userId,
            evaluatedAt: new Date(),
            ...evaluation
        }
        }
        }
        });
  }

  /**
   * Iniciar obra de acessibilidade
   */
  static async startWork(
    problemId: string,
    userId: string,
    contractor?: string,
    expectedCompletion?: Date
  ) {
    return await prisma.infrastructureProblem.update({
      where: { id: problemId },
      data: {
        status: 'in_progress',
        metadata: {
          workStarted: {
            startedBy: userId,
            startedAt: new Date(),
            contractor,
            expectedCompletion
        }
        }
        }
        });
  }

  /**
   * Concluir obra com inspeção
   */
  static async complete(
    problemId: string,
    userId: string,
    completion: {
      completionNotes: string;
      completionPhotos: any[];
      inspectionPassed: boolean;
      inspectionNotes?: string;
    }
  ) {
    return await prisma.infrastructureProblem.update({
      where: { id: problemId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolutionNotes: completion.completionNotes,
        metadata: {
          completion: {
            ...completion,
            completedAt: new Date()
        }
        }
        }
        });
  }

  /**
   * Estatísticas de acessibilidade
   */
  static async getStats(tenantId: string) {
    const [total, byStatus, byType] = await Promise.all([
      prisma.infrastructureProblem.count({
        where: { type: 'accessibility' }
        }),
      prisma.infrastructureProblem.groupBy({
        by: ['status'],
        where: { type: 'accessibility' },
        _count: true
        }),
      // Extrair tipos do metadata (precisa de query raw para JSON)
      prisma.infrastructureProblem.findMany({
        where: { type: 'accessibility' },
        select: { metadata: true }
      }),
    ]);

    return {
      total,
      byStatus,
      byType: this.groupByAccessibilityType(byType)
        };
  }

  private static groupByAccessibilityType(items: any[]) {
    const grouped: Record<string, number> = {};
    items.forEach((item) => {
      const type = (item.metadata as any)?.accessibilityType || 'unknown';
      grouped[type] = (grouped[type] || 0) + 1;
    });
    return grouped;
  }
}
