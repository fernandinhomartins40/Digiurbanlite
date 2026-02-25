import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { ParticipantType, ConversationType } from '@prisma/client';
import { ensureActiveMessageServerId } from '../utils/messageServer';

export class ConversationService {
  /**
   * Enriquecer conversa com nomes dos participantes
   */
  private async enrichConversationWithNames(conversation: any) {
    try {
      const metadata: any = conversation.metadata || {};

      // Buscar nome do participante 1
      if (conversation.participant1Type === 'CITIZEN') {
        const citizen = await prisma.citizen.findUnique({
          where: { id: conversation.participant1Id },
          select: { name: true, avatar: true },
        });
        if (citizen) {
          metadata.citizen1Name = citizen.name;
          if (citizen.avatar) metadata.citizen1Avatar = citizen.avatar;
        }
      } else if (conversation.participant1Type === 'SERVER') {
        const user = await prisma.user.findUnique({
          where: { id: conversation.participant1Id },
          select: { name: true },
        });
        if (user) {
          metadata.server1Name = user.name;
        }
      }

      // Buscar nome do participante 2
      if (conversation.participant2Type === 'CITIZEN') {
        const citizen = await prisma.citizen.findUnique({
          where: { id: conversation.participant2Id },
          select: { name: true, avatar: true },
        });
        if (citizen) {
          metadata.citizen2Name = citizen.name;
          if (citizen.avatar) metadata.citizen2Avatar = citizen.avatar;
        }
      } else if (conversation.participant2Type === 'SERVER') {
        const user = await prisma.user.findUnique({
          where: { id: conversation.participant2Id },
          select: { name: true },
        });
        if (user) {
          metadata.server2Name = user.name;
        }
      }

      // ✅ CORRIGIDO: Para compatibilidade com código existente
      // SEMPRE colocar os nomes de AMBOS os participantes, não só de um tipo
      // O frontend vai decidir qual nome mostrar baseado em quem está logado
      metadata.citizenName = metadata.citizen1Name || metadata.citizen2Name;
      metadata.serverName = metadata.server1Name || metadata.server2Name;
      metadata.avatar = metadata.citizen1Avatar || metadata.citizen2Avatar;

      return {
        ...conversation,
        metadata,
      };
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

        conversation = await prisma.conversation.create({
          data: {
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

  async getConversationsByUser(userId: string, userType: ParticipantType) {
    try {
      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [
            // Participante 1: mostrar se não excluiu (deletedAt1 = null)
            { participant1Id: userId, participant1Type: userType, deletedAt1: null },
            // Participante 2: mostrar se não excluiu (deletedAt2 = null)
            { participant2Id: userId, participant2Type: userType, deletedAt2: null },
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
      });

      // Enriquecer todas as conversas com nomes dos participantes
      const enriched = await Promise.all(
        conversations.map(conv => this.enrichConversationWithNames(conv))
      );

      return enriched;
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

  async clearMessages(conversationId: string, userId: string, userType: ParticipantType) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Proteger conversas do bot: apenas "apagar para mim" é permitido
      if (conversation.isBotConversation) {
        throw new Error('Bot conversations cannot have messages cleared for all. Use clear for me instead.');
      }

      const isParticipant =
        (conversation.participant1Id === userId && conversation.participant1Type === userType) ||
        (conversation.participant2Id === userId && conversation.participant2Type === userType);

      if (!isParticipant) {
        throw new Error('Unauthorized');
      }

      // Soft delete de todas as mensagens
      await prisma.message.updateMany({
        where: { conversationId },
        data: { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
      });

      // Limpar preview
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessagePreview: null, totalMessages: 0 },
      });

      logger.info('Conversation messages cleared', { conversationId, userId });
    } catch (error) {
      logger.error('Error clearing conversation messages', { error, conversationId });
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

  async markConversationAsRead(conversationId: string, userId: string, userType: ParticipantType) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Resetar contador de não lidas
      const isParticipant1 = conversation.participant1Id === userId && conversation.participant1Type === userType;

      await prisma.conversation.update({
        where: { id: conversationId },
        data: isParticipant1 ? { unreadCount1: 0 } : { unreadCount2: 0 },
      });

      // Marcar mensagens como lidas
      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          status: { in: ['SENT', 'DELIVERED'] },
        },
        data: {
          status: 'READ',
          readAt: new Date(),
        },
      });

      logger.debug('Conversation marked as read', { conversationId, userId });
    } catch (error) {
      logger.error('Error marking conversation as read', { error, conversationId });
      throw error;
    }
  }
}

export default new ConversationService();
