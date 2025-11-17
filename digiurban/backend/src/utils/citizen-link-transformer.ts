/**
 * ============================================================================
 * CITIZEN LINK TRANSFORMER
 * ============================================================================
 * Utilitários para transformar dados legacy (campos de texto livre)
 * em vínculos estruturados (ProtocolCitizenLink)
 */

import { prisma } from '../lib/prisma';
import { CitizenLinkType, ServiceRole } from '@prisma/client';

interface LegacyFormData {
  // Campos de aluno (Educação)
  nomeAluno?: string;
  cpfAluno?: string;
  dataNascimentoAluno?: string;
  rgAluno?: string;

  // Campos de responsável (Educação)
  nomeResponsavel?: string;
  cpfResponsavel?: string;
  parentescoResponsavel?: string;

  // Campos de acompanhante (Saúde)
  nomeAcompanhante?: string;
  cpfAcompanhante?: string;
  parentescoAcompanhante?: string;

  // Campos de familiar autorizado (Saúde)
  nomeFamiliarAutorizado?: string;
  cpfFamiliarAutorizado?: string;
  parentescoFamiliar?: string;

  // Outros campos
  [key: string]: any;
}

interface CitizenLinkData {
  linkedCitizenId: string;
  linkType: CitizenLinkType;
  relationship?: string;
  role: ServiceRole;
  contextData?: any;
  isVerified: boolean;
}

export class CitizenLinkTransformer {
  /**
   * Transforma dados legacy em vínculos estruturados
   */
  async transformLegacyData(
    formData: LegacyFormData,
    requesterId: string,
    moduleType?: string
  ): Promise<CitizenLinkData[]> {
    const links: CitizenLinkData[] = [];

    // Educação: Aluno
    if (formData.cpfAluno) {
      const student = await this.findOrSuggestCitizen({
        cpf: formData.cpfAluno,
        name: formData.nomeAluno,
        birthDate: formData.dataNascimentoAluno,
        rg: formData.rgAluno
      });

      if (student) {
        const link = await this.createStudentLink(
          student.id,
          requesterId,
          formData.parentescoResponsavel,
          formData
        );
        if (link) links.push(link);
      }
    }

    // Saúde: Acompanhante
    if (formData.cpfAcompanhante) {
      const companion = await this.findOrSuggestCitizen({
        cpf: formData.cpfAcompanhante,
        name: formData.nomeAcompanhante
      });

      if (companion) {
        const link = await this.createCompanionLink(
          companion.id,
          requesterId,
          formData.parentescoAcompanhante,
          formData
        );
        if (link) links.push(link);
      }
    }

    // Saúde: Familiar Autorizado
    if (formData.cpfFamiliarAutorizado) {
      const authorized = await this.findOrSuggestCitizen({
        cpf: formData.cpfFamiliarAutorizado,
        name: formData.nomeFamiliarAutorizado
      });

      if (authorized) {
        const link = await this.createAuthorizedPersonLink(
          authorized.id,
          requesterId,
          formData.parentescoFamiliar,
          formData
        );
        if (link) links.push(link);
      }
    }

    return links;
  }

  /**
   * Buscar cidadão ou sugerir criação
   */
  private async findOrSuggestCitizen(data: {
    cpf?: string;
    name?: string;
    birthDate?: string;
    rg?: string;
  }): Promise<{ id: string; isNew: boolean } | null> {
    if (!data.cpf) return null;

    // Buscar cidadão existente
    const existing = await prisma.citizen.findFirst({
      where: { cpf: data.cpf }
    });

    if (existing) {
      return { id: existing.id, isNew: false };
    }

    // Se não encontrou, retorna null para indicar que precisa ser criado
    // A criação deve ser feita em um contexto com UI para confirmação do usuário
    return null;
  }

  /**
   * Criar vínculo de aluno
   */
  private async createStudentLink(
    studentId: string,
    requesterId: string,
    relationship?: string,
    contextData?: any
  ): Promise<CitizenLinkData | null> {
    // Verificar se está na composição familiar
    const familyLink = await prisma.familyComposition.findFirst({
      where: {
        headId: requesterId,
        memberId: studentId
      }
    });

    return {
      linkedCitizenId: studentId,
      linkType: CitizenLinkType.STUDENT,
      relationship: familyLink?.relationship || relationship,
      role: ServiceRole.BENEFICIARY,
      contextData: this.extractStudentContext(contextData),
      isVerified: !!familyLink
    };
  }

  /**
   * Criar vínculo de acompanhante
   */
  private async createCompanionLink(
    companionId: string,
    requesterId: string,
    relationship?: string,
    contextData?: any
  ): Promise<CitizenLinkData | null> {
    const familyLink = await prisma.familyComposition.findFirst({
      where: {
        headId: requesterId,
        memberId: companionId
      }
    });

    return {
      linkedCitizenId: companionId,
      linkType: CitizenLinkType.COMPANION,
      relationship: familyLink?.relationship || relationship,
      role: ServiceRole.COMPANION,
      contextData: this.extractCompanionContext(contextData),
      isVerified: !!familyLink
    };
  }

  /**
   * Criar vínculo de pessoa autorizada
   */
  private async createAuthorizedPersonLink(
    authorizedId: string,
    requesterId: string,
    relationship?: string,
    contextData?: any
  ): Promise<CitizenLinkData | null> {
    const familyLink = await prisma.familyComposition.findFirst({
      where: {
        headId: requesterId,
        memberId: authorizedId
      }
    });

    return {
      linkedCitizenId: authorizedId,
      linkType: CitizenLinkType.AUTHORIZED_PERSON,
      relationship: familyLink?.relationship || relationship,
      role: ServiceRole.AUTHORIZED,
      contextData: this.extractAuthorizedContext(contextData),
      isVerified: !!familyLink
    };
  }

  /**
   * Extrair contexto específico do aluno
   */
  private extractStudentContext(data: any): any {
    if (!data) return {};

    const context: any = {};

    // Campos comuns de matrícula escolar
    if (data.serie) context.serie = data.serie;
    if (data.turno) context.turno = data.turno;
    if (data.escola) context.escola = data.escola;
    if (data.anoLetivo) context.anoLetivo = data.anoLetivo;
    if (data.necessidadeEspecial) context.necessidadeEspecial = data.necessidadeEspecial;
    if (data.observacoes) context.observacoes = data.observacoes;

    return Object.keys(context).length > 0 ? context : undefined;
  }

  /**
   * Extrair contexto específico do acompanhante
   */
  private extractCompanionContext(data: any): any {
    if (!data) return {};

    const context: any = {};

    if (data.motivoAcompanhamento) context.motivoAcompanhamento = data.motivoAcompanhamento;
    if (data.dataViagem) context.dataViagem = data.dataViagem;
    if (data.destino) context.destino = data.destino;

    return Object.keys(context).length > 0 ? context : undefined;
  }

  /**
   * Extrair contexto específico de pessoa autorizada
   */
  private extractAuthorizedContext(data: any): any {
    if (!data) return {};

    const context: any = {};

    if (data.tipoAutorizacao) context.tipoAutorizacao = data.tipoAutorizacao;
    if (data.validadeAutorizacao) context.validadeAutorizacao = data.validadeAutorizacao;

    return Object.keys(context).length > 0 ? context : undefined;
  }

  /**
   * Converte dados de vínculo para formato legacy (para compatibilidade)
   */
  toLegacyFormat(links: any[]): LegacyFormData {
    const legacy: LegacyFormData = {};

    for (const link of links) {
      const citizen = link.linkedCitizen;
      if (!citizen) continue;

      switch (link.linkType) {
        case 'STUDENT':
          legacy.nomeAluno = citizen.name;
          legacy.cpfAluno = citizen.cpf;
          legacy.dataNascimentoAluno = citizen.birthDate;
          legacy.rgAluno = citizen.rg;
          legacy.parentescoResponsavel = link.relationship;

          // Context data
          if (link.contextData) {
            Object.assign(legacy, link.contextData);
          }
          break;

        case 'COMPANION':
          legacy.nomeAcompanhante = citizen.name;
          legacy.cpfAcompanhante = citizen.cpf;
          legacy.parentescoAcompanhante = link.relationship;

          if (link.contextData) {
            Object.assign(legacy, link.contextData);
          }
          break;

        case 'AUTHORIZED_PERSON':
          legacy.nomeFamiliarAutorizado = citizen.name;
          legacy.cpfFamiliarAutorizado = citizen.cpf;
          legacy.parentescoFamiliar = link.relationship;

          if (link.contextData) {
            Object.assign(legacy, link.contextData);
          }
          break;
      }
    }

    return legacy;
  }
}

export const citizenLinkTransformer = new CitizenLinkTransformer();
