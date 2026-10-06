/**
 * FAMILY SERVICE: Serviço Centralizado de Composição Familiar
 * Gerencia toda a lógica de negócio relacionada à composição familiar
 */

import { prisma } from '../lib/prisma'
import { Prisma } from '@prisma/client'
import * as crypto from 'crypto'

// Import shared utilities
import {
  calculateAge,
  validateRelationshipByAge,
  suggestRelationshipByAge,
  generateInviteToken,
  calculateExpirationDate,
  isExpired,
  getReverseRelationship
} from '../shared/utils/family.utils'

import {
  FamilyRelationship,
  FamilyLinkStatus,
  InviteStatus,
  AddFamilyMemberRequest,
  UpdateFamilyMemberRequest,
  SendFamilyInviteRequest,
  RespondToInviteRequest,
  FamilyData,
  ValidationWarning
} from '../shared/types/family.types'

import { FAMILY_VALIDATION_RULES, FAMILY_MESSAGES, RELATIONSHIP_LABELS } from '../shared/constants/family.constants'
import { portalLink, sendTemplatedMail } from './mail/templated'
import * as bcrypt from 'bcryptjs'
import { BCRYPT_ROUNDS } from '../config/security'
import { validateCPF } from '../utils/validators'
import { syncCitizenPersonIdentity } from './person-identity.service'
import { PasswordResetService } from './password-reset.service'

// ============================================================================
// INTERFACES LOCAIS
// ============================================================================

interface FamilyMemberResult {
  success: boolean
  data?: any
  warnings?: ValidationWarning[]
  error?: string
}

interface FamilyInviteResult {
  success: boolean
  data?: any
  error?: string
}

// ============================================================================
// FAMILY SERVICE CLASS
// ============================================================================

export class FamilyService {
  // ==========================================================================
  // COMPOSIÇÃO FAMILIAR - BUSCA
  // ==========================================================================

  /**
   * Busca composição familiar completa de um cidadão
   */
  async getFamilyComposition(citizenId: string): Promise<FamilyData> {
    // Buscar o cidadão
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      select: {
        id: true,
        name: true,
        cpf: true,
        email: true,
        phone: true,
        birthDate: true
      }
    })

    if (!citizen) {
      throw new Error('Cidadão não encontrado')
    }

    // Buscar membros onde o cidadão é responsável
    const familyMembers = await prisma.familyComposition.findMany({
      where: { headId: citizenId },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true,
            birthDate: true
          }
        }
      },
      orderBy: [{ relationship: 'asc' }, { member: { name: 'asc' } }]
    })

    // Buscar famílias onde o cidadão é membro
    const memberOf = await prisma.familyComposition.findMany({
      where: { memberId: citizenId },
      include: {
        head: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true,
            birthDate: true
          }
        }
      }
    })

    // Calcular estatísticas
    const stats = await this.calculateFamilyStats(citizenId)

    const maskCpf = (cpf: string) => (cpf ? `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**` : '')
    const firstNames = (name: string) => {
      const [first, ...rest] = String(name || '').trim().split(/\s+/)
      return [first, ...rest.map((part) => `${part[0]?.toUpperCase() ?? ''}.`)].join(' ')
    }

    // Quem ainda não confirmou o vínculo aparece só com nome abreviado e CPF
    // mascarado (antes vinham e-mail, telefone e nascimento de quem não aceitou)
    const members = familyMembers
      .filter((link) => link.status !== FamilyLinkStatus.REJECTED)
      .map((link) =>
        link.status === FamilyLinkStatus.ACTIVE
          ? link
          : {
              ...link,
              monthlyIncome: null,
              member: { id: link.member.id, name: firstNames(link.member.name), cpf: maskCpf(link.member.cpf), email: '', phone: null, birthDate: null },
            }
      )

    // Vínculos em que eu fui adicionado e ainda preciso responder
    const pendingLinks = memberOf
      .filter((link) => link.status === FamilyLinkStatus.PENDING)
      .map((link) => ({
        id: link.id,
        relationship: link.relationship as any,
        head: { id: link.head.id, name: link.head.name, cpf: maskCpf(link.head.cpf) },
      }))

    return {
      head: citizen,
      members: members as any,
      memberOf: memberOf.filter((link) => link.status === FamilyLinkStatus.ACTIVE) as any,
      pendingLinks,
      stats
    }
  }

  // ==========================================================================
  // COMPOSIÇÃO FAMILIAR - ADICIONAR MEMBRO
  // ==========================================================================

  /**
   * Adiciona um membro à composição familiar
   * IMPORTANTE: O cidadão DEVE já estar cadastrado no sistema
   */
  async addFamilyMember(
    headId: string,
    data: AddFamilyMemberRequest,
    options: { confirmedByStaff?: boolean } = {}
  ): Promise<FamilyMemberResult> {
    try {
      // Validar que o responsável existe
      const head = await prisma.citizen.findUnique({
        where: { id: headId },
        select: { id: true, name: true, birthDate: true }
      })

      if (!head) {
        return {
          success: false,
          error: FAMILY_MESSAGES.ERROR_MEMBER_NOT_FOUND
        }
      }

      // Validar que o membro existe
      const member = await prisma.citizen.findUnique({
        where: { id: data.memberId },
        select: { id: true, name: true, cpf: true, birthDate: true, email: true }
      })

      if (!member) {
        return {
          success: false,
          error: FAMILY_MESSAGES.ERROR_CITIZEN_NOT_REGISTERED
        }
      }

      // Verificar se não está tentando adicionar a si mesmo
      if (headId === data.memberId) {
        return {
          success: false,
          error: FAMILY_MESSAGES.ERROR_CANNOT_ADD_SELF
        }
      }

      // Verificar se já existe relacionamento
      const existingRelation = await prisma.familyComposition.findFirst({
        where: {
          headId,
          memberId: data.memberId
        }
      })

      if (existingRelation) {
        return {
          success: false,
          error: FAMILY_MESSAGES.ERROR_MEMBER_ALREADY_EXISTS
        }
      }

      // Validar relacionamento por idade
      const headAge = calculateAge(head.birthDate);
      const memberAge = calculateAge(member.birthDate);
      const validation = validateRelationshipByAge(headAge, memberAge, data.relationship);
      const warnings: ValidationWarning[] = [];

      if (!validation.valid && validation.warning) {
        warnings.push({
          type: 'age',
          message: validation.warning,
          severity: 'high'
        });
      } else if (validation.warning) {
        warnings.push({
          type: 'age',
          message: validation.warning,
          severity: 'medium'
        });
      }

      // Pelo app o familiar confirma; no balcão o servidor já conferiu a pessoa
      const familyComposition = await prisma.familyComposition.create({
        data: {
          headId,
          memberId: data.memberId,
          relationship: data.relationship,
          isDependent: data.isDependent,
          status: options.confirmedByStaff ? FamilyLinkStatus.ACTIVE : FamilyLinkStatus.PENDING,
          monthlyIncome: data.monthlyIncome,
          occupation: data.occupation,
          education: data.education,
          hasDisability: data.hasDisability
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              cpf: true,
              email: true,
              phone: true,
              birthDate: true
            }
          }
        }
      })

      // Criar notificação para o membro
      await this.notifyFamilyLink(headId, data.memberId, data.relationship, options.confirmedByStaff ? 'ADDED_BY_STAFF' : 'CREATED')

      return {
        success: true,
        data: familyComposition,
        warnings: warnings.length > 0 ? warnings : undefined
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao adicionar membro à família'
      }
    }
  }

  // ==========================================================================
  // COMPOSIÇÃO FAMILIAR - ATUALIZAR MEMBRO
  // ==========================================================================

  /**
   * `owner`: cidadão logado (só o responsável altera) ou ficha do servidor
   * (o vínculo precisa ser daquele cidadão). Antes qualquer cidadão alterava
   * o vínculo de qualquer família pelo id.
   */
  async updateFamilyMember(
    compositionId: string,
    data: UpdateFamilyMemberRequest,
    owner: { headId: string }
  ): Promise<FamilyMemberResult> {
    try {
      const composition = await prisma.familyComposition.findUnique({
        where: { id: compositionId },
        include: {
          head: { select: { birthDate: true } },
          member: { select: { birthDate: true } }
        }
      })

      if (!composition || composition.headId !== owner.headId) {
        return {
          success: false,
          error: 'Composição familiar não encontrada'
        }
      }

      // Validar novo relacionamento se fornecido
      const warnings: ValidationWarning[] = [];
      if (data.relationship) {
        const headAge = calculateAge(composition.head.birthDate);
        const memberAge = calculateAge(composition.member.birthDate);
        const validation = validateRelationshipByAge(headAge, memberAge, data.relationship);

        if (!validation.valid && validation.warning) {
          warnings.push({
            type: 'age',
            message: validation.warning,
            severity: 'high'
          });
        } else if (validation.warning) {
          warnings.push({
            type: 'age',
            message: validation.warning,
            severity: 'medium'
          });
        }
      }

      const updated = await prisma.familyComposition.update({
        where: { id: compositionId },
        data: {
          relationship: data.relationship,
          isDependent: data.isDependent,
          monthlyIncome: data.monthlyIncome,
          occupation: data.occupation,
          education: data.education,
          hasDisability: data.hasDisability
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              cpf: true,
              email: true,
              phone: true,
              birthDate: true
            }
          }
        }
      })

      return {
        success: true,
        data: updated,
        warnings: warnings.length > 0 ? warnings : undefined
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao atualizar membro'
      }
    }
  }

  // ==========================================================================
  // COMPOSIÇÃO FAMILIAR - REMOVER MEMBRO
  // ==========================================================================

  /** Remove o vínculo: só quem é parte dele (o responsável ou o próprio familiar, que pode sair). */
  async removeFamilyMember(compositionId: string, partyId: string): Promise<FamilyMemberResult> {
    try {
      const composition = await prisma.familyComposition.findUnique({
        where: { id: compositionId },
        select: { headId: true, memberId: true, relationship: true }
      })

      if (!composition || (composition.headId !== partyId && composition.memberId !== partyId)) {
        return {
          success: false,
          error: 'Composição familiar não encontrada'
        }
      }

      await prisma.familyComposition.delete({
        where: { id: compositionId }
      })

      // Notificar ambos
      await this.notifyFamilyLink(
        composition.headId,
        composition.memberId,
        composition.relationship as FamilyRelationship,
        'REMOVED'
      )

      return {
        success: true
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao remover membro'
      }
    }
  }

  // ==========================================================================
  // COMPOSIÇÃO FAMILIAR - CONFIRMAR/REJEITAR VÍNCULO
  // ==========================================================================

  async confirmFamilyLink(compositionId: string, citizenId: string): Promise<FamilyMemberResult> {
    try {
      const composition = await prisma.familyComposition.findUnique({
        where: { id: compositionId },
        select: { memberId: true, headId: true, status: true, relationship: true }
      })

      if (!composition) {
        return { success: false, error: 'Vínculo não encontrado' }
      }

      // Verificar se o cidadão é o membro
      if (composition.memberId !== citizenId) {
        return { success: false, error: 'Você não tem permissão para confirmar este vínculo' }
      }

      // Atualizar status para ACTIVE
      const updated = await prisma.familyComposition.update({
        where: { id: compositionId },
        data: { status: FamilyLinkStatus.ACTIVE }
      })

      // Notificar responsável
      await this.notifyFamilyLink(
        composition.headId,
        composition.memberId,
        composition.relationship as FamilyRelationship,
        'CONFIRMED'
      )

      return { success: true, data: updated }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async rejectFamilyLink(compositionId: string, citizenId: string): Promise<FamilyMemberResult> {
    try {
      const composition = await prisma.familyComposition.findUnique({
        where: { id: compositionId },
        select: { memberId: true, headId: true, relationship: true }
      })

      if (!composition) {
        return { success: false, error: 'Vínculo não encontrado' }
      }

      if (composition.memberId !== citizenId) {
        return { success: false, error: 'Você não tem permissão para rejeitar este vínculo' }
      }

      // Atualizar status para REJECTED
      await prisma.familyComposition.update({
        where: { id: compositionId },
        data: { status: FamilyLinkStatus.REJECTED }
      })

      // Notificar responsável
      await this.notifyFamilyLink(
        composition.headId,
        composition.memberId,
        composition.relationship as FamilyRelationship,
        'REJECTED'
      )

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // ==========================================================================
  // CONVITES - ENVIAR
  // ==========================================================================

  async sendFamilyInvite(
    headId: string,
    data: SendFamilyInviteRequest
  ): Promise<FamilyInviteResult> {
    try {
      const head = await prisma.citizen.findUnique({
        where: { id: headId },
        select: { name: true, email: true }
      })

      if (!head) {
        return { success: false, error: 'Cidadão não encontrado' }
      }

      // Verificar se já existe convite pendente para este email
      const existingInvite = await prisma.familyInvite.findFirst({
        where: {
          headId,
          email: data.email,
          status: InviteStatus.PENDING
        }
      })

      if (existingInvite) {
        return {
          success: false,
          error: 'Já existe um convite pendente para este email'
        }
      }

      // Verificar se o cidadão já está cadastrado
      if (data.cpf) {
        const existingCitizen = await prisma.citizen.findFirst({
          where: { cpf: data.cpf }
        })

        if (existingCitizen) {
          // Verificar se já não está na família
          const existingLink = await prisma.familyComposition.findFirst({
            where: {
              headId,
              memberId: existingCitizen.id
            }
          })

          if (existingLink) {
            return {
              success: false,
              error: 'Este cidadão já faz parte da composição familiar'
            }
          }
        }
      }

      // Gerar token único
      const token = generateInviteToken()
      const expiresAt = calculateExpirationDate()

      // Criar convite
      const invite = await prisma.familyInvite.create({
        data: {
          headId,
          email: data.email || data.memberEmail || '',
          cpf: data.cpf,
          phone: data.phone || data.memberPhone,
          name: data.name,
          relationship: data.relationship,
          isDependent: data.isDependent || false,
          message: data.message,
          token,
          expiresAt,
          status: InviteStatus.PENDING
        }
      })

      // E-mail do convite (modelo "family-invite"); não falha o convite
      if (invite.email) {
        portalLink(`/convites/familia/${token}`)
          .then((inviteUrl) =>
            sendTemplatedMail({
              template: 'family-invite',
              to: invite.email,
              variables: {
                inviteeName: (data.name || '').trim().split(' ')[0] || invite.email.split('@')[0],
                headName: head.name,
                relationship: RELATIONSHIP_LABELS[String(data.relationship)] || 'Familiar',
                expiresAt,
                inviteUrl,
              },
            })
          )
          .catch((error) => console.error('Erro ao enviar e-mail do convite familiar:', error))
      }

      return {
        success: true,
        data: {
          invite,
          inviteUrl: `/convites/familia/${token}`
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao enviar convite'
      }
    }
  }

  // ==========================================================================
  // CONVITES - RESPONDER
  // ==========================================================================

  async respondToInvite(
    citizenId: string,
    data: RespondToInviteRequest
  ): Promise<FamilyInviteResult> {
    try {
      const invite = await prisma.familyInvite.findUnique({
        where: { token: data.token },
        include: {
          head: {
            select: {
              id: true,
              name: true,
              birthDate: true
            }
          }
        }
      })

      if (!invite) {
        return {
          success: false,
          error: FAMILY_MESSAGES.ERROR_INVITE_NOT_FOUND
        }
      }

      // Verificar expiração
      if (isExpired(invite.expiresAt)) {
        await prisma.familyInvite.update({
          where: { id: invite.id },
          data: { status: InviteStatus.EXPIRED }
        })
        return {
          success: false,
          error: FAMILY_MESSAGES.ERROR_INVITE_EXPIRED
        }
      }

      // Verificar se já foi respondido
      if (invite.status !== InviteStatus.PENDING) {
        return {
          success: false,
          error: 'Este convite já foi respondido'
        }
      }

      if (invite.headId === citizenId) {
        return { success: false, error: 'Você não pode aceitar o seu próprio convite' }
      }

      // Convite feito para um CPF: só aquela pessoa aceita
      if (invite.cpf) {
        const me = await prisma.citizen.findUnique({ where: { id: citizenId }, select: { cpf: true } })
        if (!me || me.cpf.replace(/\D/g, '') !== invite.cpf.replace(/\D/g, '')) {
          return { success: false, error: 'Este convite foi feito para outra pessoa' }
        }
      }

      if (data.accept) {
        // Aceitar convite - criar vínculo familiar
        await prisma.$transaction(async (tx) => {
          // Atualizar status do convite
          await tx.familyInvite.update({
            where: { id: invite.id },
            data: { status: InviteStatus.ACCEPTED }
          })

          // Criar composição familiar (já ativo); se já havia vínculo pendente, confirma
          const linkData = {
            relationship: invite.relationship,
            isDependent: invite.isDependent,
            status: FamilyLinkStatus.ACTIVE,
            monthlyIncome: invite.monthlyIncome,
            occupation: invite.occupation,
            education: invite.education,
            hasDisability: invite.hasDisability
          }
          await tx.familyComposition.upsert({
            where: { headId_memberId: { headId: invite.headId, memberId: citizenId } },
            create: { headId: invite.headId, memberId: citizenId, ...linkData },
            update: linkData
          })
        })

        // Notificar responsável
        await this.notifyFamilyLink(
          invite.headId,
          citizenId,
          invite.relationship as FamilyRelationship,
          'ACCEPTED'
        )

        return {
          success: true,
          data: { message: FAMILY_MESSAGES.SUCCESS_INVITE_ACCEPTED }
        }
      } else {
        // Rejeitar convite
        await prisma.familyInvite.update({
          where: { id: invite.id },
          data: { status: InviteStatus.REJECTED }
        })

        // Notificar responsável
        await this.notifyFamilyLink(
          invite.headId,
          citizenId,
          invite.relationship as FamilyRelationship,
          'INVITE_REJECTED'
        )

        return {
          success: true,
          data: { message: FAMILY_MESSAGES.SUCCESS_INVITE_REJECTED }
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao responder convite'
      }
    }
  }

  // ==========================================================================
  // CONVITES - LISTAR
  // ==========================================================================

  async getFamilyInvites(headId: string) {
    return await prisma.familyInvite.findMany({
      where: { headId },
      orderBy: { createdAt: 'desc' }
    })
  }

  async getInviteByToken(token: string) {
    return await prisma.familyInvite.findUnique({
      where: { token },
      include: {
        head: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  }

  async cancelInvite(inviteId: string, headId: string): Promise<FamilyInviteResult> {
    try {
      const invite = await prisma.familyInvite.findUnique({
        where: { id: inviteId },
        select: { headId: true, status: true }
      })

      if (!invite) {
        return { success: false, error: 'Convite não encontrado' }
      }

      if (invite.headId !== headId) {
        return { success: false, error: 'Você não tem permissão para cancelar este convite' }
      }

      if (invite.status !== InviteStatus.PENDING) {
        return { success: false, error: 'Este convite não pode ser cancelado' }
      }

      await prisma.familyInvite.update({
        where: { id: inviteId },
        data: { status: InviteStatus.CANCELLED }
      })

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // ==========================================================================
  // DEPENDENTES SEM CONTA (crianças e adolescentes)
  // ==========================================================================

  /**
   * O responsável cadastra o filho (ou outro menor) que não tem conta: nasce
   * um cadastro sem login, já ligado à família como dependente. Adulto sem
   * conta é cadastrado no balcão, onde o servidor confere a pessoa.
   */
  async createDependent(
    headId: string,
    input: { name: string; cpf: string; birthDate: string; relationship: FamilyRelationship; hasDisability?: boolean }
  ): Promise<FamilyMemberResult> {
    try {
      const head = await prisma.citizen.findUnique({ where: { id: headId }, select: { id: true, cpf: true, address: true } })
      if (!head) return { success: false, error: 'Cidadão não encontrado' }

      const cpf = String(input.cpf || '').replace(/\D/g, '')
      const name = String(input.name || '').trim().replace(/\s+/g, ' ')
      const birthDate = new Date(input.birthDate)
      if (!validateCPF(cpf)) return { success: false, error: 'CPF inválido' }
      if (cpf === head.cpf) return { success: false, error: 'Este é o seu próprio CPF' }
      if (name.split(' ').length < 2) return { success: false, error: 'Informe o nome completo' }
      if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) return { success: false, error: 'Data de nascimento inválida' }
      const age = calculateAge(birthDate)
      if (age === null || age >= 18) {
        return { success: false, error: 'Aqui só dá para cadastrar menores de 18 anos. Para adultos, use "Adicionar pessoa" ou procure a prefeitura.' }
      }

      const dependents = await prisma.familyComposition.count({ where: { headId, isDependent: true } })
      if (dependents >= 15) return { success: false, error: 'Limite de dependentes atingido. Procure a prefeitura.' }

      let memberId: string
      const existing = await prisma.citizen.findFirst({ where: { cpf }, select: { id: true } })
      if (existing) {
        // já existe cadastro com esse CPF: não dá para puxar para a família só com o número
        // (quem soubesse o CPF de uma criança teria acesso aos pedidos dela)
        const mine = await prisma.familyComposition.findFirst({ where: { headId, memberId: existing.id }, select: { id: true } })
        return {
          success: false,
          error: mine
            ? 'Essa pessoa já está na sua família.'
            : 'Esse CPF já tem cadastro. Se a pessoa tem conta, use "Adicionar pessoa". Se é dependente de outro responsável, procure a prefeitura.',
        }
      } else {
        const created = await prisma.$transaction(async (tx) => {
          const citizen = await tx.citizen.create({
            data: {
              cpf,
              name,
              email: '',
              birthDate,
              // senha aleatória que ninguém conhece: o cadastro não tem login
              password: await bcrypt.hash(crypto.randomBytes(24).toString('base64url'), BCRYPT_ROUNDS),
              address: (head.address as Prisma.InputJsonValue) || undefined,
              registrationSource: 'FAMILY',
              verificationStatus: 'PENDING',
              isActive: true,
            },
          })
          await syncCitizenPersonIdentity(tx, {
            citizenId: citizen.id,
            currentPersonId: citizen.personId,
            cpf: citizen.cpf,
            name: citizen.name,
            email: null,
            phone: null,
            birthDate: citizen.birthDate,
            isActive: true,
          })
          return citizen
        })
        memberId = created.id
      }

      const link = await prisma.familyComposition.upsert({
        where: { headId_memberId: { headId, memberId } },
        create: {
          headId,
          memberId,
          relationship: input.relationship,
          isDependent: true,
          status: FamilyLinkStatus.ACTIVE,
          hasDisability: input.hasDisability ?? null,
        },
        update: { relationship: input.relationship, isDependent: true, status: FamilyLinkStatus.ACTIVE },
        include: { member: { select: { id: true, name: true, cpf: true, birthDate: true } } },
      })
      return { success: true, data: link }
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao cadastrar dependente' }
    }
  }

  /** Dependente sem login que é meu: devolve o cadastro ou null */
  private async ownedDependent(headId: string, memberId: string) {
    const link = await prisma.familyComposition.findFirst({
      where: { headId, memberId, status: FamilyLinkStatus.ACTIVE, isDependent: true },
      select: { member: { select: { id: true, name: true, email: true, registrationSource: true, cpf: true, personId: true, birthDate: true } } },
    })
    return link?.member && link.member.registrationSource === 'FAMILY' && !link.member.email ? link.member : null
  }

  /** Corrigir nome/nascimento do dependente sem login */
  async updateDependent(headId: string, memberId: string, input: { name?: string; birthDate?: string }): Promise<FamilyMemberResult> {
    try {
      const dependent = await this.ownedDependent(headId, memberId)
      if (!dependent) return { success: false, error: 'Dependente não encontrado' }
      const data: Prisma.CitizenUpdateInput = {}
      if (input.name !== undefined) {
        const name = String(input.name).trim().replace(/\s+/g, ' ')
        if (name.split(' ').length < 2) return { success: false, error: 'Informe o nome completo' }
        data.name = name
      }
      if (input.birthDate !== undefined) {
        const birthDate = new Date(input.birthDate)
        if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) return { success: false, error: 'Data de nascimento inválida' }
        data.birthDate = birthDate
      }
      const updated = await prisma.citizen.update({ where: { id: memberId }, data, select: { id: true, name: true, birthDate: true } })
      return { success: true, data: updated }
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao atualizar dependente' }
    }
  }

  /** O responsável informa um e-mail e o dependente recebe o link para criar a própria senha */
  async giveDependentAccess(headId: string, memberId: string, rawEmail: string): Promise<FamilyMemberResult> {
    try {
      const dependent = await this.ownedDependent(headId, memberId)
      if (!dependent) return { success: false, error: 'Dependente não encontrado ou já tem acesso' }
      const email = String(rawEmail || '').trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, error: 'E-mail inválido' }
      const taken = await prisma.citizen.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true } })
      if (taken) return { success: false, error: 'Esse e-mail já é usado em outro cadastro' }
      await prisma.citizen.update({ where: { id: memberId }, data: { email } })
      await new PasswordResetService().sendCitizenAccountCreated({ id: memberId, email, name: dependent.name })
      return { success: true, data: { message: 'Enviamos um e-mail para criar a senha.' } }
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao criar o acesso' }
    }
  }

  /** Pedidos dos meus dependentes (número, serviço e situação) */
  async listDependentsProtocols(headId: string) {
    const links = await prisma.familyComposition.findMany({
      where: { headId, status: FamilyLinkStatus.ACTIVE, isDependent: true },
      select: { memberId: true },
    })
    if (links.length === 0) return []
    const protocols = await prisma.protocolSimplified.findMany({
      where: { citizenId: { in: links.map((link) => link.memberId) } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        number: true,
        status: true,
        createdAt: true,
        citizen: { select: { id: true, name: true } },
        service: { select: { name: true } },
      },
    })
    return protocols.map((protocol) => ({
      id: protocol.id,
      number: protocol.number,
      status: protocol.status,
      createdAt: protocol.createdAt,
      serviceName: protocol.service?.name || 'Serviço',
      dependent: protocol.citizen ? { id: protocol.citizen.id, name: protocol.citizen.name } : null,
    }))
  }

  // ==========================================================================
  // ESTATÍSTICAS
  // ==========================================================================

  async calculateFamilyStats(requestedCitizenId: string) {
    // Quem não é responsável por ninguém mas faz parte de UMA família vê o
    // resumo dela (antes cada pessoa via números diferentes da mesma casa)
    let citizenId = requestedCitizenId
    const ownLinks = await prisma.familyComposition.count({ where: { headId: requestedCitizenId, status: FamilyLinkStatus.ACTIVE } })
    if (ownLinks === 0) {
      const memberOf = await prisma.familyComposition.findMany({
        where: { memberId: requestedCitizenId, status: FamilyLinkStatus.ACTIVE },
        select: { headId: true },
        take: 2,
      })
      if (memberOf.length === 1) citizenId = memberOf[0].headId
    }

    const members = await prisma.familyComposition.findMany({
      where: {
        headId: citizenId,
        status: FamilyLinkStatus.ACTIVE
      },
      include: {
        member: {
          select: {
            birthDate: true
          }
        }
      }
    })

    let totalMembers = members.length + 1 // +1 para incluir o responsável
    let totalDependents = members.filter((m) => m.isDependent).length
    let totalChildren = 0
    let totalElderly = 0
    let totalWithDisability = members.filter((m) => m.hasDisability).length
    let totalIncome = 0
    let ageSum = 0
    let ageCount = 0
    const membersByRelationship: Record<string, number> = {}

    for (const member of members) {
      const age = calculateAge(member.member.birthDate)

      if (age !== null) {
        if (age <= FAMILY_VALIDATION_RULES.CHILD_MAX_AGE) totalChildren++
        if (age >= FAMILY_VALIDATION_RULES.ELDERLY_MIN_AGE) totalElderly++
        ageSum += age
        ageCount++
      }

      if (member.monthlyIncome) {
        totalIncome += Number(member.monthlyIncome)
      }

      const rel = member.relationship.toString()
      membersByRelationship[rel] = (membersByRelationship[rel] || 0) + 1
    }

    const averageAge = ageCount > 0 ? ageSum / ageCount : null
    const incomePerCapita = totalMembers > 0 ? totalIncome / totalMembers : 0

    const pendingLinks = await prisma.familyComposition.count({
      where: {
        headId: citizenId,
        status: FamilyLinkStatus.PENDING
      }
    })

    const activeLinks = members.length

    return {
      totalMembers,
      totalDependents,
      totalChildren,
      totalElderly,
      totalWithDisability,
      totalIncome,
      incomePerCapita,
      averageAge,
      membersByRelationship,
      activeLinks,
      pendingLinks,
      activeMembersCount: activeLinks,
      pendingMembersCount: pendingLinks,
      relationshipCounts: membersByRelationship
    }
  }

  // ==========================================================================
  // NOTIFICAÇÕES
  // ==========================================================================

  private async notifyFamilyLink(
    headId: string,
    memberId: string,
    relationship: FamilyRelationship,
    action: 'CREATED' | 'ADDED_BY_STAFF' | 'REMOVED' | 'CONFIRMED' | 'REJECTED' | 'ACCEPTED' | 'INVITE_REJECTED'
  ) {
    const head = await prisma.citizen.findUnique({
      where: { id: headId },
      select: { name: true }
    })

    const member = await prisma.citizen.findUnique({
      where: { id: memberId },
      select: { name: true }
    })

    if (!head || !member) return

    const relationshipLabel = (RELATIONSHIP_LABELS[String(relationship)] || 'familiar').toLowerCase()

    let titleForHead = ''
    let messageForHead = ''
    let titleForMember = ''
    let messageForMember = ''

    switch (action) {
      case 'CREATED':
        titleForMember = 'Novo vínculo familiar'
        messageForMember = `${head.name} adicionou você como ${relationshipLabel} na composição familiar. Confirme o vínculo.`
        break
      case 'ADDED_BY_STAFF':
        titleForMember = 'Vínculo familiar registrado'
        messageForMember = `A prefeitura registrou você como ${relationshipLabel} na família de ${head.name}. Se não estiver certo, você pode sair em "Minha família".`
        break
      case 'CONFIRMED':
        titleForHead = 'Vínculo confirmado'
        messageForHead = `${member.name} confirmou o vínculo familiar como ${relationshipLabel}.`
        break
      case 'REJECTED':
        titleForHead = 'Vínculo rejeitado'
        messageForHead = `${member.name} rejeitou o vínculo familiar como ${relationshipLabel}.`
        break
      case 'REMOVED':
        titleForHead = 'Membro removido'
        messageForHead = `${member.name} foi removido da composição familiar.`
        titleForMember = 'Vínculo removido'
        messageForMember = `${head.name} removeu você da composição familiar.`
        break
      case 'ACCEPTED':
        titleForHead = 'Convite aceito'
        messageForHead = `${member.name} aceitou seu convite e foi adicionado à composição familiar.`
        break
      case 'INVITE_REJECTED':
        titleForHead = 'Convite recusado'
        messageForHead = `${member.name} recusou seu convite para composição familiar.`
        break
    }

    // Criar notificações
    if (titleForHead) {
      await prisma.notification.create({
        data: {
          citizenId: headId,
          title: titleForHead,
          message: messageForHead,
          type: 'INFO',
          channel: 'APP'
        }
      })
    }

    if (titleForMember) {
      await prisma.notification.create({
        data: {
          citizenId: memberId,
          title: titleForMember,
          message: messageForMember,
          type: 'INFO',
          channel: 'APP'
        }
      })
    }
  }
}

// Exportar instância única
export const familyService = new FamilyService()
