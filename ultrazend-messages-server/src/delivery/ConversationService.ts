import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { ParticipantType, ConversationType } from '@prisma/client';
import { ensureActiveMessageServerId } from '../utils/messageServer';
import { resolveTenantId } from '../utils/tenant';
import { canReadConversation, isAttendant, NOTICES_PARTICIPANT_ID } from '../server/accessControl';

/** Até quantas conversas a lista traz (as mais recentes primeiro) */
const LIST_LIMIT = 100;

export class ConversationService {
  /**
   * Nomes dos participantes de VÁRIAS conversas com 2 consultas (antes eram
   * 2 consultas por conversa — a lista de um servidor com 100 conversas fazia 200).
   */
  private async enrichMany(conversations: any[]) {
    const citizenIds = new Set<string>();
    const userIds = new Set<string>();
    for (const c of conversations) {
      for (const [id, type] of [
        [c.participant1Id, c.participant1Type],
        [c.participant2Id, c.participant2Type],
      ]) {
        if (type === 'CITIZEN') citizenIds.add(id);
        if (type === 'SERVER') userIds.add(id);
      }
      if (c.metadata?.takenOverBy) userIds.add(String(c.metadata.takenOverBy));
    }
    const [citizens, users] = await Promise.all([
      citizenIds.size
        ? prisma.citizen.findMany({ where: { id: { in: [...citizenIds] } }, select: { id: true, name: true, avatar: true } })
        : Promise.resolve([] as Array<{ id: string; name: string; avatar: string | null }>),
      userIds.size
        ? prisma.user.findMany({ where: { id: { in: [...userIds] } }, select: { id: true, name: true } })
        : Promise.resolve([] as Array<{ id: string; name: string }>),
    ]);
    const citizenById = new Map(citizens.map((c) => [c.id, c]));
    const userById = new Map(users.map((u) => [u.id, u]));

    return conversations.map((conversation) => {
      const metadata: any = { ...(conversation.metadata || {}) };
      const fill = (n: 1 | 2) => {
        const id = conversation[`participant${n}Id`];
        const type = conversation[`participant${n}Type`];
        if (type === 'CITIZEN') {
          const citizen = citizenById.get(id);
          if (citizen) {
            metadata[`citizen${n}Name`] = citizen.name;
            if (citizen.avatar) metadata[`citizen${n}Avatar`] = citizen.avatar;
          }
        } else if (type === 'SERVER') {
          const user = userById.get(id);
          if (user) metadata[`server${n}Name`] = user.name;
        } else if (id === NOTICES_PARTICIPANT_ID) {
          metadata.systemName = 'Avisos da Prefeitura';
        }
      };
      fill(1);
      fill(2);
      // O frontend decide qual nome mostrar conforme quem está logado
      metadata.citizenName = metadata.citizen1Name || metadata.citizen2Name;
      metadata.serverName = metadata.server1Name || metadata.server2Name;
      metadata.avatar = metadata.citizen1Avatar || metadata.citizen2Avatar;
      if (metadata.takenOverBy) metadata.attendantName = userById.get(String(metadata.takenOverBy))?.name || null;
      metadata.isNotices = conversation.participant2Id === NOTICES_PARTICIPANT_ID;
      return { ...conversation, metadata };
    });
  }

  private async enrichConversationWithNames(conversation: any) {
    try {
      return (await this.enrichMany([conversation]))[0];
    } catch (error) {
      logger.error('Error enriching conversation with names', { error, conversationId: conversation.id });
      return conversation;
    }
  }

  async findOrCreateConversation(params: {
    participant1Id: string;
    participant1Type: ParticipantType;
    participant2Id: string;
    participant2Type: ParticipantType;
    protocolId?: string;
    departmentId?: string;
    type?: ConversationType;
    /** município de quem abre a conversa (vale quando não há cidadão nela) */
    tenantId?: string;
  }) {
    try {
      const { participant1Id, participant1Type, participant2Id, participant2Type, protocolId, departmentId } = params;

      // Buscar conversa existente
      let conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            {
              participant1Id,
              participant1Type,
              participant2Id,
              participant2Type,
              protocolId: protocolId || null,
            },
            {
              participant1Id: participant2Id,
              participant1Type: participant2Type,
              participant2Id: participant1Id,
              participant2Type: participant1Type,
              protocolId: protocolId || null,
            },
          ],
        },
        include: {
          messages: {
            orderBy: { sentAt: 'desc' },
            take: 20,
          },
        },
      });

      // Se não existe, criar nova
      if (!conversation) {
        const messageServerId = await ensureActiveMessageServerId();

        // Fase 5 multi-tenant (plano 2026-07-13): conversa nasce com o tenant
        // do cidadão participante — visível às leituras escopadas do backend.
        const citizenParticipantId =
          participant1Type === 'CITIZEN' ? participant1Id
          : participant2Type === 'CITIZEN' ? participant2Id
          : null;
        // conversa só entre servidores: município de quem abriu (antes caía no padrão)
        const tenantId = citizenParticipantId
          ? await resolveTenantId({ citizenId: citizenParticipantId })
          : params.tenantId || (await resolveTenantId({}));

        conversation = await prisma.conversation.create({
          data: {
            tenantId,
            messageServerId,
            participant1Id,
            participant1Type,
            participant2Id,
            participant2Type,
            protocolId,
            departmentId,
            type: params.type || 'SUPPORT',
            status: 'ACTIVE',
          },
          include: {
            messages: true,
          },
        });

        logger.info('New conversation created', {
          conversationId: conversation.id,
          participant1: `${participant1Type}:${participant1Id}`,
          participant2: `${participant2Type}:${participant2Id}`,
        });
      }

      // Enriquecer com nomes dos participantes
      return this.enrichConversationWithNames(conversation);
    } catch (error) {
      logger.error('Error in findOrCreateConversation', { error, params });
      throw error;
    }
  }

  /** Conversa com os nomes dos participantes (para a tela) */
  async getEnrichedConversation(conversationId: string) {
    return this.enrichConversationWithNames(await this.getConversationById(conversationId));
  }

  async getConversationById(conversationId: string) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { sentAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      return conversation;
    } catch (error) {
      logger.error('Error getting conversation by id', { error, conversationId });
      throw error;
    }
  }

  async getConversationsByUser(userId: string, userType: ParticipantType, tenantId?: string) {
    try {
      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [
            // Participante 1: mostrar se não excluiu (deletedAt1 = null)
            { participant1Id: userId, participant1Type: userType, deletedAt1: null },
            // Participante 2: mostrar se não excluiu (deletedAt2 = null)
            { participant2Id: userId, participant2Type: userType, deletedAt2: null },
            // Atendimento humano: conversas do assistente que este servidor assumiu
            ...(userType === 'SERVER' && tenantId
              ? [{ isBotConversation: true, tenantId, metadata: { path: ['takenOverBy'], equals: userId } }]
              : []),
          ],
          status: { in: ['ACTIVE', 'ARCHIVED'] },
        },
        include: {
          messages: {
            orderBy: { sentAt: 'desc' },
            take: 1,
          },
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
        take: LIST_LIMIT,
      });

      return await this.enrichMany(conversations);
    } catch (error) {
      logger.error('Error getting conversations', { error, userId });
      throw error;
    }
  }

  async getConversationMessages(conversationId: string, limit = 50, offset = 0, userId?: string, userType?: ParticipantType) {
    try {
      // Construir filtro base
      const where: any = {
        conversationId,
        isDeleted: false,
      };

      // Se temos userId, verificar clearedAt para filtrar mensagens "apagadas para mim"
      if (userId && userType) {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { participant1Id: true, participant1Type: true, clearedAt1: true, clearedAt2: true },
        });

        if (conversation) {
          const isParticipant1 = conversation.participant1Id === userId && conversation.participant1Type === userType;
          const clearedAt = isParticipant1 ? conversation.clearedAt1 : conversation.clearedAt2;

          if (clearedAt) {
            where.sentAt = { gt: clearedAt };
          }
        }
      }

      const messages = await prisma.message.findMany({
        where,
        orderBy: {
          sentAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      return messages.reverse(); // Ordem cronológica
    } catch (error) {
      logger.error('Error getting conversation messages', { error, conversationId });
      throw error;
    }
  }

  async archiveConversation(conversationId: string, userId: string, userType: ParticipantType) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Proteger conversa do bot contra arquivamento
      if (conversation.isBotConversation) {
        throw new Error('A conversa com o DigiBot não pode ser arquivada');
      }

      // Verificar se o usuário participa
      const isParticipant =
        (conversation.participant1Id === userId && conversation.participant1Type === userType) ||
        (conversation.participant2Id === userId && conversation.participant2Type === userType);

      if (!isParticipant) {
        throw new Error('Unauthorized');
      }

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: 'ARCHIVED' },
      });

      logger.info('Conversation archived', { conversationId, userId });
    } catch (error) {
      logger.error('Error archiving conversation', { error, conversationId });
      throw error;
    }
  }

  async clearMessagesForMe(conversationId: string, userId: string, userType: ParticipantType) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const isParticipant1 =
        conversation.participant1Id === userId && conversation.participant1Type === userType;
      const isParticipant2 =
        conversation.participant2Id === userId && conversation.participant2Type === userType;

      if (!isParticipant1 && !isParticipant2) {
        throw new Error('Unauthorized');
      }

      // Marca o timestamp de "apagar para mim" — mensagens anteriores ficam ocultas
      await prisma.conversation.update({
        where: { id: conversationId },
        data: isParticipant1
          ? { clearedAt1: new Date() }
          : { clearedAt2: new Date() },
      });

      logger.info('Conversation cleared for user', { conversationId, userId });
    } catch (error) {
      logger.error('Error clearing conversation for user', { error, conversationId });
      throw error;
    }
  }

  async deleteConversation(conversationId: string, userId: string, userType: ParticipantType) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Proteger conversa do bot contra deleção
      if (conversation.isBotConversation) {
        throw new Error('A conversa com o DigiBot não pode ser excluída');
      }

      const isParticipant1 =
        conversation.participant1Id === userId && conversation.participant1Type === userType;
      const isParticipant2 =
        conversation.participant2Id === userId && conversation.participant2Type === userType;

      if (!isParticipant1 && !isParticipant2) {
        throw new Error('Unauthorized');
      }

      // Marcar exclusão apenas para este participante (não afeta o outro)
      await prisma.conversation.update({
        where: { id: conversationId },
        data: isParticipant1
          ? { deletedAt1: new Date() }
          : { deletedAt2: new Date() },
      });

      logger.info('Conversation deleted for participant', { conversationId, userId, position: isParticipant1 ? 1 : 2 });
    } catch (error) {
      logger.error('Error deleting conversation', { error, conversationId });
      throw error;
    }
  }

  async getUnreadCount(userId: string, userType: ParticipantType) {
    try {
      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [
            { participant1Id: userId, participant1Type: userType },
            { participant2Id: userId, participant2Type: userType },
          ],
          status: 'ACTIVE',
        },
        select: {
          id: true,
          participant1Id: true,
          unreadCount1: true,
          unreadCount2: true,
        },
      });

      const totalUnread = conversations.reduce((sum: number, conv: { participant1Id: string; unreadCount1: number; unreadCount2: number }) => {
        return sum + (conv.participant1Id === userId ? conv.unreadCount1 : conv.unreadCount2);
      }, 0);

      return totalUnread;
    } catch (error) {
      logger.error('Error getting unread count', { error, userId });
      throw error;
    }
  }

  async markConversationAsRead(conversationId: string, userId: string, userType: ParticipantType, tenantId?: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    const user = { userId, userType, tenantId };
    if (!conversation || !canReadConversation(conversation as any, user)) {
      throw new Error('Conversation not found');
    }

    const isParticipant1 = conversation.participant1Id === userId && conversation.participant1Type === userType;
    const isParticipant2 = conversation.participant2Id === userId && conversation.participant2Type === userType;
    // quem só supervisiona a conversa do assistente não zera o contador de ninguém
    if (!isParticipant1 && !isParticipant2 && !isAttendant(conversation as any, user)) return;

    await prisma.conversation.update({
      where: { id: conversationId },
      data: isParticipant1 ? { unreadCount1: 0 } : { unreadCount2: 0 },
    });

    await prisma.message.updateMany({
      where: {
        conversationId,
        NOT: { senderId: userId, senderType: userType },
        status: { in: ['SENT', 'DELIVERED'] },
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  }
}

export default new ConversationService();
