/**
 * ============================================================================
 * TOURISM PROGRAM HANDLER - Inscrição em Programas Turísticos
 * ============================================================================
 */

import { prisma } from '../../../lib/prisma';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class TourismProgramHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'TourismProgram' || moduleEntity === 'tourism-program';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    try {
      // Se for inscrição em programa existente, incrementar contador
      if (requestData.programId) {
        await prisma.tourismProgram.update({
          where: { id: requestData.programId },
          data: {
            currentParticipants: { increment: parseInt(requestData.numberOfParticipants || '1') }
        }
        });
      }

      // Criar registro de atendimento turístico
      const attendance = await prisma.tourismAttendance.create({
        data: {
                    citizenId: protocol.citizenId,
          visitorName: requestData.participantName || requestData.name || 'Visitante',
          serviceType: 'inscricao_programa',
          subject: 'Inscrição em Programa Turístico',
          description: `Inscrição de ${requestData.participantName} no programa ${requestData.programId}`,
          touristProfile: {
            origin: requestData.origin,
            groupSize: parseInt(requestData.numberOfParticipants || '1'),
            interests: requestData.interests
        },
          protocol: protocol.number,
          serviceId: service.id,
          source: 'portal'
        }
        });

      return {
        success: true,
        entityId: attendance.id,
        entityType: 'TourismAttendance',
        data: attendance
        };
    } catch (error) {
      console.error('Erro ao processar inscrição em programa turístico:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
  }

  static async getByProtocol(protocol: string) {
    return await prisma.tourismAttendance.findFirst({
      where: { protocol }
        });
  }
}
