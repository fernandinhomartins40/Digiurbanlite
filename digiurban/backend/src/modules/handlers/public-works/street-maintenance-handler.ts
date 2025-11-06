/**
 * ============================================================================
 * STREET MAINTENANCE HANDLER - Pavimentação e Calçadas
 * ============================================================================
 *
 * Handler para solicitações de manutenção de ruas e calçadas.
 * Tipos: pavement (pavimentação), sidewalk (calçada)
 */

import { prisma } from '../../../lib/prisma';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class StreetMaintenanceHandler {
  private static readonly SUPPORTED_TYPES = ['pavement', 'sidewalk'];

  static canHandle(moduleEntity: string): boolean {
    return this.SUPPORTED_TYPES.includes(moduleEntity);
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    try {
      const problem = await prisma.infrastructureProblem.create({
        data: {
                    protocol: protocol.number,
          serviceId: service.id,
          type: service.moduleEntity || 'pavement',
          description: requestData.description || protocol.description,
          location: requestData.location,
          coordinates: requestData.coordinates || null,
          photos: requestData.photos || null,
          status: 'pending',
          priority: this.calculatePriority(requestData),
          source: 'portal',
          metadata: {
            maintenanceType: requestData.maintenanceType, // "asphalt", "concrete", "pavers", etc.
            affectedLength: requestData.affectedLength, // metros
            affectedWidth: requestData.affectedWidth,
            condition: requestData.condition, // "poor", "fair", "critical"
            trafficVolume: requestData.trafficVolume, // "low", "medium", "high"
            urgencyReason: requestData.urgencyReason,
            estimatedCost: requestData.estimatedCost
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
      console.error('Erro ao criar solicitação de manutenção:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
  }

  private static calculatePriority(data: any): string {
    // Urgente: condição crítica com alto volume de tráfego
    if (data.condition === 'critical' && data.trafficVolume === 'high') {
      return 'urgent';
    }

    // Alta: condição ruim ou calçada com problema de acessibilidade
    if (data.condition === 'poor' || data.accessibilityIssue) {
      return 'high';
    }

    // Normal: casos padrão
    if (data.trafficVolume === 'medium') {
      return 'normal';
    }

    return 'low';
  }

  /**
   * Busca solicitações de manutenção de ruas
   */
  static async list(tenantId: string, filters?: {
    type?: string;
    status?: string;
    condition?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
            type: { in: this.SUPPORTED_TYPES }
        };

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;

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
   * Aprovar solicitação e agendar obra
   */
  static async approve(problemId: string, userId: string, scheduledDate?: Date) {
    return await prisma.infrastructureProblem.update({
      where: { id: problemId },
      data: {
        status: 'in_progress',
        metadata: {
          approvedBy: userId,
          approvedAt: new Date(),
          scheduledDate
        }
        }
        });
  }

  /**
   * Concluir manutenção
   */
  static async complete(problemId: string, userId: string, notes: string, completionPhotos?: any) {
    return await prisma.infrastructureProblem.update({
      where: { id: problemId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolutionNotes: notes,
        metadata: {
          completionPhotos,
          completedAt: new Date()
        }
        }
        });
  }
}
