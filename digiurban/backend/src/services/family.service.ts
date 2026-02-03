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

import { FAMILY_VALIDATION_RULES, FAMILY_MESSAGES } from '../shared/constants/family.constants'

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

    return {
      head: citizen,
      members: familyMembers as any,
      memberOf: memberOf as any,
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
    data: AddFamilyMemberRequest
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
          error: FAMILY_MESSAGES.ERROR.MEMBER_NOT_FOUND
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
          error: FAMILY_MESSAGES.ERROR.CITIZEN_NOT_REGISTERED
        }
      }

      // Verificar se não está tentando adicionar a si mesmo
      if (headId === data.memberId) {
        return {
          success: false,
          error: FAMILY_MESSAGES.ERROR.CANNOT_ADD_SELF
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
          error: FAMILY_MESSAGES.ERROR.MEMBER_ALREADY_EXISTS
        }
      }

      // Validar relacionamento por idade
      const warnings = validateRelationshipByAge(
        data.relationship,
        member.birthDate,
        head.birthDate
      )

      // Criar vínculo familiar (com status PENDING aguardando confirmação do membro)
      const familyComposition = await prisma.familyComposition.create({
        data: {
          headId,
          memberId: data.memberId,
          relationship: data.relationship,
          isDependent: data.isDependent,
          status: FamilyLinkStatus.PENDING,
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
      await this.notifyFamilyLink(headId, data.memberId, data.relationship, 'CREATED')

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

  async updateFamilyMember(
    compositionId: string,
    data: UpdateFamilyMemberRequest
  ): Promise<FamilyMemberResult> {
    try {
      const composition = await prisma.familyComposition.findUnique({
        where: { id: compositionId },
        include: {
          head: { select: { birthDate: true } },
          member: { select: { birthDate: true } }
        }
      })

      if (!composition) {
        return {
          success: false,
          error: 'Composição familiar não encontrada'
        }
      }

      // Validar novo relacionamento se fornecido
      let warnings: ValidationWarning[] = []
      if (data.relationship) {
        warnings = validateRelationshipByAge(
          data.relationship,
          composition.member.birthDate,
          composition.head.birthDate
        )
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

  async removeFamilyMember(compositionId: string): Promise<FamilyMemberResult> {
    try {
      const composition = await prisma.familyComposition.findUnique({
        where: { id: compositionId },
        select: { headId: true, memberId: true, relationship: true }
      })

      if (!composition) {
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
          email: data.email,
          cpf: data.cpf,
          phone: data.phone,
          name: data.name,
          relationship: data.relationship,
          isDependent: data.isDependent || false,
          message: data.message,
          token,
          expiresAt,
          status: InviteStatus.PENDING
        }
      })

      // TODO: Enviar email com link de convite
      // await emailService.sendFamilyInvite(data.email, head.name, token)

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
          error: FAMILY_MESSAGES.ERROR.INVITE_NOT_FOUND
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
          error: FAMILY_MESSAGES.ERROR.INVITE_EXPIRED
        }
      }

      // Verificar se já foi respondido
      if (invite.status !== InviteStatus.PENDING) {
        return {
          success: false,
          error: 'Este convite já foi respondido'
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

          // Criar composição familiar (já ativo)
          await tx.familyComposition.create({
            data: {
              headId: invite.headId,
              memberId: citizenId,
              relationship: invite.relationship,
              isDependent: invite.isDependent,
              status: FamilyLinkStatus.ACTIVE,
              monthlyIncome: invite.monthlyIncome,
              occupation: invite.occupation,
              education: invite.education,
              hasDisability: invite.hasDisability
            }
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
          data: { message: FAMILY_MESSAGES.SUCCESS.INVITE_ACCEPTED }
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
          data: { message: FAMILY_MESSAGES.SUCCESS.INVITE_REJECTED }
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
  // ESTATÍSTICAS
  // ==========================================================================

  async calculateFamilyStats(citizenId: string) {
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
      pendingLinks
    }
  }

  // ==========================================================================
  // NOTIFICAÇÕES
  // ==========================================================================

  private async notifyFamilyLink(
    headId: string,
    memberId: string,
    relationship: FamilyRelationship,
    action: 'CREATED' | 'REMOVED' | 'CONFIRMED' | 'REJECTED' | 'ACCEPTED' | 'INVITE_REJECTED'
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

    const relationshipLabel = relationship // TODO: traduzir usando constants

    let titleForHead = ''
    let messageForHead = ''
    let titleForMember = ''
    let messageForMember = ''

    switch (action) {
      case 'CREATED':
        titleForMember = 'Novo vínculo familiar'
        messageForMember = `${head.name} adicionou você como ${relationshipLabel} na composição familiar. Confirme o vínculo.`
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
