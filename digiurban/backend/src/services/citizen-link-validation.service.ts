/**
 * ============================================================================
 * CITIZEN LINK VALIDATION SERVICE
 * ============================================================================
 * Serviço para validar vínculos de cidadãos contra a composição familiar
 */

import { prisma } from '../lib/prisma';

interface ValidationResult {
  isValid: boolean;
  exists: boolean;
  relationship?: string;
  isDependent?: boolean;
  message: string;
}

export class CitizenLinkValidationService {
  /**
   * Valida se um cidadão está na composição familiar de outro
   */
  async validateFamilyLink(
    headCitizenId: string,
    memberCitizenId: string,
    expectedRelationship?: string
  ): Promise<ValidationResult> {
    try {
      // Buscar vínculo na composição familiar
      const familyLink = await prisma.familyComposition.findFirst({
        where: {
          headId: headCitizenId,
          memberId: memberCitizenId
        }
      });

      if (!familyLink) {
        return {
          isValid: false,
          exists: false,
          message: 'Vínculo familiar não encontrado'
        };
      }

      // Se um relacionamento específico foi esperado, validar
      if (expectedRelationship && familyLink.relationship !== expectedRelationship) {
        return {
          isValid: false,
          exists: true,
          relationship: familyLink.relationship,
          isDependent: familyLink.isDependent,
          message: `Relacionamento não corresponde. Esperado: ${expectedRelationship}, Encontrado: ${familyLink.relationship}`
        };
      }

      return {
        isValid: true,
        exists: true,
        relationship: familyLink.relationship,
        isDependent: familyLink.isDependent,
        message: 'Vínculo familiar validado com sucesso'
      };
    } catch (error) {
      console.error('Error validating family link:', error);
      return {
        isValid: false,
        exists: false,
        message: 'Erro ao validar vínculo familiar'
      };
    }
  }

  /**
   * Busca membros da família de um cidadão
   */
  async getFamilyMembers(citizenId: string, options?: {
    relationship?: string;
    onlyDependents?: boolean;
  }) {
    try {
      const where: any = {
        headId: citizenId
      };

      if (options?.relationship) {
        where.relationship = options.relationship;
      }

      if (options?.onlyDependents) {
        where.isDependent = true;
      }

      const familyMembers = await prisma.familyComposition.findMany({
        where,
        include: {
          member: {
            select: {
              id: true,
              name: true,
              cpf: true,
              email: true,
              phone: true,
              birthDate: true,
              rg: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      return {
        success: true,
        data: familyMembers.map(fm => ({
          id: fm.id,
          relationship: fm.relationship,
          isDependent: fm.isDependent,
          citizen: fm.member,
          createdAt: fm.createdAt
        }))
      };
    } catch (error) {
      console.error('Error fetching family members:', error);
      return {
        success: false,
        error: 'Erro ao buscar membros da família'
      };
    }
  }

  /**
   * Valida múltiplos vínculos de uma vez
   */
  async validateMultipleLinks(
    headCitizenId: string,
    links: Array<{
      citizenId: string;
      expectedRelationship?: string;
    }>
  ) {
    const results = await Promise.all(
      links.map(link =>
        this.validateFamilyLink(
          headCitizenId,
          link.citizenId,
          link.expectedRelationship
        )
      )
    );

    return {
      allValid: results.every(r => r.isValid),
      results
    };
  }

  /**
   * Busca cidadãos disponíveis para vinculação
   * (que estão na composição familiar do solicitante)
   */
  async getAvailableCitizensForLink(
    requesterId: string,
    linkType: string
  ) {
    try {
      // Definir filtros baseados no tipo de vínculo
      const where: any = {
        headId: requesterId
      };

      // Filtros específicos por tipo de vínculo
      switch (linkType) {
        case 'STUDENT':
          // Alunos geralmente são filhos dependentes
          where.relationship = { in: ['SON', 'DAUGHTER'] };
          where.isDependent = true;
          break;
        case 'DEPENDENT':
          where.isDependent = true;
          break;
        case 'COMPANION':
          // Acompanhantes podem ser qualquer familiar
          break;
        default:
          // Sem filtros adicionais
          break;
      }

      const familyMembers = await prisma.familyComposition.findMany({
        where,
        include: {
          member: {
            select: {
              id: true,
              name: true,
              cpf: true,
              email: true,
              phone: true,
              birthDate: true,
              rg: true
            }
          }
        }
      });

      return {
        success: true,
        data: familyMembers.map(fm => ({
          ...fm.member,
          relationship: fm.relationship,
          isDependent: fm.isDependent
        }))
      };
    } catch (error) {
      console.error('Error fetching available citizens:', error);
      return {
        success: false,
        error: 'Erro ao buscar cidadãos disponíveis'
      };
    }
  }

  /**
   * Sugere tipo de relacionamento baseado no tipo de vínculo
   */
  suggestRelationshipByLinkType(linkType: string): string[] {
    const suggestions: Record<string, string[]> = {
      STUDENT: ['SON', 'DAUGHTER'],
      GUARDIAN: ['PARENT'],
      DEPENDENT: ['SON', 'DAUGHTER', 'GRANDCHILD'],
      COMPANION: ['SPOUSE', 'SON', 'DAUGHTER', 'PARENT', 'SIBLING'],
      AUTHORIZED_PERSON: ['SPOUSE', 'SON', 'DAUGHTER', 'PARENT', 'SIBLING'],
      BENEFICIARY: ['SON', 'DAUGHTER', 'SPOUSE', 'PARENT']
    };

    return suggestions[linkType] || [];
  }
}

export const citizenLinkValidationService = new CitizenLinkValidationService();
