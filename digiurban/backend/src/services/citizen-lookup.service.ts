/**
 * ============================================================================
 * CITIZEN LOOKUP SERVICE
 * ============================================================================
 *
 * Serviço centralizado para busca de cidadãos e membros da família
 * Usado para pré-preenchimento de formulários
 */

import { PrismaClient, Citizen, FamilyComposition } from '@prisma/client';

export interface FamilyCompositionWithMember extends FamilyComposition {
  member: {
    id: string;
    name: string;
    cpf: string;
    birthDate: Date | null;
    phone: string | null;
    email: string;
  };
}

export interface CitizenWithFamily extends Citizen {
  familyMembers?: FamilyCompositionWithMember[];
}

export class CitizenLookupService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    // Se não passar prisma, criar uma instância global
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Buscar cidadão por CPF (sem pontuação)
   */
  async findByCpf(cpf: string): Promise<CitizenWithFamily | null> {
    // Remover pontuação do CPF
    const cleanCpf = cpf.replace(/\D/g, '');

    const citizen = await this.prisma.citizen.findFirst({
      where: {
        cpf: cleanCpf,
        isActive: true
      },
      include: {
        familyAsHead: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                cpf: true,
                birthDate: true,
                phone: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!citizen) {
      return null;
    }

    return {
      ...citizen,
      familyMembers: citizen.familyAsHead
    };
  }

  /**
   * Buscar cidadão por ID
   */
  async findById(id: string): Promise<CitizenWithFamily | null> {
    const citizen = await this.prisma.citizen.findUnique({
      where: { id },
      include: {
        familyAsHead: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                cpf: true,
                birthDate: true,
                phone: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!citizen) {
      return null;
    }

    return {
      ...citizen,
      familyMembers: citizen.familyAsHead
    };
  }

  /**
   * Buscar cidadãos por nome (para autocomplete)
   */
  async searchByName(query: string, limit = 10): Promise<Citizen[]> {
    const citizens = await this.prisma.citizen.findMany({
      where: {
        name: {
          contains: query
        },
        isActive: true
      },
      take: limit,
      select: {
        id: true,
        cpf: true,
        name: true,
        email: true,
        phone: true,
        birthDate: true,
        address: true
      }
    });

    return citizens as Citizen[];
  }

  /**
   * Buscar membros da família de um cidadão
   */
  async getFamilyMembers(citizenId: string): Promise<FamilyComposition[]> {
    return await this.prisma.familyComposition.findMany({
      where: {
        headId: citizenId
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            cpf: true,
            birthDate: true,
            phone: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Verificar se cidadão existe e está ativo
   */
  async exists(citizenId: string): Promise<boolean> {
    const count = await this.prisma.citizen.count({
      where: {
        id: citizenId,
        isActive: true
      }
    });

    return count > 0;
  }

  /**
   * Obter dados básicos do cidadão (para pré-preenchimento)
   */
  async getBasicInfo(citizenId: string): Promise<{
    name: string;
    cpf: string;
    email: string;
    phone: string | null;
    birthDate: Date | null;
    address: any;
  } | null> {
    const citizen = await this.prisma.citizen.findUnique({
      where: { id: citizenId },
      select: {
        name: true,
        cpf: true,
        email: true,
        phone: true,
        birthDate: true,
        address: true
      }
    });

    return citizen;
  }

  /**
   * Validar se cidadão pode solicitar serviço
   * (verificações adicionais conforme necessário)
   */
  async canRequestService(citizenId: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const citizen = await this.prisma.citizen.findUnique({
      where: { id: citizenId },
      select: {
        isActive: true,
        verificationStatus: true
      }
    });

    if (!citizen) {
      return {
        allowed: false,
        reason: 'Cidadão não encontrado'
      };
    }

    if (!citizen.isActive) {
      return {
        allowed: false,
        reason: 'Cadastro inativo'
      };
    }

    if (citizen.verificationStatus === 'REJECTED') {
      return {
        allowed: false,
        reason: 'Cadastro rejeitado'
      };
    }

    return { allowed: true };
  }
}

// Instância singleton (opcional)
let citizenLookupServiceInstance: CitizenLookupService | null = null;

export function getCitizenLookupService(prisma: PrismaClient): CitizenLookupService {
  if (!citizenLookupServiceInstance) {
    citizenLookupServiceInstance = new CitizenLookupService(prisma);
  }
  return citizenLookupServiceInstance;
}
