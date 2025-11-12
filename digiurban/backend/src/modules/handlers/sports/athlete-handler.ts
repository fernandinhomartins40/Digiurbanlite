/**
 * ============================================================================
 * ATHLETE HANDLER - Cadastro de Atletas
 * ============================================================================
 */

import { prisma } from '../../../lib/prisma';
import { ModuleExecutionContext, ModuleExecutionResult } from '../../types';

export class AthleteHandler {
  static canHandle(moduleEntity: string): boolean {
    return moduleEntity === 'Athlete' || moduleEntity === 'athlete';
  }

  static async execute(context: ModuleExecutionContext): Promise<ModuleExecutionResult> {
    const { protocol, service, requestData } = context;

    try {
      const athlete = await prisma.athlete.create({
        data: {
                    name: requestData.athleteName || requestData.studentName || 'Atleta',
          birthDate: requestData.birthDate ? new Date(requestData.birthDate) : new Date(),
          cpf: requestData.cpf || requestData.studentCpf || '',
          rg: requestData.rg,
          address: requestData.address || requestData.studentAddress || '',
          phone: requestData.phone || requestData.studentPhone || '',
          email: requestData.email || requestData.studentEmail,
          sport: requestData.sport || 'futebol',
          category: requestData.category || 'adulto',
          teamId: requestData.teamId,
          federationNumber: requestData.federationNumber,
          federationExpiry: requestData.federationExpiry ? new Date(requestData.federationExpiry) : null,
          medicalCertificate: JSON.stringify({
            hasValid: requestData.medicalCertificateValid === 'Sim',
            observations: requestData.medicalConditions
        }),
          isActive: true,
          protocol: protocol.number,
          serviceId: service.id,
          source: 'portal'
        }
        });

      return {
        success: true,
        entityId: athlete.id,
        entityType: 'Athlete',
        data: athlete
        };
    } catch (error) {
      console.error('Erro ao cadastrar atleta:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
  }

  static async getByProtocol(protocol: string) {
    return await prisma.athlete.findFirst({
      where: { protocol }
        });
  }
}
