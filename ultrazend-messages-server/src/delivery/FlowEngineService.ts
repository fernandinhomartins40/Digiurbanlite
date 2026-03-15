/**
 * FlowEngineService
 * Orquestra FlowEngine + ConversationService + WebSocket
 */

import { FlowEngine } from '../bot/flow/FlowEngine';
import { actionHandlers } from '../bot/flow/ActionHandlers';
import { citizenAiOrchestrator } from '../bot/ai/CitizenAiOrchestrator';
import prisma from '../utils/prisma';
import { WebSocketServer } from '../server/WebSocketServer';
import { HandoverService } from './HandoverService'; // âœ… NOVO
import fs from 'fs/promises';
import path from 'path';
import { ensureActiveMessageServerId } from '../utils/messageServer';

export class FlowEngineService {
  private flowEngine: FlowEngine;
  private wsServer: WebSocketServer | null = null;
  private handoverService: HandoverService; // âœ… NOVO

  constructor(wsServer?: WebSocketServer) {
    this.flowEngine = new FlowEngine(actionHandlers);
    this.handoverService = new HandoverService(wsServer); // âœ… NOVO
    if (wsServer) {
      this.wsServer = wsServer;
    }
  }

  setWebSocketServer(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
    this.handoverService.setWebSocketServer(wsServer); // âœ… NOVO
  }

  // âœ… NOVO: Expor HandoverService para rotas
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

    if (response.data?.cards) {
      metadata.cards = JSON.parse(JSON.stringify(response.data.cards));
    }

    // Passa campos extras de display para o frontend (carrossÃ©is, categorias, etc.)
    if (response.data?.displayMode) {
      metadata.displayMode = response.data.displayMode;
    }
    if (response.data?.categories) {
      metadata.categories = response.data.categories;
    }
    if (response.data?.departmentName) {
      metadata.departmentName = response.data.departmentName;
    }

    // Documentos obrigatÃ³rios para upload rico no bot
    if (response.data?.requiredDocuments) {
      metadata.requiredDocuments = response.data.requiredDocuments;
    }

    // Card rico de detalhes do protocolo
    if (response.data?.protocolDetailCard) {
      metadata.protocolDetailCard = response.data.protocolDetailCard;
    }

    return metadata;
  }

  private formatUserMessageContent(message: any): string {
    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message)) {
      // Para uploads, gerar descriÃ§Ã£o legÃ­vel
      if (message.length > 0 && message[0]?.fileName) {
        const fileNames = message.map((f: any) => f.fileName).join(', ');
        return `ðŸ“Ž Arquivos enviados: ${fileNames}`;
      }
      return `Dados enviados (${message.length} itens)`;
    }

    if (typeof message === 'object' && message !== null) {
      // SeleÃ§Ã£o de menu (frontend envia { optionId, label })
      if (typeof (message as any).label === 'string' && (message as any).label.trim()) {
        return (message as any).label.trim();
      }

      // Para formulÃ¡rios, gerar resumo legÃ­vel dos campos
      const entries = Object.entries(message).filter(([_, v]) => v !== null && v !== undefined && v !== '');
      if (entries.length > 0) {
        const summary = entries
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        return `ðŸ“ Dados do formulÃ¡rio:\n${summary}`;
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
    const requestedFlowName = flowName || 'ai_assistant';
    const normalizedFlowName =
      requestedFlowName === 'menu_principal' ? 'ai_assistant' : requestedFlowName;

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
    let response;
    if (normalizedFlowName === 'ai_assistant') {
      await this.flowEngine.cancelActiveFlow(citizenId);
      const aiFlow = await this.getFlowDefinitionByName('ai_assistant');
      if (!aiFlow) {
        throw new Error('Flow ai_assistant not found');
      }
      const activeExecution = await this.getActiveExecution(citizenId);
      const result = await citizenAiOrchestrator.startSession({
        citizenId,
        flowId: aiFlow.id,
        conversationId,
        existingExecution: activeExecution as any,
      });
      response = result.response;
      await this.linkConversationToExecution(conversationId, result.execution.id, 'ACTIVE');
    } else {
      response = await this.flowEngine.startFlow(citizenId, normalizedFlowName, conversationId);
    }
    const botMetadata = this.buildBotMetadata(response);

    // 3. Vincular conversa Ã  execuÃ§Ã£o ativa do bot (âœ… REFATORADO)
    if (normalizedFlowName !== 'ai_assistant') {
      const execution = await this.getActiveExecution(citizenId);
      if (execution) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            isBotConversation: true,
            activeFlowExecutionId: execution.id, // âœ… FK para FlowExecution
            metadata: {
              botStatus: 'ACTIVE',
              botStatusUpdatedAt: new Date().toISOString(),
            },
          },
        });
      }
    }

    // 4. Salvar mensagem do bot (âœ… REFATORADO com campos queryable)
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
        // âœ… NOVOS CAMPOS QUERYABLE
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

      // Notificar tambÃ©m o cidadÃ£o diretamente
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
   * Processa mensagem do usuÃ¡rio
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

    // 2. Salvar mensagem do cidadÃ£o (âœ… REFATORADO com campos queryable)
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
        // âœ… CAMPOS QUERYABLE
        botInteractionType,
        botSelectedOption,
        botStructuredData: botStructuredData as any,
      },
    });

    // 3. Processar mensagem pelo orquestrador hibrido ou pelo fluxo legado
    const activeExecution = await this.getActiveExecution(citizenId);
    const aiExecutionActive = this.isAiExecution(activeExecution as any);
    const shouldUseAi = !activeExecution || aiExecutionActive;

    let response;
    let botStatus = 'ACTIVE';

    if (shouldUseAi) {
      const aiFlow = await this.getFlowDefinitionByName('ai_assistant');
      if (!aiFlow) {
        throw new Error('Flow ai_assistant not found');
      }

      const normalizedMessage =
        typeof message === 'string'
          ? message
          : typeof message === 'object' && message !== null && typeof (message as any).optionId === 'string'
            ? String((message as any).optionId)
            : this.formatUserMessageContent(message);

      const recentMessages = await this.getRecentConversationMessages(conversationId);
      const aiDecision = await citizenAiOrchestrator.processText({
        citizenId,
        flowId: aiFlow.id,
        conversationId,
        message: normalizedMessage,
        existingExecution: activeExecution as any,
        recentMessages,
      });

      if (aiDecision.redirectToFlowName) {
        await this.flowEngine.cancelActiveFlow(citizenId);
        response = await this.flowEngine.startFlow(citizenId, aiDecision.redirectToFlowName, conversationId);
        const redirectedExecution = await this.getActiveExecution(citizenId);
        if (redirectedExecution) {
          await this.linkConversationToExecution(conversationId, redirectedExecution.id, 'ACTIVE');
        }
      } else {
        response = aiDecision.response;
        const refreshedExecution = await this.getActiveExecution(citizenId);
        if (refreshedExecution) {
          await this.linkConversationToExecution(conversationId, refreshedExecution.id, aiDecision.requestHumanHandover ? 'HUMAN_TAKEOVER' : 'ACTIVE');
        }
        if (aiDecision.requestHumanHandover) {
          await this.pauseExecution(citizenId, conversationId, undefined, aiDecision.handoverReason);
          botStatus = 'HUMAN_TAKEOVER';
        }
      }
    } else {
      response = await this.flowEngine.processMessage(citizenId, message, conversationId);
      botStatus = response.metadata?.paused ? 'HUMAN_TAKEOVER' : 'ACTIVE';
    }

    const botMetadata = this.buildBotMetadata(response);
    const botContent = response.message || 'Ocorreu um erro ao processar sua solicitacao.';

    // 4. Salvar resposta do bot (âœ… REFATORADO)
    const botMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: 'DIGIBOT_SYSTEM',
        senderType: 'SYSTEM',
        content: botContent,
        contentType: 'TEXT',
        status: 'SENT',
        sentAt: new Date(),
        metadata: botMetadata as any,
        // âœ… CAMPOS QUERYABLE
        isBotMessage: true,
        botInteractionType: response.messageType || 'message',
        botFlowNodeId: response.metadata?.nodeId || null,
        botStructuredData: (response.data || null) as any,
      },
    });

    // 5. Atualizar conversa (âœ… REFATORADO - sem botFlowData)
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: botContent.substring(0, 100),
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
   * ObtÃ©m execuÃ§Ã£o ativa
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
   * Pausa execuÃ§Ã£o (para atendimento humano) - âœ… REFATORADO COM HANDOVER
   */
  async pauseExecution(citizenId: string, conversationId?: string, pausedBy?: string, reason?: string) {
    const execution = await this.getActiveExecution(citizenId);
    if (!execution) {
      throw new Error('Nenhuma execuÃ§Ã£o ativa encontrada para este cidadÃ£o');
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

      // âœ… NOVO: Notificar departamento via HandoverService
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
   * Retoma execuÃ§Ã£o - âœ… REFATORADO
   */
  async resumeExecution(citizenId: string, conversationId?: string, resumedBy?: string) {
    const execution = await this.getActiveExecution(citizenId);
    if (!execution) {
      throw new Error('Nenhuma execuÃ§Ã£o ativa encontrada para este cidadÃ£o');
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

    // Nome Ãºnico preservando extensÃ£o original
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

    const activeExecution = await this.getActiveExecution(citizenId);
    const aiExecutionActive = this.isAiExecution(activeExecution as any);

    let response;
    let botStatus = 'ACTIVE';

    if (!activeExecution || aiExecutionActive) {
      const aiFlow = await this.getFlowDefinitionByName('ai_assistant');
      if (!aiFlow) {
        throw new Error('Flow ai_assistant not found');
      }
      const aiDecision = await citizenAiOrchestrator.processUpload({
        citizenId,
        flowId: aiFlow.id,
        conversationId,
        files: uploadedFiles as any,
        existingExecution: activeExecution as any,
      });
      response = aiDecision.response;
      const refreshedExecution = await this.getActiveExecution(citizenId);
      if (refreshedExecution) {
        await this.linkConversationToExecution(conversationId, refreshedExecution.id, aiDecision.requestHumanHandover ? 'HUMAN_TAKEOVER' : 'ACTIVE');
      }
      if (aiDecision.requestHumanHandover) {
        await this.pauseExecution(citizenId, conversationId, undefined, aiDecision.handoverReason);
        botStatus = 'HUMAN_TAKEOVER';
      }
    } else {
      response = await this.flowEngine.processMessage(citizenId, uploadedFiles, conversationId);
      botStatus = response.metadata?.paused ? 'HUMAN_TAKEOVER' : 'ACTIVE';
    }

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
        // âœ… CAMPOS QUERYABLE
        isBotMessage: true,
        botInteractionType: response.messageType || 'message',
        botFlowNodeId: response.metadata?.nodeId,
        botStructuredData: (response.data || null) as any,
      },
    });

    // âœ… REFATORADO - atualizaÃ§Ã£o simplificada
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

  getBotHealth() {
    return {
      status: 'ok',
      runtime: 'hybrid_ai',
      ai: citizenAiOrchestrator.getStats(),
    };
  }

  private async getFlowDefinitionByName(name: string): Promise<{ id: string; name: string } | null> {
    const flow = await prisma.flowDefinition.findFirst({
      where: {
        name,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return flow;
  }

  private async linkConversationToExecution(
    conversationId: string,
    executionId: string,
    botStatus: 'ACTIVE' | 'HUMAN_TAKEOVER',
  ): Promise<void> {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        isBotConversation: true,
        activeFlowExecutionId: executionId,
        metadata: {
          botStatus,
          botStatusUpdatedAt: new Date().toISOString(),
        },
      },
    });
  }

  private isAiExecution(execution: { flow?: { name: string } | null; metadata?: unknown } | null): boolean {
    if (!execution) {
      return false;
    }

    const metadata = execution.metadata as Record<string, unknown> | undefined;
    return String(metadata?.engine || '') === 'ai_assistant' || execution.flow?.name === 'ai_assistant';
  }

  private async getRecentConversationMessages(conversationId: string, limit: number = 6): Promise<string[]> {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { sentAt: 'desc' },
      take: limit,
      select: {
        senderId: true,
        senderType: true,
        content: true,
      },
    });

    return messages
      .reverse()
      .map((item) => {
        const sender =
          item.senderId === 'DIGIBOT_SYSTEM' || item.senderType === 'SYSTEM' ? 'bot' : 'cidadao';
        return `${sender}: ${item.content}`;
      });
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
      // Criar nova conversa (âœ… REFATORADO - sem campos antigos)
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
          // activeFlowExecutionId serÃ¡ setado quando o fluxo iniciar
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
