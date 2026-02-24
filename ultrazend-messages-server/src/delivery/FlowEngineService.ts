/**
 * FlowEngineService
 * Orquestra FlowEngine + ConversationService + WebSocket
 */

import { FlowEngine } from '../bot/flow/FlowEngine';
import { actionHandlers } from '../bot/flow/ActionHandlers';
import prisma from '../utils/prisma';
import { WebSocketServer } from '../server/WebSocketServer';
import { HandoverService } from './HandoverService'; // ✅ NOVO
import fs from 'fs/promises';
import path from 'path';
import { ensureActiveMessageServerId } from '../utils/messageServer';

export class FlowEngineService {
  private flowEngine: FlowEngine;
  private wsServer: WebSocketServer | null = null;
  private handoverService: HandoverService; // ✅ NOVO

  constructor(wsServer?: WebSocketServer) {
    this.flowEngine = new FlowEngine(actionHandlers);
    this.handoverService = new HandoverService(wsServer); // ✅ NOVO
    if (wsServer) {
      this.wsServer = wsServer;
    }
  }

  setWebSocketServer(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
    this.handoverService.setWebSocketServer(wsServer); // ✅ NOVO
  }

  // ✅ NOVO: Expor HandoverService para rotas
  getHandoverService(): HandoverService {
    return this.handoverService;
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

    // Passa campos extras de display para o frontend (carrosséis, categorias, etc.)
    if (response.data?.displayMode) {
      metadata.displayMode = response.data.displayMode;
    }
    if (response.data?.categories) {
      metadata.categories = response.data.categories;
    }
    if (response.data?.departmentName) {
      metadata.departmentName = response.data.departmentName;
    }

    // Documentos obrigatórios para upload rico no bot
    if (response.data?.requiredDocuments) {
      metadata.requiredDocuments = response.data.requiredDocuments;
    }

    return metadata;
  }

  private formatUserMessageContent(message: any): string {
    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message)) {
      // Para uploads, gerar descrição legível
      if (message.length > 0 && message[0]?.fileName) {
        const fileNames = message.map((f: any) => f.fileName).join(', ');
        return `📎 Arquivos enviados: ${fileNames}`;
      }
      return `Dados enviados (${message.length} itens)`;
    }

    if (typeof message === 'object' && message !== null) {
      // Seleção de menu (frontend envia { optionId, label })
      if (typeof (message as any).label === 'string' && (message as any).label.trim()) {
        return (message as any).label.trim();
      }

      // Para formulários, gerar resumo legível dos campos
      const entries = Object.entries(message).filter(([_, v]) => v !== null && v !== undefined && v !== '');
      if (entries.length > 0) {
        const summary = entries
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        return `📝 Dados do formulário:\n${summary}`;
      }
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
    const isParticipant2 = !isParticipant1;

    // 2. Iniciar fluxo
    const response = await this.flowEngine.startFlow(citizenId, flowName, conversationId);
    const botMetadata = this.buildBotMetadata(response);

    // 3. Vincular conversa à execução ativa do bot (✅ REFATORADO)
    const execution = await this.getActiveExecution(citizenId);
    if (execution) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          isBotConversation: true,
          activeFlowExecutionId: execution.id, // ✅ FK para FlowExecution
          metadata: {
            botStatus: 'ACTIVE',
            botStatusUpdatedAt: new Date().toISOString(),
          },
        },
      });
    }

    // 4. Salvar mensagem do bot (✅ REFATORADO com campos queryable)
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
        // ✅ NOVOS CAMPOS QUERYABLE
        isBotMessage: true,
        botInteractionType: response.messageType || 'message',
        botFlowNodeId: response.metadata?.nodeId,
        botStructuredData: (response.data || null) as any,
      },
    });

    // 5. Atualizar lastMessage da conversa
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: response.message.substring(0, 100),
        totalMessages: { increment: 1 },
        ...(isParticipant2
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
    const isCitizenSecond = !isParticipant1;

    // 2. Salvar mensagem do cidadão (✅ REFATORADO com campos queryable)
    const userMessageMetadata: any = {};
    let botInteractionType: string | null = null;
    let botSelectedOption: string | null = null;
    let botStructuredData: any = null;

    if (typeof message === 'object' && message !== null) {
      userMessageMetadata.originalData = message;
      userMessageMetadata.dataType = Array.isArray(message) ? 'array' : 'form';

      // Extrair dados estruturados para campos queryable
      if (!Array.isArray(message)) {
        if ((message as any).optionId) {
          botInteractionType = 'menu';
          botSelectedOption = (message as any).optionId;
        } else {
          botInteractionType = 'form';
        }
        botStructuredData = message;
      } else {
        botInteractionType = 'upload';
        botStructuredData = message;
      }
    }

    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: citizenId,
        senderType: 'CITIZEN',
        content: this.formatUserMessageContent(message),
        contentType: 'TEXT',
        status: 'SENT',
        sentAt: new Date(),
        ...(Object.keys(userMessageMetadata).length > 0 ? { metadata: userMessageMetadata as any } : {}),
        // ✅ CAMPOS QUERYABLE
        botInteractionType,
        botSelectedOption,
        botStructuredData: botStructuredData as any,
      },
    });

    // 3. Processar no FlowEngine
    const response = await this.flowEngine.processMessage(citizenId, message, conversationId);
    const botMetadata = this.buildBotMetadata(response);
    const botStatus = response.metadata?.paused ? 'HUMAN_TAKEOVER' : 'ACTIVE';

    // 4. Salvar resposta do bot (✅ REFATORADO)
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
        // ✅ CAMPOS QUERYABLE
        isBotMessage: true,
        botInteractionType: response.messageType || 'message',
        botFlowNodeId: response.metadata?.nodeId,
        botStructuredData: (response.data || null) as any,
      },
    });

    // 5. Atualizar conversa (✅ REFATORADO - sem botFlowData)
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: response.message.substring(0, 100),
        totalMessages: { increment: 2 },
        metadata: {
          botStatus,
          botStatusUpdatedAt: new Date().toISOString(),
        },
        ...(isCitizenSecond
          ? { unreadCount1: { increment: 1 } }
          : { unreadCount2: { increment: 1 } }),
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
   * Pausa execução (para atendimento humano) - ✅ REFATORADO COM HANDOVER
   */
  async pauseExecution(citizenId: string, conversationId?: string, pausedBy?: string, reason?: string) {
    const execution = await this.getActiveExecution(citizenId);
    if (!execution) {
      throw new Error('Nenhuma execução ativa encontrada para este cidadão');
    }

    // Pausar no FlowExecution (fonte de verdade)
    await prisma.flowExecution.update({
      where: { id: execution.id },
      data: {
        isPaused: true,
        pausedAt: new Date(),
        pausedBy: pausedBy || null,
        pauseReason: reason || 'human_needed',
      },
    });

    // Atualizar metadata da conversa (apenas status visual)
    let conversation = null;
    if (conversationId) {
      conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          metadata: {
            botStatus: 'HUMAN_TAKEOVER',
            botStatusUpdatedAt: new Date().toISOString(),
            pauseReason: reason || 'human_needed',
          },
        },
        select: {
          id: true,
          departmentId: true,
        },
      });

      // ✅ NOVO: Notificar departamento via HandoverService
      if (conversation.departmentId) {
        await this.handoverService.notifyDepartmentHandover(
          conversationId,
          conversation.departmentId,
          reason || 'human_needed'
        );
      }
    }

    return { success: true, executionId: execution.id };
  }

  /**
   * Retoma execução - ✅ REFATORADO
   */
  async resumeExecution(citizenId: string, conversationId?: string, resumedBy?: string) {
    const execution = await this.getActiveExecution(citizenId);
    if (!execution) {
      throw new Error('Nenhuma execução ativa encontrada para este cidadão');
    }

    // Retomar no FlowExecution (fonte de verdade)
    await prisma.flowExecution.update({
      where: { id: execution.id },
      data: {
        isPaused: false,
        resumedAt: new Date(),
        resumedBy: resumedBy || null,
      },
    });

    // Atualizar metadata da conversa
    if (conversationId) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          metadata: {
            botStatus: 'ACTIVE',
            botStatusUpdatedAt: new Date().toISOString(),
          },
        },
      });
    }

    return { success: true, executionId: execution.id };
  }

  /**
   * Move arquivo de temp para armazenamento permanente
   */
  private async moveToPermStorage(file: any): Promise<{ fileName: string; filePath: string; fileUrl: string; fileSize: number; mimeType: string }> {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const baseUrl = process.env.BASE_URL || 'http://localhost:9001';

    // Determinar subpasta pelo tipo
    let subfolder = 'documents';
    if (file.mimetype?.startsWith('image/')) {
      subfolder = 'images';
    } else if (file.mimetype?.startsWith('audio/')) {
      subfolder = 'audio';
    }

    const destDir = path.join(uploadDir, 'bot', subfolder);
    await fs.mkdir(destDir, { recursive: true });

    // Nome único preservando extensão original
    const ext = path.extname(file.originalname || '');
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const destPath = path.join(destDir, uniqueName);

    // Mover de temp para permanente
    if (file.path) {
      await fs.rename(file.path, destPath).catch(async () => {
        // Se rename falha (cross-device), copiar e deletar
        await fs.copyFile(file.path, destPath);
        await fs.unlink(file.path).catch(() => {});
      });
    }

    return {
      fileName: file.originalname || uniqueName,
      filePath: destPath,
      fileUrl: `${baseUrl}/uploads/bot/${subfolder}/${uniqueName}`,
      fileSize: file.size || 0,
      mimeType: file.mimetype || 'application/octet-stream',
    };
  }

  /**
   * Handle upload de arquivos
   */
  async handleUpload(citizenId: string, files: any[], conversationId?: string) {
    if (!conversationId) {
      const conversation = await this.findOrCreateBotConversation(citizenId);
      conversationId = conversation.id;
    }

    // Mover arquivos de temp para armazenamento permanente
    const uploadedFiles = await Promise.all(
      files.map(async (file: any) => {
        try {
          return await this.moveToPermStorage(file);
        } catch (err) {
          console.error('[FlowEngineService] Erro ao mover arquivo:', err);
          return {
            fileName: file.originalname,
            filePath: file.path,
            fileUrl: '',
            fileSize: file.size,
            mimeType: file.mimetype,
          };
        }
      })
    );

    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: citizenId,
        senderType: 'CITIZEN',
        content: `Arquivos enviados (${uploadedFiles.length})`,
        contentType: 'DOCUMENT',
        attachments: uploadedFiles as any,
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    const response = await this.flowEngine.processMessage(citizenId, uploadedFiles, conversationId);
    const botMetadata = this.buildBotMetadata(response);
    const botStatus = response.metadata?.paused ? 'HUMAN_TAKEOVER' : 'ACTIVE';

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
        // ✅ CAMPOS QUERYABLE
        isBotMessage: true,
        botInteractionType: response.messageType || 'message',
        botFlowNodeId: response.metadata?.nodeId,
        botStructuredData: (response.data || null) as any,
      },
    });

    // ✅ REFATORADO - atualização simplificada
    const conv2 = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        participant1Id: true,
        participant1Type: true,
      },
    });

    const isFileThird = conv2?.participant1Id === citizenId &&
      conv2?.participant1Type === 'CITIZEN';

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: response.message.substring(0, 100),
        totalMessages: { increment: 2 },
        metadata: {
          botStatus,
          botStatusUpdatedAt: new Date().toISOString(),
        },
        ...(isFileThird
          ? { unreadCount1: { increment: 1 } }
          : { unreadCount2: { increment: 1 } }),
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
    const messageServerId = await ensureActiveMessageServerId();

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
      // Criar nova conversa (✅ REFATORADO - sem campos antigos)
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
          // activeFlowExecutionId será setado quando o fluxo iniciar
          metadata: {
            botStatus: 'IDLE',
            botStatusUpdatedAt: new Date().toISOString(),
          },
          totalMessages: 0,
          unreadCount1: 0,
          unreadCount2: 0,
        },
      });
    }

    return conversation;
  }
}

export default FlowEngineService;
