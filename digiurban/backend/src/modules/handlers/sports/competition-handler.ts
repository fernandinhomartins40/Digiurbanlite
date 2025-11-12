/**
 * ============================================================================
 * COMPETITION HANDLER - Inscrição em Competições
 * ============================================================================
 */

import { prisma } from '../../../lib/prisma';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class CompetitionHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'Competition' || moduleEntity === 'competition';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    try {
      // Se for inscrição em competição existente, incrementar contador
      if (requestData.competitionId) {
        await prisma.competition.update({
          where: { id: requestData.competitionId },
          data: {
            registeredTeams: { increment: 1 }
        }
        });
      }

      // Criar registro de atendimento esportivo para rastreamento
      const attendance = await prisma.sportsAttendance.create({
        data: {
                    citizenId: protocol.citizenId,
          citizenName: requestData.athleteName || 'Atleta',
          contact: requestData.phone || requestData.email || '',
          type: 'ATHLETE_REGISTRATION', // Enum válido do SportsAttendanceType
          serviceType: 'inscricao_competicao',
          description: `Inscrição na competição: ${requestData.competitionId || 'Nova competição'}`,
          sport: requestData.sport,
          protocol: protocol.number,
          serviceId: service.id,
          source: 'portal'
        }
        });

      return {
        success: true,
        entityId: attendance.id,
        entityType: 'SportsAttendance',
        data: attendance
        };
    } catch (error) {
      console.error('Erro ao processar inscrição em competição:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
  }

  static async getByProtocol(protocol: string) {
    return await prisma.sportsAttendance.findFirst({
      where: { protocol }
        });
  }
}
