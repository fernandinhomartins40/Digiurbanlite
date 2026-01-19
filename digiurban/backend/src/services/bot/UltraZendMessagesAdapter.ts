/**
 * UltraZendMessagesAdapter
 *
 * Adapter para comunicação entre o DigiBot e o UltraZend Messages Server.
 * Gerencia conversas, envio de mensagens e WebSocket via UltraZend.
 */

import { PrismaClient, Conversation, Message } from '@prisma/client';
import { BotResponse } from './types';
import axios from 'axios';

const ULTRAZEND_API_URL = process.env.ULTRAZEND_API_URL || 'http://localhost:9001';
const ULTRAZEND_SERVICE_TOKEN = process.env.MESSAGES_SERVICE_TOKEN || 'ultrazend-messages-service-token-change-in-production';
const MESSAGE_SERVER_ID = process.env.MESSAGE_SERVER_ID || 'default-message-server-id';

export class UltraZendMessagesAdapter {
  private static instance: UltraZendMessagesAdapter;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): UltraZendMessagesAdapter {
    if (!UltraZendMessagesAdapter.instance) {
      UltraZendMessagesAdapter.instance = new UltraZendMessagesAdapter();
    }
    return UltraZendMessagesAdapter.instance;
  }

  /**
   * Busca ou cria uma conversa do bot com o cidadão
   */
  async findOrCreateBotConversation(citizenId: string): Promise<Conversation> {
    try {
      // Buscar conversa existente
      let conversation = await this.prisma.conversation.findFirst({
        where: {
          participant1Id: citizenId,
          participant1Type: 'CITIZEN',
          participant2Id: 'DIGIBOT_SYSTEM',
          participant2Type: 'SYSTEM',
          isBotConversation: true
        }
      });

      // Se não existe, criar
      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            messageServerId: MESSAGE_SERVER_ID,
            participant1Id: citizenId,
            participant1Type: 'CITIZEN',
            participant2Id: 'DIGIBOT_SYSTEM',
            participant2Type: 'SYSTEM',
            type: 'SUPPORT',
            status: 'ACTIVE',
            isBotConversation: true,
            botFlowType: null,
            botFlowStep: 0,
            botFlowData: {},
            botContext: {},
            botLastInteractionAt: new Date()
          }
        });

        console.log(
          `[UltraZendAdapter] Nova conversa do bot criada: ${conversation.id} para cidadão ${citizenId}`
        );

        // Enviar mensagem de boas-vindas
        await this.sendWelcomeMessage(conversation.id);
      }

      return conversation;
    } catch (error) {
      console.error('[UltraZendAdapter] Erro ao buscar/criar conversa:', error);
      throw error;
    }
  }

  /**
   * Envia mensagem de boas-vindas
   */
  private async sendWelcomeMessage(conversationId: string): Promise<void> {
    const welcomeResponse: BotResponse = {
      response: `👋 Olá! Sou o **DigiBot**, seu assistente virtual!\n\nEstou aqui para ajudar você a:\n\n📋 Solicitar serviços públicos\n🔍 Consultar seus protocolos\n📄 Enviar documentos\n👤 Atualizar seu perfil\n❓ Tirar dúvidas\n\nComo posso te ajudar hoje?`,
      messageType: 'interactive',
      metadata: {
        quickReplies: [
          '📋 Solicitar Serviço',
          '🔍 Consultar Protocolo',
          '👤 Meu Perfil',
          '❓ Ajuda'
        ]
      }
    };

    await this.sendBotMessage(conversationId, welcomeResponse);
  }

  /**
   * Envia uma mensagem do bot para a conversa
   */
  async sendBotMessage(
    conversationId: string,
    botResponse: BotResponse
  ): Promise<Message> {
    try {
      // Criar a mensagem no banco
      const message = await this.prisma.message.create({
        data: {
          conversationId,
          senderId: 'DIGIBOT_SYSTEM',
          senderType: 'SYSTEM',
          content: botResponse.response,
          contentType: 'TEXT',
          status: 'SENT',
          sentAt: new Date(),
          metadata: {
            messageType: botResponse.messageType,
            ...botResponse.metadata
          }
        }
      });

      // Atualizar a conversa
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: this.getMessagePreview(botResponse.response),
          totalMessages: { increment: 1 },
          unreadCount1: { increment: 1 }, // Incrementa contador para o cidadão
          botLastInteractionAt: new Date()
        }
      });

      // Enviar via WebSocket (se disponível)
      await this.notifyViaWebSocket(conversationId, message);

      console.log(
        `[UltraZendAdapter] Mensagem do bot enviada: ${message.id} na conversa ${conversationId}`
      );

      return message;
    } catch (error) {
      console.error('[UltraZendAdapter] Erro ao enviar mensagem do bot:', error);
      throw error;
    }
  }

  /**
   * Envia uma mensagem do cidadão
   */
  async sendCitizenMessage(
    conversationId: string,
    citizenId: string,
    content: string,
    contentType: 'TEXT' | 'IMAGE' | 'DOCUMENT' = 'TEXT',
    attachments?: any
  ): Promise<Message> {
    try {
      const message = await this.prisma.message.create({
        data: {
          conversationId,
          senderId: citizenId,
          senderType: 'CITIZEN',
          content,
          contentType,
          attachments,
          status: 'SENT',
          sentAt: new Date()
        }
      });

      // Atualizar a conversa
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: this.getMessagePreview(content),
          totalMessages: { increment: 1 },
          unreadCount2: { increment: 1 }, // Incrementa contador para o bot
          botLastInteractionAt: new Date()
        }
      });

      // Enviar via WebSocket
      await this.notifyViaWebSocket(conversationId, message);

      return message;
    } catch (error) {
      console.error('[UltraZendAdapter] Erro ao enviar mensagem do cidadão:', error);
      throw error;
    }
  }

  /**
   * Atualiza o fluxo do bot na conversa
   */
  async updateBotFlow(
    conversationId: string,
    flowType: string | null,
    flowStep: number,
    flowData: any = {}
  ): Promise<void> {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        botFlowType: flowType,
        botFlowStep: flowStep,
        botFlowData: flowData,
        botLastInteractionAt: new Date()
      }
    });
  }

  /**
   * Atualiza o contexto do bot na conversa
   */
  async updateBotContext(
    conversationId: string,
    context: any
  ): Promise<void> {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        botContext: context,
        botLastInteractionAt: new Date()
      }
    });
  }

  /**
   * Busca histórico de mensagens da conversa
   */
  async getConversationMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false
      },
      orderBy: {
        sentAt: 'desc'
      },
      skip: offset,
      take: limit
    });
  }

  /**
   * Busca uma conversa por ID
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });
  }

  /**
   * Marca mensagens como lidas
   */
  async markMessagesAsRead(
    conversationId: string,
    readerId: string,
    readerType: 'CITIZEN' | 'SYSTEM'
  ): Promise<void> {
    const now = new Date();

    // Atualizar mensagens não lidas
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: readerId },
        readAt: null,
        isDeleted: false
      },
      data: {
        status: 'READ',
        readAt: now,
        deliveredAt: now
      }
    });

    // Resetar contador de não lidas
    const updateData = readerType === 'CITIZEN'
      ? { unreadCount1: 0 }
      : { unreadCount2: 0 };

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: updateData
    });

    // Notificar via WebSocket
    await this.notifyReadReceipt(conversationId, readerId);
  }

  /**
   * Notifica via WebSocket sobre nova mensagem
   */
  private async notifyViaWebSocket(conversationId: string, message: Message): Promise<void> {
    try {
      // Envia para o UltraZend Messages Server via API
      await axios.post(
        `${ULTRAZEND_API_URL}/api/internal/notify-message`,
        {
          conversationId,
          message
        },
        {
          headers: {
            'Authorization': `Bearer ${ULTRAZEND_SERVICE_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
    } catch (error) {
      // Não bloqueia se o WebSocket falhar
      console.warn('[UltraZendAdapter] Erro ao notificar via WebSocket (não crítico):', error);
    }
  }

  /**
   * Notifica via WebSocket sobre leitura de mensagens
   */
  private async notifyReadReceipt(conversationId: string, readerId: string): Promise<void> {
    try {
      await axios.post(
        `${ULTRAZEND_API_URL}/api/internal/notify-read`,
        {
          conversationId,
          readerId
        },
        {
          headers: {
            'Authorization': `Bearer ${ULTRAZEND_SERVICE_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
    } catch (error) {
      console.warn('[UltraZendAdapter] Erro ao notificar leitura (não crítico):', error);
    }
  }

  /**
   * Gera preview da mensagem (primeiros 100 caracteres)
   */
  private getMessagePreview(content: string): string {
    const preview = content.replace(/\n/g, ' ').trim();
    return preview.length > 100 ? preview.substring(0, 100) + '...' : preview;
  }

  /**
   * Fecha uma conversa
   */
  async closeConversation(conversationId: string): Promise<void> {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        botFlowType: null,
        botFlowStep: 0,
        botFlowData: {}
      }
    });
  }

  /**
   * Reabre uma conversa
   */
  async reopenConversation(conversationId: string): Promise<void> {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: 'ACTIVE',
        closedAt: null
      }
    });
  }
}

export default UltraZendMessagesAdapter;
