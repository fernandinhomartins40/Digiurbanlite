/**
 * ============================================================================
 * CITIZEN FAMILY SERVICE
 * ============================================================================
 * Serviço para gerenciar dados da composição familiar e calcular
 * campos agregados (renda familiar total, número de dependentes, etc.)
 */

import { prisma } from '../lib/prisma';
import { FamilyRelationship } from '@prisma/client';

// ========================================
// TYPES
// ========================================

export interface FamilyMemberData {
  id: string;
  name: string;
  cpf: string;
  birthDate: Date | null;
  relationship: FamilyRelationship;
  isDependent: boolean;
  monthlyIncome: number;
  occupation: string | null;
  education: string | null;
  hasDisability: boolean | null;
  age: number | null;
}

export interface FamilyCompositionSummary {
  /** ID do chefe de família */
  headId: string;
  /** Dados do chefe */
  head: {
    id: string;
    name: string;
    cpf: string;
    occupation: string | null;
  };
  /** Total de membros (incluindo chefe) */
  totalMembers: number;
  /** Total de dependentes */
  totalDependents: number;
  /** Renda familiar total (soma de todos os membros) */
  totalFamilyIncome: number;
  /** Renda per capita */
  perCapitaIncome: number;
  /** Membros com deficiência */
  membersWithDisability: number;
  /** Membros em idade escolar (4-17 anos) */
  schoolAgeMembers: number;
  /** Membros em idade infantil (0-3 anos) */
  infantAgeMembers: number;
  /** Membros idosos (60+ anos) */
  elderlyMembers: number;
  /** Lista de membros */
  members: FamilyMemberData[];
  /** Metadados adicionais */
  metadata: {
    hasMinors: boolean;
    hasElders: boolean;
    hasDisabled: boolean;
    averageAge: number | null;
  };
}

// ========================================
// SERVICE CLASS
// ========================================

export class CitizenFamilyService {
  /**
   * Calcula a idade a partir da data de nascimento
   */
  private calculateAge(birthDate: Date | null): number | null {
    if (!birthDate) return null;

    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Obtém composição familiar completa com dados agregados
   */
  async getFamilyComposition(headId: string): Promise<FamilyCompositionSummary> {
    // Buscar chefe de família
    const head = await prisma.citizen.findUnique({
      where: { id: headId },
      select: {
        id: true,
        name: true,
        cpf: true,
        occupation: true,
        birthDate: true,
      },
    });

    if (!head) {
      throw new Error('Cidadão não encontrado');
    }

    // Buscar composição familiar
    const familyComposition = await prisma.familyComposition.findMany({
      where: { headId },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            cpf: true,
            birthDate: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Processar membros
    const members: FamilyMemberData[] = familyComposition.map((fc) => ({
      id: fc.member.id,
      name: fc.member.name,
      cpf: fc.member.cpf,
      birthDate: fc.member.birthDate,
      relationship: fc.relationship,
      isDependent: fc.isDependent,
      monthlyIncome: fc.monthlyIncome?.toNumber() || 0,
      occupation: fc.occupation,
      education: fc.education,
      hasDisability: fc.hasDisability,
      age: this.calculateAge(fc.member.birthDate),
    }));

    // Calcular agregados
    const totalMembers = members.length + 1; // +1 para o chefe
    const totalDependents = members.filter((m) => m.isDependent).length;

    // Renda familiar (incluir renda do chefe se disponível)
    const membersIncome = members.reduce((sum, m) => sum + m.monthlyIncome, 0);
    // Não temos renda do chefe no Citizen, então usar apenas membros
    const totalFamilyIncome = membersIncome;
    const perCapitaIncome = totalMembers > 0 ? totalFamilyIncome / totalMembers : 0;

    // Contadores por categoria
    const membersWithDisability = members.filter((m) => m.hasDisability === true).length;

    const schoolAgeMembers = members.filter((m) => {
      const age = m.age;
      return age !== null && age >= 4 && age <= 17;
    }).length;

    const infantAgeMembers = members.filter((m) => {
      const age = m.age;
      return age !== null && age >= 0 && age <= 3;
    }).length;

    const elderlyMembers = members.filter((m) => {
      const age = m.age;
      return age !== null && age >= 60;
    }).length;

    // Calcular idade média
    const ages = members.map((m) => m.age).filter((age): age is number => age !== null);
    const headAge = this.calculateAge(head.birthDate);
    if (headAge !== null) {
      ages.push(headAge);
    }
    const averageAge = ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : null;

    // Metadados
    const metadata = {
      hasMinors: members.some((m) => m.age !== null && m.age < 18),
      hasElders: elderlyMembers > 0 || (headAge !== null && headAge >= 60),
      hasDisabled: membersWithDisability > 0,
      averageAge,
    };

    return {
      headId,
      head: {
        id: head.id,
        name: head.name,
        cpf: head.cpf,
        occupation: head.occupation,
      },
      totalMembers,
      totalDependents,
      totalFamilyIncome,
      perCapitaIncome,
      membersWithDisability,
      schoolAgeMembers,
      infantAgeMembers,
      elderlyMembers,
      members,
      metadata,
    };
  }

  /**
   * Adiciona um membro à composição familiar
   */
  async addFamilyMember(
    headId: string,
    memberId: string,
    data: {
      relationship: FamilyRelationship;
      isDependent?: boolean;
      monthlyIncome?: number;
      occupation?: string;
      education?: string;
      hasDisability?: boolean;
    }
  ) {
    // Verificar se já existe
    const existing = await prisma.familyComposition.findUnique({
      where: {
        headId_memberId: {
          headId,
          memberId,
        },
      },
    });

    if (existing) {
      throw new Error('Este membro já está na composição familiar');
    }

    // Criar composição familiar
    const composition = await prisma.familyComposition.create({
      data: {
        headId,
        memberId,
        relationship: data.relationship,
        isDependent: data.isDependent || false,
        monthlyIncome: data.monthlyIncome,
        occupation: data.occupation,
        education: data.education,
        hasDisability: data.hasDisability,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            cpf: true,
            birthDate: true,
          },
        },
      },
    });

    return composition;
  }

  /**
   * Atualiza dados de um membro da composição familiar
   */
  async updateFamilyMember(
    headId: string,
    memberId: string,
    data: {
      relationship?: FamilyRelationship;
      isDependent?: boolean;
      monthlyIncome?: number;
      occupation?: string;
      education?: string;
      hasDisability?: boolean;
    }
  ) {
    const composition = await prisma.familyComposition.update({
      where: {
        headId_memberId: {
          headId,
          memberId,
        },
      },
      data: {
        ...(data.relationship && { relationship: data.relationship }),
        ...(data.isDependent !== undefined && { isDependent: data.isDependent }),
        ...(data.monthlyIncome !== undefined && { monthlyIncome: data.monthlyIncome }),
        ...(data.occupation !== undefined && { occupation: data.occupation }),
        ...(data.education !== undefined && { education: data.education }),
        ...(data.hasDisability !== undefined && { hasDisability: data.hasDisability }),
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            cpf: true,
          },
        },
      },
    });

    return composition;
  }

  /**
   * Remove um membro da composição familiar
   */
  async removeFamilyMember(headId: string, memberId: string) {
    await prisma.familyComposition.delete({
      where: {
        headId_memberId: {
          headId,
          memberId,
        },
      },
    });
  }

  /**
   * Verifica se um cidadão é dependente de outro
   */
  async isDependent(headId: string, memberId: string): Promise<boolean> {
    const composition = await prisma.familyComposition.findUnique({
      where: {
        headId_memberId: {
          headId,
          memberId,
        },
      },
      select: {
        isDependent: true,
      },
    });

    return composition?.isDependent || false;
  }

  /**
   * Busca todas as famílias onde um cidadão é membro
   */
  async getFamiliesWhereMember(citizenId: string) {
    const compositions = await prisma.familyComposition.findMany({
      where: { memberId: citizenId },
      include: {
        head: {
          select: {
            id: true,
            name: true,
            cpf: true,
          },
        },
      },
    });

    return compositions;
  }

  /**
   * Valida relacionamento familiar para vinculação em protocolo
   */
  async validateFamilyRelationship(
    headId: string,
    memberId: string,
    expectedRelationships: FamilyRelationship[]
  ): Promise<{
    valid: boolean;
    relationship?: FamilyRelationship;
    message?: string;
  }> {
    const composition = await prisma.familyComposition.findUnique({
      where: {
        headId_memberId: {
          headId,
          memberId,
        },
      },
    });

    if (!composition) {
      return {
        valid: false,
        message: 'Cidadão não está na composição familiar',
      };
    }

    const isValid = expectedRelationships.includes(composition.relationship);

    return {
      valid: isValid,
      relationship: composition.relationship,
      message: isValid
        ? 'Relacionamento válido'
        : `Relacionamento ${composition.relationship} não está entre os esperados: ${expectedRelationships.join(', ')}`,
    };
  }
}

// Exportar instância singleton
export const citizenFamilyService = new CitizenFamilyService();
