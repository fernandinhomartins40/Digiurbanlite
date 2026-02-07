import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { ParticipantType, ConversationType } from '@prisma/client';

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

      // Para compatibilidade com código existente
      if (conversation.participant1Type === 'CITIZEN') {
        metadata.citizenName = metadata.citizen1Name;
        metadata.avatar = metadata.citizen1Avatar;
      } else if (conversation.participant2Type === 'CITIZEN') {
        metadata.citizenName = metadata.citizen2Name;
        metadata.avatar = metadata.citizen2Avatar;
      }

      if (conversation.participant1Type === 'SERVER') {
        metadata.serverName = metadata.server1Name;
      } else if (conversation.participant2Type === 'SERVER') {
        metadata.serverName = metadata.server2Name;
      }

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
        // Buscar o primeiro servidor de mensagens ativo
        let messageServerId = process.env.MESSAGE_SERVER_ID;

        if (!messageServerId) {
          const activeServer = await prisma.messageServer.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' }
          });

          if (!activeServer) {
            throw new Error('No active message server found');
          }

          messageServerId = activeServer.id;
        }

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
            { participant1Id: userId, participant1Type: userType },
            { participant2Id: userId, participant2Type: userType },
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

  async getConversationMessages(conversationId: string, limit = 50, offset = 0) {
    try {
      const messages = await prisma.message.findMany({
        where: {
          conversationId,
          isDeleted: false,
        },
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

  async deleteConversation(conversationId: string, userId: string, userType: ParticipantType) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const isParticipant =
        (conversation.participant1Id === userId && conversation.participant1Type === userType) ||
        (conversation.participant2Id === userId && conversation.participant2Type === userType);

      if (!isParticipant) {
        throw new Error('Unauthorized');
      }

      // Soft delete das mensagens
      await prisma.message.updateMany({
        where: { conversationId },
        data: { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
      });

      // Fechar conversa
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: 'CLOSED', closedAt: new Date() },
      });

      logger.info('Conversation deleted', { conversationId, userId });
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
