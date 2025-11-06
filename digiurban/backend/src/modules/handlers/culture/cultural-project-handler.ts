/**
 * ============================================================================
 * CULTURAL PROJECT HANDLER - Inscrição em Projetos Culturais
 * ============================================================================
 */

import { prisma } from '../../../lib/prisma';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class CulturalProjectHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'CulturalProject' || moduleEntity === 'cultural-project';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    try {
      const project = await prisma.culturalProject.create({
        data: {
                    name: requestData.projectTitle || 'Projeto Cultural',
          description: requestData.projectDescription || protocol.description,
          type: requestData.projectCategory || 'geral',
          responsible: requestData.responsibleName || 'Responsável',
          contact: JSON.stringify({
            phone: requestData.responsiblePhone,
            email: requestData.responsibleEmail,
            cpf: requestData.responsibleCpf
        }),
          startDate: requestData.startDate ? new Date(requestData.startDate) : new Date(),
          endDate: requestData.endDate ? new Date(requestData.endDate) : new Date(),
          budget: parseFloat(requestData.projectBudget || '0'),
          funding: requestData.fundingSource ? JSON.stringify({ source: requestData.fundingSource }) : undefined,
          targetAudience: requestData.targetAudience ? JSON.stringify(requestData.targetAudience) : undefined,
          participants: parseInt(requestData.expectedParticipants || '0'),
          status: 'PLANNING',
          protocol: protocol.number,
          serviceId: service.id,
          source: 'portal'
        }
        });

      return {
        success: true,
        entityId: project.id,
        entityType: 'CulturalProject',
        data: project
        };
    } catch (error) {
      console.error('Erro ao criar projeto cultural:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
  }

  static async getByProtocol(protocol: string) {
    return await prisma.culturalProject.findFirst({
      where: { protocol }
        });
  }

  static async updateStatus(projectId: string, status: string) {
    return await prisma.culturalProject.update({
      where: { id: projectId },
      data: { status, updatedAt: new Date() }
        });
  }
}
