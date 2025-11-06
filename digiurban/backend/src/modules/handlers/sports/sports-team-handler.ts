/**
 * ============================================================================
 * SPORTS TEAM HANDLER - Cadastro de Equipes Esportivas
 * ============================================================================
 */

import { prisma } from '../../../lib/prisma';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class SportsTeamHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'SportsTeam' || moduleEntity === 'sports-team';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    try {
      const team = await prisma.sportsTeam.create({
        data: {
                    name: requestData.teamName || 'Equipe Esportiva',
          sport: requestData.sport || 'futebol',
          category: requestData.category || 'adulto',
          ageGroup: requestData.ageGroup || requestData.category || 'adulto',
          gender: requestData.gender || 'misto',
          coach: requestData.coachName || 'Técnico',
          coachPhone: requestData.coachPhone,
          trainingSchedule: requestData.trainingSchedule ? JSON.stringify({ schedule: requestData.trainingSchedule }) : undefined,
          maxPlayers: parseInt(requestData.numberOfPlayers || '20'),
          currentPlayers: parseInt(requestData.numberOfPlayers || '0'),
          isActive: true,
          protocol: protocol.number,
          serviceId: service.id,
          source: 'portal'
        }
        });

      return {
        success: true,
        entityId: team.id,
        entityType: 'SportsTeam',
        data: team
        };
    } catch (error) {
      console.error('Erro ao cadastrar equipe esportiva:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
  }

  static async getByProtocol(protocol: string) {
    return await prisma.sportsTeam.findFirst({
      where: { protocol }
        });
  }
}
