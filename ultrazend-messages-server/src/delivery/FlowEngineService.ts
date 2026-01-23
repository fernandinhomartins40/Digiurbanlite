/**
 * FlowEngineService
 * Orquestra FlowEngine + ConversationService + WebSocket
 */

import { FlowEngine } from '../bot/flow/FlowEngine';
// import { ConversationService } from './ConversationService';
import { actionHandlers } from '../bot/flow/ActionHandlers';
import prisma from '../utils/prisma';
import { WebSocketServer } from '../server/WebSocketServer';

export class FlowEngineService {
  private flowEngine: FlowEngine;
  // private conversationService: ConversationService;
  private wsServer: WebSocketServer | null = null;

  constructor(wsServer?: WebSocketServer) {
    this.flowEngine = new FlowEngine(actionHandlers);
    // this.conversationService = new ConversationService();
    if (wsServer) {
      this.wsServer = wsServer;
    }
  }

  setWebSocketServer(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
  }

  private buildBotMetadata(response: any) {
    const metadata: any = {
      messageType: response.messageType,
      needsInput: response.metadata?.waitingForInput,
      flowId: response.metadata?.flowId,
      executionId: response.metadata?.executionId,
      nodeId: response.metadata?.nodeId,
    };

    if (response.data?.options) {
      metadata.options = JSON.parse(JSON.stringify(response.data.options));
    }

    if (response.data?.fields) {
      metadata.fields = JSON.parse(JSON.stringify(response.data.fields));
    }

    if (response.data?.uploadConfig) {
      metadata.uploadConfig = response.data.uploadConfig;
    }

    if (response.data?.locationConfig) {
      metadata.locationConfig = response.data.locationConfig;
    }

    if (response.data?.media) {
      metadata.media = response.data.media;
    }

    return metadata;
  }

  private formatUserMessageContent(message: any) {
    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message)) {
      return `Dados enviados (${message.length})`;
    }

    try {
      return JSON.stringify(message);
    } catch {
      return 'Dados enviados';
    }
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

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        participant1Id: true,
        participant1Type: true,
        participant2Id: true,
        participant2Type: true,
      },
    });

    const isParticipant1 = conversation?.participant1Id === citizenId &&
      conversation?.participant1Type === 'CITIZEN';

    // 2. Iniciar fluxo
    const response = await this.flowEngine.startFlow(citizenId, flowName, conversationId);
    const botMetadata = this.buildBotMetadata(response);

    // 3. Atualizar conversa com dados do bot
    await this.updateConversationBotData(conversationId, {
      isBotConversation: true,
      botFlowType: flowName,
      botFlowStep: 0,
      botLastInteractionAt: new Date(),
      botFlowData: {
        currentNodeId: response.metadata?.nodeId,
        waitingForInput: response.metadata?.waitingForInput,
      },
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
        metadata: botMetadata as any,
      },
    });

    // 5. Atualizar lastMessage da conversa
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: response.message.substring(0, 100),
        totalMessages: { increment: 1 },
        ...(isParticipant1
          ? { unreadCount1: { increment: 1 } }
          : { unreadCount2: { increment: 1 } }),
        updatedAt: new Date(),
      },
    });

    // 6. Emitir via WebSocket
    if (this.wsServer) {
      this.wsServer.sendMessageToConversation(conversationId, 'message:new', {
        conversationId,
        message,
      });

      // Notificar também o cidadão diretamente
      this.wsServer.sendMessageToUser(citizenId, 'CITIZEN', 'message:new', {
        conversationId,
        message,
      });

      const conversationDetails = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { sentAt: 'desc' },
            take: 1,
          },
        },
      });

      if (conversationDetails) {
        this.wsServer.sendMessageToUser(citizenId, 'CITIZEN', 'conversation:new', {
          conversation: conversationDetails,
        });
      }
    }

    return { response, conversationId, message };
  }

  /**
   * Processa mensagem do usuário
   */
  async processMessage(citizenId: string, message: any, conversationId?: string) {
    console.log('[FlowEngineService.processMessage]', { citizenId, message, conversationId });

    // 1. Buscar/criar conversa
    if (!conversationId) {
      const conversation = await this.findOrCreateBotConversation(citizenId);
      conversationId = conversation.id;
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        participant1Id: true,
        participant1Type: true,
        participant2Id: true,
        participant2Type: true,
      },
    });

    const isParticipant1 = conversation?.participant1Id === citizenId &&
      conversation?.participant1Type === 'CITIZEN';

    // 2. Salvar mensagem do cidadão
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: citizenId,
        senderType: 'CITIZEN',
        content: this.formatUserMessageContent(message),
        contentType: 'TEXT',
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // 3. Processar no FlowEngine
    const response = await this.flowEngine.processMessage(citizenId, message, conversationId);
    const botMetadata = this.buildBotMetadata(response);
    const flowName = response.metadata?.flowId
      ? (await prisma.flowDefinition.findUnique({
          where: { id: response.metadata.flowId },
          select: { name: true },
        }))?.name
      : null;

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
        metadata: botMetadata as any,
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
        ...(flowName ? { botFlowType: flowName } : {}),
        botFlowData: {
          currentNodeId: response.metadata?.nodeId,
          waitingForInput: response.metadata?.waitingForInput,
        },
        ...(isParticipant1
          ? { unreadCount1: { increment: 1 } }
          : { unreadCount2: { increment: 1 } }),
        updatedAt: new Date(),
      },
    });

    // 6. Emitir via WebSocket
    if (this.wsServer) {
      this.wsServer.sendMessageToConversation(conversationId, 'message:new', {
        conversationId,
        message: userMessage,
      });
      this.wsServer.sendMessageToConversation(conversationId, 'message:new', {
        conversationId,
        message: botMessage,
      });

      this.wsServer.sendMessageToUser(citizenId, 'CITIZEN', 'message:new', {
        conversationId,
        message: userMessage,
      });
      this.wsServer.sendMessageToUser(citizenId, 'CITIZEN', 'message:new', {
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
      await this.flowEngine.pauseExecution(citizenId);

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
      await this.flowEngine.resumeExecution(citizenId);

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
  async handleUpload(citizenId: string, files: any[], conversationId?: string) {
    if (!conversationId) {
      const conversation = await this.findOrCreateBotConversation(citizenId);
      conversationId = conversation.id;
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        participant1Id: true,
        participant1Type: true,
        participant2Id: true,
        participant2Type: true,
      },
    });

    const isParticipant1 = conversation?.participant1Id === citizenId &&
      conversation?.participant1Type === 'CITIZEN';

    const uploadedFiles = files.map((file: any) => ({
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
    }));

    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: citizenId,
        senderType: 'CITIZEN',
        content: `Arquivos enviados (${uploadedFiles.length})`,
        contentType: 'FILE',
        attachments: uploadedFiles as any,
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    const response = await this.flowEngine.processMessage(citizenId, uploadedFiles, conversationId);
    const botMetadata = this.buildBotMetadata(response);

    const botMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: 'DIGIBOT_SYSTEM',
        senderType: 'SYSTEM',
        content: response.message,
        contentType: 'TEXT',
        status: 'SENT',
        sentAt: new Date(),
        metadata: botMetadata as any,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: response.message.substring(0, 100),
        totalMessages: { increment: 2 },
        botLastInteractionAt: new Date(),
        botFlowData: {
          currentNodeId: response.metadata?.nodeId,
          waitingForInput: response.metadata?.waitingForInput,
        },
        ...(isParticipant1
          ? { unreadCount1: { increment: 1 } }
          : { unreadCount2: { increment: 1 } }),
        updatedAt: new Date(),
      },
    });

    if (this.wsServer) {
      this.wsServer.sendMessageToConversation(conversationId, 'message:new', {
        conversationId,
        message: userMessage,
      });
      this.wsServer.sendMessageToConversation(conversationId, 'message:new', {
        conversationId,
        message: botMessage,
      });

      this.wsServer.sendMessageToUser(citizenId, 'CITIZEN', 'message:new', {
        conversationId,
        message: userMessage,
      });
      this.wsServer.sendMessageToUser(citizenId, 'CITIZEN', 'message:new', {
        conversationId,
        message: botMessage,
      });
    }

    return {
      success: true,
      files: uploadedFiles,
      response,
      conversationId,
      userMessage,
      botMessage,
    };
  }

  /**
   * Busca ou cria conversa do bot
   */
  private async findOrCreateBotConversation(citizenId: string) {
    let messageServerId = process.env.MESSAGE_SERVER_ID;

    if (!messageServerId) {
      const activeServer = await prisma.messageServer.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!activeServer) {
        throw new Error('No active message server found');
      }

      messageServerId = activeServer.id;
    }

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
