/**
 * ============================================================================
 * CULTURAL WORKSHOP HANDLER - Inscrição em Oficinas Culturais
 * ============================================================================
 */

import { prisma } from '../../../lib/prisma';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class CulturalWorkshopHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'CulturalWorkshop' || moduleEntity === 'cultural-workshop';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    try {
      // Para inscrições, incrementar contador de participantes
      if (requestData.workshopId) {
        await prisma.culturalWorkshop.update({
          where: { id: requestData.workshopId },
          data: {
            currentParticipants: { increment: 1 }
        }
        });
      }

      // Criar registro de atendimento cultural para rastreamento
      const attendance = await prisma.culturalAttendance.create({
        data: {
                    protocol: protocol.number,
          citizenId: protocol.citizenId,
          citizenName: requestData.participantName || 'Participante',
          contact: requestData.participantPhone || '',
          phone: requestData.participantPhone || '',
          email: requestData.participantEmail,
          type: 'inscricao_oficina',
          subject: `Inscrição em Oficina Cultural`,
          description: `Inscrição de ${requestData.participantName} na oficina ${requestData.workshopId}`,
          category: requestData.workshopCategory || 'geral',
          status: 'PENDING',
          serviceId: service.id,
          source: 'portal'
        }
        });

      return {
        success: true,
        entityId: attendance.id,
        entityType: 'CulturalAttendance',
        data: attendance
        };
    } catch (error) {
      console.error('Erro ao processar inscrição em oficina:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
  }

  static async getByProtocol(protocol: string) {
    return await prisma.culturalAttendance.findFirst({
      where: { protocol }
        });
  }
}
