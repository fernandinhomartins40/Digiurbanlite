import { prisma } from '../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Serviço para cálculo de estatísticas de composição familiar
 * Sprint 2: Melhorias na Composição Familiar
 */

interface FamilyStats {
  totalMembers: number;
  totalDependents: number;
  totalChildren: number;
  totalElderly: number;
  totalWithDisability: number;
  totalIncome: number;
  incomePerCapita: number;
  averageAge: number | null;
  membersByRelationship: Record<string, number>;
}

interface FamilyMemberWithAge {
  id: string;
  name: string;
  age: number | null;
  relationship: string;
  isDependent: boolean;
  monthlyIncome?: Decimal | null;
  hasDisability?: boolean | null;
}

export class FamilyStatsService {
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
   * Calcula estatísticas completas da composição familiar
   */
  async calculateStats(headId: string): Promise<FamilyStats> {
    // Buscar membros da família
    const members = await prisma.familyComposition.findMany({
      where: { headId },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            birthDate: true
          }
        }
      }
    });

    // Buscar dados do responsável (chefe da família)
    const head = await prisma.citizen.findUnique({
      where: { id: headId },
      select: {
        id: true,
        name: true,
        birthDate: true,
        familyIncome: true
      }
    });

    if (!head) {
      throw new Error('Cidadão responsável não encontrado');
    }

    // Preparar dados dos membros com idade
    const membersWithAge: FamilyMemberWithAge[] = members.map(m => ({
      id: m.member.id,
      name: m.member.name,
      age: this.calculateAge(m.member.birthDate),
      relationship: m.relationship,
      isDependent: m.isDependent,
      monthlyIncome: m.monthlyIncome,
      hasDisability: m.hasDisability
    }));

    // Incluir o responsável
    const headAge = this.calculateAge(head.birthDate);
    const allMembers = [
      {
        id: head.id,
        name: head.name,
        age: headAge,
        relationship: 'HEAD',
        isDependent: false,
        monthlyIncome: null,
        hasDisability: null
      },
      ...membersWithAge
    ];

    // Calcular estatísticas
    const totalMembers = allMembers.length;
    const totalDependents = membersWithAge.filter(m => m.isDependent).length;

    // Crianças: 0-17 anos
    const totalChildren = allMembers.filter(m => m.age !== null && m.age < 18).length;

    // Idosos: 60+ anos
    const totalElderly = allMembers.filter(m => m.age !== null && m.age >= 60).length;

    // Pessoas com deficiência
    const totalWithDisability = membersWithAge.filter(m => m.hasDisability === true).length;

    // Somar rendas
    const totalIncome = membersWithAge.reduce((sum, m) => {
      if (m.monthlyIncome) {
        return sum + Number(m.monthlyIncome);
      }
      return sum;
    }, 0);

    // Renda per capita
    const incomePerCapita = totalMembers > 0 ? totalIncome / totalMembers : 0;

    // Idade média
    const agesOnly = allMembers.map(m => m.age).filter((age): age is number => age !== null);
    const averageAge = agesOnly.length > 0
      ? agesOnly.reduce((sum, age) => sum + age, 0) / agesOnly.length
      : null;

    // Membros por tipo de relacionamento
    const membersByRelationship: Record<string, number> = {};
    membersWithAge.forEach(m => {
      const rel = m.relationship;
      membersByRelationship[rel] = (membersByRelationship[rel] || 0) + 1;
    });

    return {
      totalMembers,
      totalDependents,
      totalChildren,
      totalElderly,
      totalWithDisability,
      totalIncome,
      incomePerCapita: Math.round(incomePerCapita * 100) / 100, // 2 casas decimais
      averageAge: averageAge ? Math.round(averageAge * 10) / 10 : null, // 1 casa decimal
      membersByRelationship
    };
  }

  /**
   * Gera dados de pré-preenchimento para formulários de serviços públicos
   */
  async getFormPrefillData(citizenId: string) {
    const stats = await this.calculateStats(citizenId);

    return {
      // Campos padrão de composição familiar
      citizen_quantidadePessoasFamilia: stats.totalMembers,
      citizen_quantidadeCriancas: stats.totalChildren,
      citizen_quantidadeIdosos: stats.totalElderly,
      citizen_quantidadePCD: stats.totalWithDisability,
      citizen_rendaFamiliarMensal: stats.totalIncome,
      citizen_rendaPerCapita: stats.incomePerCapita,

      // Metadados adicionais
      _familyStats: {
        totalDependents: stats.totalDependents,
        averageAge: stats.averageAge,
        membersByRelationship: stats.membersByRelationship
      }
    };
  }

  /**
   * Valida a coerência entre relacionamento e idade
   */
  validateRelationshipByAge(relationship: string, birthDate: Date | null): string[] {
    const warnings: string[] = [];

    if (!birthDate) {
      return warnings;
    }

    const age = this.calculateAge(birthDate);
    if (age === null) {
      return warnings;
    }

    switch (relationship) {
      case 'FATHER':
      case 'MOTHER':
        if (age < 15) {
          warnings.push('Idade muito baixa para pai/mãe (menor que 15 anos)');
        }
        if (age > 100) {
          warnings.push('Idade muito alta para pai/mãe (maior que 100 anos)');
        }
        break;

      case 'GRANDFATHER':
      case 'GRANDMOTHER':
        if (age < 35) {
          warnings.push('Idade inconsistente para avô/avó (menor que 35 anos)');
        }
        break;

      case 'SON':
      case 'DAUGHTER':
        if (age > 80) {
          warnings.push('Idade muito alta para filho/filha. Considere usar outro relacionamento');
        }
        break;

      case 'GRANDSON':
      case 'GRANDDAUGHTER':
        if (age > 60) {
          warnings.push('Idade muito alta para neto/neta');
        }
        break;

      case 'BROTHER':
      case 'SISTER':
        // Sem validação específica de idade para irmãos
        break;

      case 'SPOUSE':
        if (age < 16) {
          warnings.push('Idade muito baixa para cônjuge (menor que 16 anos)');
        }
        break;
    }

    return warnings;
  }

  /**
   * Sugere o relacionamento mais provável baseado na idade
   */
  suggestRelationshipByAge(age: number, headAge: number | null): string[] {
    const suggestions: string[] = [];

    if (!headAge) {
      return suggestions;
    }

    const ageDiff = headAge - age;

    // Filho/filha: diferença de 15-60 anos
    if (ageDiff >= 15 && ageDiff <= 60) {
      if (age < 18) {
        suggestions.push('SON ou DAUGHTER (criança/adolescente)');
      } else {
        suggestions.push('SON ou DAUGHTER (adulto)');
      }
    }

    // Cônjuge: diferença de -15 a +15 anos
    if (Math.abs(ageDiff) <= 15 && age >= 16) {
      suggestions.push('SPOUSE');
    }

    // Pai/mãe: diferença de -60 a -15 anos
    if (ageDiff >= -60 && ageDiff <= -15) {
      suggestions.push('FATHER ou MOTHER');
    }

    // Avô/avó: diferença de -100 a -35 anos
    if (ageDiff >= -100 && ageDiff <= -35) {
      suggestions.push('GRANDFATHER ou GRANDMOTHER');
    }

    // Neto/neta: diferença de 35-100 anos
    if (ageDiff >= 35 && ageDiff <= 100) {
      suggestions.push('GRANDSON ou GRANDDAUGHTER');
    }

    // Irmão/irmã: diferença de -20 a +20 anos
    if (Math.abs(ageDiff) <= 20) {
      suggestions.push('BROTHER ou SISTER');
    }

    return suggestions;
  }
}

// Exportar instância singleton
export const familyStatsService = new FamilyStatsService();
