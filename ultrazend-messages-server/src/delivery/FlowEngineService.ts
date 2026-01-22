/**
 * FlowEngineService
 * Orquestra FlowEngine + ConversationService + WebSocket
 */

import { FlowEngine } from '../bot/flow/FlowEngine';
import { ConversationService } from './ConversationService';
import { actionHandlers } from '../bot/flow/ActionHandlers';
import prisma from '../utils/prisma';
import { WebSocketServer } from '../server/WebSocketServer';

export class FlowEngineService {
  private flowEngine: FlowEngine;
  private conversationService: ConversationService;
  private wsServer: WebSocketServer | null = null;

  constructor(wsServer?: WebSocketServer) {
    this.flowEngine = new FlowEngine(actionHandlers);
    this.conversationService = new ConversationService();
    if (wsServer) {
      this.wsServer = wsServer;
    }
  }

  setWebSocketServer(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
  }

  /**
   * Inicia novo fluxo
   */
  async startFlow(citizenId: string, flowName: string, conversationId?: string) {
    console.log('[FlowEngineService.startFlow]', { citizenId, flowName, conversationId });

    // 1. Buscar/criar conversa do bot
    if (!conversationId) {
      const conversation = await this.findOrCreateBotConversation(citizenId);
      conversationId = conversation.id;
    }

    // 2. Iniciar fluxo
    const response = await this.flowEngine.startFlow(citizenId, flowName, conversationId);

    // 3. Atualizar conversa com dados do bot
    await this.updateConversationBotData(conversationId, {
      isBotConversation: true,
      botFlowType: flowName,
      botFlowStep: 0,
      botLastInteractionAt: new Date(),
    });

    // 4. Salvar mensagem do bot
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: 'DIGIBOT_SYSTEM',
        senderType: 'SYSTEM',
        content: response.message,
        contentType: 'TEXT',
        status: 'SENT',
        sentAt: new Date(),
        metadata: {
          messageType: response.messageType,
          options: response.data?.options || response.options,
          needsInput: response.metadata?.waitingForInput,
        },
      },
    });

    // 5. Atualizar lastMessage da conversa
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: response.message.substring(0, 100),
        totalMessages: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    // 6. Emitir via WebSocket
    if (this.wsServer) {
      this.wsServer.emitToConversation(conversationId, 'message:new', {
        conversationId,
        message,
      });

      // Notificar também o cidadão diretamente
      this.wsServer.emitToUser(citizenId, 'CITIZEN', 'message:new', {
        conversationId,
        message,
      });
    }

    return { response, conversationId, message };
  }

  /**
   * Processa mensagem do usuário
   */
  async processMessage(citizenId: string, message: string, conversationId?: string) {
    console.log('[FlowEngineService.processMessage]', { citizenId, message, conversationId });

    // 1. Buscar/criar conversa
    if (!conversationId) {
      const conversation = await this.findOrCreateBotConversation(citizenId);
      conversationId = conversation.id;
    }

    // 2. Salvar mensagem do cidadão
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: citizenId,
        senderType: 'CITIZEN',
        content: message,
        contentType: 'TEXT',
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // 3. Processar no FlowEngine
    const response = await this.flowEngine.processMessage(citizenId, message, conversationId);

    // 4. Salvar resposta do bot
    const botMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: 'DIGIBOT_SYSTEM',
        senderType: 'SYSTEM',
        content: response.message,
        contentType: 'TEXT',
        status: 'SENT',
        sentAt: new Date(),
        metadata: {
          messageType: response.messageType,
          options: response.data?.options || response.options,
          needsInput: response.metadata?.waitingForInput,
        },
      },
    });

    // 5. Atualizar conversa
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: response.message.substring(0, 100),
        totalMessages: { increment: 2 },
        botLastInteractionAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 6. Emitir via WebSocket
    if (this.wsServer) {
      this.wsServer.emitToConversation(conversationId, 'message:new', {
        conversationId,
        message: botMessage,
      });
    }

    return { response, conversationId, userMessage, botMessage };
  }

  /**
   * Obtém execução ativa
   */
  async getActiveExecution(citizenId: string) {
    const execution = await prisma.flowExecution.findFirst({
      where: {
        citizenId,
        status: 'ACTIVE',
      },
      include: {
        flow: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return execution;
  }

  /**
   * Cancela fluxo ativo
   */
  async cancelActiveFlow(citizenId: string) {
    await this.flowEngine.cancelActiveFlow(citizenId);
    return { success: true };
  }

  /**
   * Pausa execução (para atendimento humano)
   */
  async pauseExecution(citizenId: string, conversationId?: string) {
    const execution = await this.getActiveExecution(citizenId);
    if (execution) {
      await this.flowEngine.pauseExecution(execution.id, conversationId);

      // Atualizar conversa
      if (conversationId) {
        await this.updateConversationBotData(conversationId, {
          botFlowData: { paused: true, pausedAt: new Date() },
        });
      }
    }
    return { success: true };
  }

  /**
   * Retoma execução
   */
  async resumeExecution(citizenId: string, conversationId?: string) {
    const execution = await this.getActiveExecution(citizenId);
    if (execution) {
      await this.flowEngine.resumeExecution(execution.id, conversationId);

      // Atualizar conversa
      if (conversationId) {
        await this.updateConversationBotData(conversationId, {
          botFlowData: { paused: false, resumedAt: new Date() },
        });
      }
    }
    return { success: true };
  }

  /**
   * Handle upload de arquivos
   */
  async handleUpload(citizenId: string, files: any[]) {
    // Processar arquivos e retornar informações
    const uploadedFiles = files.map((file: any) => ({
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
    }));

    return {
      success: true,
      files: uploadedFiles,
    };
  }

  /**
   * Busca ou cria conversa do bot
   */
  private async findOrCreateBotConversation(citizenId: string) {
    const messageServerId = process.env.MESSAGE_SERVER_ID || 'default-message-server-id';

    // Buscar conversa existente
    let conversation = await prisma.conversation.findFirst({
      where: {
        participant1Id: citizenId,
        participant1Type: 'CITIZEN',
        participant2Id: 'DIGIBOT_SYSTEM',
        participant2Type: 'SYSTEM',
        isBotConversation: true,
        status: 'ACTIVE',
      },
    });

    if (!conversation) {
      // Criar nova conversa
      conversation = await prisma.conversation.create({
        data: {
          messageServerId,
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
          totalMessages: 0,
          unreadCount1: 0,
          unreadCount2: 0,
        },
      });
    }

    return conversation;
  }

  /**
   * Atualiza dados do bot na conversa
   */
  private async updateConversationBotData(conversationId: string, data: any) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }
}

export default FlowEngineService;
