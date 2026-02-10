import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { ensureActiveMessageServerId } from '../utils/messageServer';

export class ChannelService {
  async createChannel(params: {
    name: string;
    slug: string;
    description?: string;
    departmentId?: string;
    managedBy: string[];
    iconUrl?: string;
    bannerUrl?: string;
    isPublic?: boolean;
    requiresApproval?: boolean;
  }) {
    try {
      const messageServerId = await ensureActiveMessageServerId();

      const channel = await prisma.officialChannel.create({
        data: {
          messageServerId,
          ...params,
          managedBy: params.managedBy || [],
          isPublic: params.isPublic ?? true,
          requiresApproval: params.requiresApproval ?? false,
        },
      });

      logger.info('Official channel created', { channelId: channel.id, name: channel.name });
      return channel;
    } catch (error) {
      logger.error('Error creating channel', { error, params });
      throw error;
    }
  }

  async getChannels(filters?: { isActive?: boolean; isPublic?: boolean; departmentId?: string }) {
    try {
      const channels = await prisma.officialChannel.findMany({
        where: {
          isActive: filters?.isActive ?? true,
          isPublic: filters?.isPublic,
          departmentId: filters?.departmentId,
        },
        include: {
          _count: {
            select: {
              subscriptions: {
                where: { status: 'ACTIVE' },
              },
              messages: true,
            },
          },
        },
        orderBy: {
          subscriberCount: 'desc',
        },
      });

      return channels;
    } catch (error) {
      logger.error('Error getting channels', { error });
      throw error;
    }
  }

  async subscribeToChannel(channelId: string, citizenId: string) {
    try {
      const channel = await prisma.officialChannel.findUnique({
        where: { id: channelId },
      });

      if (!channel) {
        throw new Error('Channel not found');
      }

      if (!channel.isActive) {
        throw new Error('Channel is not active');
      }

      // Verificar se já está inscrito
      const existing = await prisma.channelSubscription.findUnique({
        where: {
          channelId_citizenId: { channelId, citizenId },
        },
      });

      if (existing) {
        if (existing.status === 'ACTIVE') {
          return { alreadySubscribed: true, subscription: existing };
        }

        // Reativar inscrição
        const updated = await prisma.channelSubscription.update({
          where: { id: existing.id },
          data: { status: 'ACTIVE', subscribedAt: new Date() },
        });

        return { subscription: updated };
      }

      // Criar nova inscrição
      const subscription = await prisma.channelSubscription.create({
        data: {
          channelId,
          citizenId,
          status: channel.requiresApproval ? 'PENDING' : 'ACTIVE',
        },
      });

      // Atualizar contador
      if (subscription.status === 'ACTIVE') {
        await prisma.officialChannel.update({
          where: { id: channelId },
          data: { subscriberCount: { increment: 1 } },
        });
      }

      logger.info('User subscribed to channel', { channelId, citizenId, status: subscription.status });
      return { subscription };
    } catch (error) {
      logger.error('Error subscribing to channel', { error, channelId, citizenId });
      throw error;
    }
  }

  async unsubscribeFromChannel(channelId: string, citizenId: string) {
    try {
      const subscription = await prisma.channelSubscription.findUnique({
        where: {
          channelId_citizenId: { channelId, citizenId },
        },
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      await prisma.channelSubscription.delete({
        where: { id: subscription.id },
      });

      // Atualizar contador
      if (subscription.status === 'ACTIVE') {
        await prisma.officialChannel.update({
          where: { id: channelId },
          data: { subscriberCount: { decrement: 1 } },
        });
      }

      logger.info('User unsubscribed from channel', { channelId, citizenId });
    } catch (error) {
      logger.error('Error unsubscribing from channel', { error, channelId, citizenId });
      throw error;
    }
  }

  async broadcastMessage(params: {
    channelId: string;
    authorId: string;
    title?: string;
    content: string;
    attachments?: any[];
    scheduledFor?: Date;
    priority?: number;
  }) {
    try {
      const { channelId, authorId, title, content, attachments, scheduledFor, priority } = params;

      // Verificar se o canal existe e se o autor tem permissão
      const channel = await prisma.officialChannel.findUnique({
        where: { id: channelId },
      });

      if (!channel) {
        throw new Error('Channel not found');
      }

      if (!channel.isActive) {
        throw new Error('Channel is not active');
      }

      const managedBy = channel.managedBy as string[];
      if (!managedBy.includes(authorId)) {
        throw new Error('Unauthorized: User is not a manager of this channel');
      }

      // Criar mensagem de canal
      const message = await prisma.channelMessage.create({
        data: {
          channelId,
          authorId,
          title,
          content,
          attachments: attachments || [],
          scheduledFor,
          priority: priority || 3,
          status: scheduledFor ? 'SCHEDULED' : 'SENDING',
        },
      });

      // Se não está agendada, enviar imediatamente
      if (!scheduledFor) {
        await this.deliverBroadcast(message.id);
      }

      logger.info('Broadcast message created', {
        messageId: message.id,
        channelId,
        status: message.status,
      });

      return message;
    } catch (error) {
      logger.error('Error creating broadcast message', { error, params });
      throw error;
    }
  }

  async deliverBroadcast(messageId: string) {
    try {
      const message = await prisma.channelMessage.findUnique({
        where: { id: messageId },
        include: {
          channel: {
            include: {
              subscriptions: {
                where: { status: 'ACTIVE' },
              },
            },
          },
        },
      });

      if (!message) {
        throw new Error('Message not found');
      }

      const subscriptions = message.channel.subscriptions;

      logger.info(`Delivering broadcast to ${subscriptions.length} subscribers`, { messageId });

      // Criar deliveries em batch
      const deliveries = subscriptions.map((sub: { id: string; citizenId: string }) => ({
        messageId,
        subscriptionId: sub.id,
        citizenId: sub.citizenId,
        status: 'QUEUED' as const,
      }));

      await prisma.channelDelivery.createMany({
        data: deliveries,
        skipDuplicates: true,
      });

      // Atualizar status da mensagem
      await prisma.channelMessage.update({
        where: { id: messageId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          publishedAt: new Date(),
        },
      });

      // Atualizar contador de mensagens do canal
      await prisma.officialChannel.update({
        where: { id: message.channelId },
        data: { messageCount: { increment: 1 } },
      });

      // Processar entregas (marcar como enviadas)
      await this.processDeliveries(messageId);

      logger.info('Broadcast delivered', {
        messageId,
        deliveries: deliveries.length,
      });
    } catch (error) {
      logger.error('Error delivering broadcast', { error, messageId });

      // Marcar como falha
      await prisma.channelMessage.update({
        where: { id: messageId },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  }

  private async processDeliveries(messageId: string) {
    try {
      // Marcar todas as deliveries como SENT
      const result = await prisma.channelDelivery.updateMany({
        where: {
          messageId,
          status: 'QUEUED',
        },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      // Atualizar contadores da mensagem
      await prisma.channelMessage.update({
        where: { id: messageId },
        data: {
          deliveredCount: result.count,
        },
      });

      logger.info('Deliveries processed', { messageId, count: result.count });
    } catch (error) {
      logger.error('Error processing deliveries', { error, messageId });
    }
  }

  async getChannelMessages(channelId: string, limit = 50, offset = 0) {
    try {
      const messages = await prisma.channelMessage.findMany({
        where: {
          channelId,
          status: 'SENT',
        },
        orderBy: {
          publishedAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      return messages;
    } catch (error) {
      logger.error('Error getting channel messages', { error, channelId });
      throw error;
    }
  }

  async getUserSubscriptions(citizenId: string) {
    try {
      const subscriptions = await prisma.channelSubscription.findMany({
        where: { citizenId },
        include: {
          channel: {
            include: {
              _count: {
                select: {
                  messages: {
                    where: { status: 'SENT' },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          subscribedAt: 'desc',
        },
      });

      return subscriptions;
    } catch (error) {
      logger.error('Error getting user subscriptions', { error, citizenId });
      throw error;
    }
  }
}

export default new ChannelService();
