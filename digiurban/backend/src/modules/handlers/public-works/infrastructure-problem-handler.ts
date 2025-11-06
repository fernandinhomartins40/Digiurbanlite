/**
 * ============================================================================
 * INFRASTRUCTURE PROBLEM HANDLER - Buracos, Iluminação, Vazamentos, Esgoto
 * ============================================================================
 *
 * Handler especializado para problemas de infraestrutura urbana.
 * Tipos suportados: pothole (buraco), lighting (iluminação), leak (vazamento), sewer (esgoto)
 */

import { prisma } from '../../../lib/prisma';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class InfrastructureProblemHandler {
  /**
   * Tipos de problemas suportados
   */
  private static readonly SUPPORTED_TYPES = [
    'pothole',    // Buraco na rua
    'lighting',   // Problema de iluminação
    'leak',       // Vazamento de água
    'sewer',      // Problema de esgoto
  ];

  /**
   * Verifica se este handler pode processar a solicitação
   */
  static canHandle(moduleEntity: string): boolean {
    return this.SUPPORTED_TYPES.includes(moduleEntity);
  }

  /**
   * Executa a criação do problema de infraestrutura
   */
  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    try {
      // Criar registro de problema de infraestrutura
      const problem = await prisma.infrastructureProblem.create({
        data: {
                    protocol: protocol.number,
          serviceId: service.id,
          type: service.moduleEntity || 'pothole',
          description: requestData.description || protocol.description,
          location: requestData.location,
          coordinates: requestData.coordinates || null,
          photos: requestData.photos || null,
          status: 'pending',
          priority: this.calculatePriority(requestData),
          source: 'portal',
          metadata: {
            size: requestData.size,
            depth: requestData.depth,
            affectedArea: requestData.affectedArea,
            trafficImpact: requestData.trafficImpact,
            reportedBy: requestData.reporterName || 'Cidadão',
            additionalInfo: requestData.additionalInfo
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
      console.error('Erro ao criar problema de infraestrutura:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
  }

  /**
   * Calcula prioridade baseado no tipo e impacto
   */
  private static calculatePriority(data: any): string {
    // Urgente: vazamento ou esgoto com grande impacto
    if ((data.type === 'leak' || data.type === 'sewer') && data.trafficImpact === 'high') {
      return 'urgent';
    }

    // Alta: buraco grande ou iluminação em área crítica
    if (data.size === 'large' || (data.type === 'lighting' && data.criticalArea)) {
      return 'high';
    }

    // Normal: casos padrão
    if (data.size === 'medium' || data.trafficImpact === 'medium') {
      return 'normal';
    }

    // Baixa: problemas menores
    return 'low';
  }

  /**
   * Busca problemas de infraestrutura
   */
  static async list(tenantId: string, filters?: {
    type?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;

    const [problems, total] = await Promise.all([
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
      problems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
        }
        };
  }

  /**
   * Atualiza status do problema
   */
  static async updateStatus(
    problemId: string,
    status: string,
    userId?: string,
    notes?: string
  ) {
    const updateData: any = {
      status,
      updatedAt: new Date()
        };

    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = userId;
      updateData.resolutionNotes = notes;
    }

    return await prisma.infrastructureProblem.update({
      where: { id: problemId },
      data: updateData
        });
  }

  /**
   * Busca problema por ID
   */
  static async getById(problemId: string) {
    return await prisma.infrastructureProblem.findUnique({
      where: { id: problemId }
        });
  }

  /**
   * Busca problema por protocolo
   */
  static async getByProtocol(protocol: string) {
    return await prisma.infrastructureProblem.findFirst({
      where: { protocol }
        });
  }

  /**
   * Estatísticas de problemas
   */
  static async getStats(tenantId: string) {
    const [total, pending, inProgress, resolved, byType, byPriority] = await Promise.all([
      prisma.infrastructureProblem.count({ where: {} }),
      prisma.infrastructureProblem.count({ where: { status: 'pending' } }),
      prisma.infrastructureProblem.count({ where: { status: 'in_progress' } }),
      prisma.infrastructureProblem.count({ where: { status: 'resolved' } }),
      prisma.infrastructureProblem.groupBy({
        by: ['type'],
                _count: true
        }),
      prisma.infrastructureProblem.groupBy({
        by: ['priority'],
                _count: true
        }),
    ]);

    return {
      total,
      byStatus: { pending, inProgress, resolved },
      byType,
      byPriority
        };
  }
}
