import { IntentRecognitionService } from './IntentRecognitionService';
import { ServiceKnowledgeBase } from './ServiceKnowledgeBase';
import { ContextManager } from './ContextManager';
import { RecommendationEngine } from './RecommendationEngine';
import FlowManager from './FlowManager';
import InputValidator from './InputValidator';
import SentimentAnalysisService from './SentimentAnalysisService';
import ProactiveNotificationService from './ProactiveNotificationService';
import { BotResponse } from './types';
import { prisma } from '../../lib/prisma';

/**
 * BotServiceEnhanced - Versão melhorada do serviço de bot
 *
 * Novas funcionalidades:
 * - Fluxos conversacionais multi-step
 * - Validação inteligente de entradas
 * - Detecção de frustração e sentimento
 * - Transferência automática para humano
 * - Persistência em banco de dados
 * - Detecção de contexto ambíguo
 */
export class BotServiceEnhanced {
  private static instance: BotServiceEnhanced;

  private intentRecognition: IntentRecognitionService;
  private knowledgeBase: ServiceKnowledgeBase;
  private contextManager: ContextManager;
  private recommendationEngine: RecommendationEngine;
  private flowManager: FlowManager;
  private sentimentAnalysis: SentimentAnalysisService;
  private proactiveNotifications: ProactiveNotificationService;

  private constructor() {
    this.intentRecognition = new IntentRecognitionService();
    this.knowledgeBase = new ServiceKnowledgeBase();
    this.contextManager = new ContextManager();
    this.recommendationEngine = new RecommendationEngine();
    this.flowManager = FlowManager.getInstance();
    this.sentimentAnalysis = SentimentAnalysisService.getInstance();
    this.proactiveNotifications = ProactiveNotificationService.getInstance();
  }

  public static getInstance(): BotServiceEnhanced {
    if (!BotServiceEnhanced.instance) {
      BotServiceEnhanced.instance = new BotServiceEnhanced();
    }
    return BotServiceEnhanced.instance;
  }

  /**
   * Processa uma mensagem do cidadão
   */
  public async processMessage(
    citizenId: string,
    message: string
  ): Promise<BotResponse> {
    const startTime = Date.now();

    try {
      // 1. Busca ou cria conversação ativa
      let conversation = await prisma.botConversation.findFirst({
        where: { citizenId, isActive: true },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!conversation) {
        conversation = await prisma.botConversation.create({
          data: { citizenId },
          include: { messages: true },
        });

        // Verifica se é primeiro acesso - iniciar onboarding
        const citizenProtocolsCount = await prisma.protocolSimplified.count({
          where: { citizenId },
        });

        if (citizenProtocolsCount === 0) {
          // Cidadão novo - iniciar onboarding
          return await this.flowManager.startFlow(citizenId, 'ONBOARDING');
        }
      }

      // 2. Salva mensagem do usuário
      await prisma.botMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: message,
          messageType: 'text',
        },
      });

      // 3. Verifica se há fluxo ativo
      if (conversation.currentFlow) {
        // Processa etapa do fluxo
        const flowResponse = await this.flowManager.processFlowStep(
          citizenId,
          message
        );

        // Salva resposta do bot
        await prisma.botMessage.create({
          data: {
            conversationId: conversation.id,
            role: 'bot',
            content: flowResponse.response,
            messageType: flowResponse.messageType,
            metadata: flowResponse.metadata,
          },
        });

        // Registra analytics
        await this.registerAnalytics(
          'FLOW_STEP',
          true,
          1.0,
          Date.now() - startTime,
          citizenId,
          false
        );

        return flowResponse;
      }

      // 4. Obtém contexto
      const context = await this.contextManager.getContext(citizenId);
      const previousMessages = conversation.messages
        .map((m: any) => m.content)
        .reverse();

      // 5. Análise de sentimento
      const sentiment = this.sentimentAnalysis.analyzeSentiment(message, {
        previousMessages,
        failedAttempts: (context.metadata as any)?.failedAttempts || 0,
        lowConfidenceCount: (context.metadata as any)?.lowConfidenceCount || 0,
      });

      console.log(`😊 Sentimento: ${sentiment.label} (score: ${sentiment.score})`);

      // 6. Verifica se deve transferir para humano
      if (sentiment.shouldTransferToHuman) {
        return await this.transferToHuman(
          citizenId,
          conversation.id,
          'FRUSTRATION_DETECTED',
          sentiment
        );
      }

      // 7. Busca serviços relevantes para contexto do Ollama
      const relevantServices = await this.knowledgeBase.searchServices(message, 10);

      // 8. Reconhece intenção (com Ollama/Phi-4, OpenAI ou Keywords)
      const intent = await this.intentRecognition.recognizeIntent(
        message,
        context,
        relevantServices
      );

      console.log(
        `🤖 Intent: ${intent.name} (confiança: ${intent.confidence})`
      );

      // 9. Se Ollama retornou cards sugeridos, usá-los diretamente
      if (intent.suggestedCards && intent.suggestedCards.length > 0) {
        const response = this.generateResponseTextForIntent(intent.name);

        const botResponse: BotResponse = {
          response,
          messageType: 'card',
          cards: intent.suggestedCards.map((card, index) => ({
            id: `ollama-card-${Date.now()}-${index}`,
            title: card.title,
            description: card.description,
            action: {
              type: 'custom' as const,
              label: card.actionLabel,
              url: intent.entities?.serviceId ? `/services/${intent.entities.serviceId}` : undefined,
            },
          })),
          metadata: {
            intent: intent.name,
            confidence: intent.confidence,
            source: 'ollama_generated'
          },
        };

        // Salva resposta do bot
        await prisma.botMessage.create({
          data: {
            conversationId: conversation.id,
            role: 'bot',
            content: botResponse.response,
            messageType: botResponse.messageType,
            metadata: botResponse.metadata,
          },
        });

        // Registra analytics
        await this.registerAnalytics(
          intent.name,
          true,
          intent.confidence,
          Date.now() - startTime,
          citizenId,
          false
        );

        return botResponse;
      }

      // 8. Tratamento de intents especiais (IA indisponível ou clarificação)
      if (intent.name === 'AI_UNAVAILABLE') {
        console.log('🔀 IA indisponível, transferindo para humano');
        return await this.transferToHuman(
          citizenId,
          conversation.id,
          'AI_ERROR',
          sentiment
        );
      }

      if (intent.name === 'CLARIFICATION_NEEDED') {
        console.log('❓ Clarificação necessária');

        const botResponse: BotResponse = {
          response: 'Não entendi muito bem. Você pode reformular ou escolher uma das opções abaixo?',
          messageType: 'quick_reply',
          quickReplies: [
            'Quero agendar consulta médica',
            'Preciso solicitar um serviço',
            'Ver meus protocolos',
            'Falar com atendente'
          ],
          metadata: {
            needsClarification: true,
            originalIntent: intent.entities?.originalIntent,
            confidence: intent.confidence
          }
        };

        // Salva resposta do bot
        await prisma.botMessage.create({
          data: {
            conversationId: conversation.id,
            role: 'bot',
            content: botResponse.response,
            messageType: botResponse.messageType,
            metadata: botResponse.metadata,
          },
        });

        return botResponse;
      }

      // Reset contadores em caso de sucesso
      await this.contextManager.updateContext(citizenId, {
        metadata: { failedAttempts: 0, lowConfidenceCount: 0 },
      });

      // 9. Atualiza contexto
      await this.contextManager.updateContext(citizenId, {
        lastIntent: intent.name,
        lastMessage: message,
        timestamp: new Date(),
      });

      await prisma.botConversation.update({
        where: { id: conversation.id },
        data: {
          intent: intent.name,
          confidence: intent.confidence,
        },
      });

      // 10. Processa intent
      const response = await this.handleIntent(
        citizenId,
        intent,
        message,
        context,
        sentiment
      );

      // 11. Salva resposta do bot
      await prisma.botMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'bot',
          content: response.response,
          messageType: response.messageType,
          metadata: response.metadata,
          intent: intent.name,
          confidence: intent.confidence,
        },
      });

      // 12. Registra analytics
      await this.registerAnalytics(
        intent.name,
        true,
        intent.confidence,
        Date.now() - startTime,
        citizenId,
        false
      );

      return response;
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);

      // Registra falha no analytics
      await this.registerAnalytics(
        'ERROR',
        false,
        0,
        Date.now() - startTime,
        citizenId,
        false
      );

      return {
        response:
          'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente ou fale com um atendente.',
        messageType: 'text',
        quickReplies: ['Falar com atendente', 'Tentar novamente'],
      };
    }
  }

  /**
   * Processa a intenção reconhecida
   */
  private async handleIntent(
    citizenId: string,
    intent: any,
    message: string,
    context: any,
    sentiment: any
  ): Promise<BotResponse> {
    // Adiciona prefixo empático se necessário
    let responsePrefix = this.sentimentAnalysis.generateEmpatheticResponse(
      sentiment
    );

    // Roteamento de intents
    switch (intent.name) {
      case 'AGENDAR_CONSULTA':
        // NOVO: Buscar serviço de consulta no banco e usar fluxo dinâmico
        const consultaService = await this.findConsultaService();
        if (consultaService) {
          console.log(`🏥 Iniciando fluxo dinâmico para consulta: ${consultaService.id}`);
          return this.flowManager.startDynamicServiceFlow(citizenId, consultaService.id);
        }
        return {
          response: 'Desculpe, não encontrei o serviço de agendamento de consultas. Por favor, fale com um atendente.',
          messageType: 'text',
          quickReplies: ['Falar com atendente', 'Menu principal']
        };

      case 'SOLICITAR_SERVICO':
        // Se IA identificou serviceId, usar fluxo dinâmico
        const serviceId = intent.entities?.serviceId;
        if (serviceId) {
          console.log(`📝 IA identificou serviço: ${serviceId}, iniciando fluxo dinâmico`);
          return this.flowManager.startDynamicServiceFlow(citizenId, serviceId);
        }
        // Senão, buscar serviços e oferecer opções
        return this.handleSearchServices(citizenId, intent.entities?.searchTerm || '');

      case 'ENVIAR_DOCUMENTO':
        return this.flowManager.startFlow(citizenId, 'ENVIAR_DOCUMENTO');

      case 'VER_PROTOCOLOS':
        return this.handleViewProtocols(citizenId, responsePrefix);

      case 'STATUS_PROTOCOLO':
        return this.handleProtocolStatus(
          citizenId,
          intent.entities,
          responsePrefix
        );

      case 'CHAT_HUMANO':
        const conversation = await prisma.botConversation.findFirst({
          where: { citizenId, isActive: true },
        });
        return this.transferToHuman(
          citizenId,
          conversation!.id,
          'USER_REQUEST',
          sentiment
        );

      case 'SAUDACAO':
        return this.handleGreeting(citizenId, responsePrefix);

      case 'DESPEDIDA':
        return this.handleFarewell(citizenId, responsePrefix);

      case 'AJUDA':
        return this.handleHelp(responsePrefix);

      default:
        return this.handleGenericIntent(
          intent.name,
          citizenId,
          responsePrefix
        );
    }
  }

  /**
   * Lida com contexto ambíguo - oferece opções
   */
  private handleAmbiguousContext(intent: any, message: string): BotResponse {
    // Usa InputValidator para detectar possíveis tipos
    const detected = InputValidator.autoDetect(message);

    if (detected.possibleTypes.length > 0) {
      return {
        response: `Não tenho certeza do que você quis dizer. Você se refere a:`,
        messageType: 'quick_reply',
        quickReplies: [
          ...detected.possibleTypes.map(t => t.label),
          'Falar com atendente',
        ],
        metadata: {
          ambiguous: true,
          detectedTypes: detected.possibleTypes,
        },
      };
    }

    // Oferece intents mais prováveis
    return {
      response:
        'Desculpe, não entendi muito bem. Você quer:',
      messageType: 'quick_reply',
      quickReplies: [
        'Agendar consulta',
        'Solicitar serviço',
        'Ver meus protocolos',
        'Enviar documento',
        'Falar com atendente',
      ],
    };
  }

  /**
   * Transfere para atendente humano
   */
  private async transferToHuman(
    citizenId: string,
    conversationId: string,
    reason: any,
    sentiment: any
  ): Promise<BotResponse> {
    // Atualiza conversação
    await prisma.botConversation.update({
      where: { id: conversationId },
      data: { isActive: false, closedAt: new Date() },
    });

    // Cancela fluxo ativo se houver
    await this.flowManager.cancelFlow(citizenId);

    // Registra analytics
    await this.registerAnalytics(
      reason,
      false,
      0,
      0,
      citizenId,
      true
    );

    const priority = this.sentimentAnalysis.getTransferPriority(sentiment);

    // TODO: Integrar com sistema de fila de atendimento
    console.log(`🔀 Transferindo para humano - Razão: ${reason} - Prioridade: ${priority}`);

    let message = '';
    if (reason === 'FRUSTRATION_DETECTED') {
      message =
        'Entendo sua frustração. Vou te conectar com um atendente humano agora mesmo. Por favor, aguarde um momento.';
    } else if (reason === 'LOW_CONFIDENCE') {
      message =
        'Parece que estou tendo dificuldade em te ajudar. Vou transferir você para um atendente que poderá ajudar melhor.';
    } else {
      message = 'Transferindo você para um atendente humano. Aguarde um momento, por favor.';
    }

    return {
      response: message,
      messageType: 'text',
      metadata: {
        transferred: true,
        reason,
        priority,
      },
    };
  }

  /**
   * Handler para ver protocolos
   */
  private async handleViewProtocols(
    citizenId: string,
    prefix?: string | null
  ): Promise<BotResponse> {
    const protocols = await prisma.protocolSimplified.findMany({
      where: { citizenId },
      include: { service: { include: { department: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (protocols.length === 0) {
      return {
        response: `${prefix || ''}Você ainda não possui nenhum protocolo.\n\nQue tal solicitar um serviço agora?`,
        messageType: 'text',
        quickReplies: ['Solicitar serviço', 'Agendar consulta'],
      };
    }

    const cards = protocols.map((p: any) => ({
      id: p.id,
      title: `Protocolo #${p.number}`,
      description: p.service.name,
      department: p.service.department.name,
      estimatedDays: p.service.estimatedDays,
      status: p.status,
      action: {
        type: 'open_protocol' as const,
        label: 'Ver detalhes',
        protocolId: p.id,
      },
    }));

    return {
      response: `${prefix || ''}Aqui estão seus últimos protocolos:`,
      messageType: 'card',
      cards,
      quickReplies: ['Solicitar outro serviço', 'Menu principal'],
    };
  }

  /**
   * Handler para status de protocolo específico
   */
  private async handleProtocolStatus(
    citizenId: string,
    entities: any,
    prefix?: string | null
  ): Promise<BotResponse> {
    // Extrai número do protocolo
    let number = entities?.number;

    if (!number) {
      return {
        response: `${prefix || ''}Qual o número do protocolo que você quer consultar?`,
        messageType: 'text',
      };
    }

    // Valida número do protocolo
    const validation = InputValidator.validateProtocolNumber(number);
    if (!validation.isValid) {
      return {
        response: validation.error || 'Número de protocolo inválido.',
        messageType: 'text',
      };
    }

    if (validation.suggestion) {
      number = validation.suggestion;
    }

    // Busca protocolo
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        citizenId,
        number: number,
      },
      include: {
        service: { include: { department: true } },
      },
    });

    if (!protocol) {
      return {
        response: `${prefix || ''}Não encontrei nenhum protocolo com o número ${number}.\n\nDeseja ver todos os seus protocolos?`,
        messageType: 'text',
        quickReplies: ['Ver meus protocolos', 'Menu principal'],
      };
    }

    return {
      response: `${prefix || ''}Aqui está o status do seu protocolo:`,
      messageType: 'card',
      cards: [
        {
          id: protocol.id,
          title: `Protocolo #${protocol.number}`,
          description: protocol.service.name,
          department: protocol.service.department.name,
          estimatedDays: protocol.service.estimatedDays || undefined,
          status: protocol.status,
          action: {
            type: 'open_protocol',
            label: 'Ver todos os detalhes',
            protocolId: protocol.id,
          },
        },
      ],
      quickReplies: ['Ver outros protocolos', 'Solicitar outro serviço'],
    };
  }

  /**
   * Handler para saudação
   */
  private async handleGreeting(
    citizenId: string,
    prefix?: string | null
  ): Promise<BotResponse> {
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
    });

    const firstName = citizen?.name.split(' ')[0] || 'cidadão';
    const hour = new Date().getHours();
    let greeting = 'Olá';

    if (hour < 12) greeting = 'Bom dia';
    else if (hour < 18) greeting = 'Boa tarde';
    else greeting = 'Boa noite';

    // Busca recomendações
    const recommendations = await this.recommendationEngine.getRecommendations(
      citizenId,
      'greeting'
    );

    let quickReplies: string[] = [];
    if (recommendations.length > 0) {
      quickReplies = recommendations.slice(0, 3).map((r: any) => r.service?.name || r.text).filter(Boolean);
    }

    // Se não houver recomendações, busca os 3 serviços mais populares
    if (quickReplies.length === 0) {
      const popularServices = await prisma.serviceSimplified.findMany({
        orderBy: { id: 'asc' },
        take: 3,
        select: { name: true }
      });
      quickReplies = popularServices.map((s: any) => s.name);
    }

    return {
      response: `${prefix || ''}${greeting}, ${firstName}! 👋\n\nSou o DigiBot, seu assistente virtual. Como posso ajudar você hoje?`,
      messageType: 'text',
      quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
    };
  }

  /**
   * Handler para despedida
   */
  private async handleFarewell(
    citizenId: string,
    prefix?: string | null
  ): Promise<BotResponse> {
    // Fecha conversação
    await prisma.botConversation.updateMany({
      where: { citizenId, isActive: true },
      data: { isActive: false, closedAt: new Date() },
    });

    return {
      response: `${prefix || ''}Até logo! Foi um prazer ajudar você. 😊\n\nSempre que precisar, é só me chamar!`,
      messageType: 'text',
    };
  }

  /**
   * Handler para ajuda
   */
  private async handleHelp(prefix?: string | null): Promise<BotResponse> {
    // Busca alguns serviços disponíveis
    const services = await prisma.serviceSimplified.findMany({
      orderBy: { id: 'asc' },
      take: 4,
      select: { name: true }
    });

    const quickReplies = services.map((s: any) => s.name);

    return {
      response: `${prefix || ''}Posso te ajudar com:\n\n• 📋 Solicitar serviços municipais\n• 📄 Enviar documentos\n• 🔍 Consultar protocolos\n• 💬 Falar com um atendente\n\nÉ só me dizer o que você precisa!`,
      messageType: 'text',
      quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
    };
  }

  /**
   * Handler genérico para outros intents
   */
  private async handleGenericIntent(
    intent: string,
    citizenId: string,
    prefix?: string | null
  ): Promise<BotResponse> {
    // Busca serviços relacionados
    const services = await this.knowledgeBase.searchServices(intent, 3);

    if (services.length > 0) {
      const cards = services.map((s: any) => ({
        id: s.id,
        title: s.name,
        description: s.description || '',
        department: s.department?.name || 'N/A',
        estimatedDays: s.estimatedDays,
        action: {
          type: 'open_service' as const,
          label: 'Solicitar este serviço',
          serviceId: s.id,
        },
      }));

      // Busca quick replies baseado em outros serviços
      const otherServices = await prisma.serviceSimplified.findMany({
        where: {
          id: { notIn: services.map((s: any) => s.id) }
        },
        orderBy: { id: 'asc' },
        take: 2,
        select: { name: true }
      });

      return {
        response: `${prefix || ''}Encontrei estes serviços relacionados:`,
        messageType: 'card',
        cards,
        quickReplies: otherServices.length > 0 ? otherServices.map((s: any) => s.name) : undefined,
      };
    }

    return {
      response: `${prefix || ''}Desculpe, não tenho certeza de como ajudar com isso.\n\nVocê pode me dizer de outra forma ou escolher uma das opções:`,
      messageType: 'text',
      quickReplies: [
        'Agendar consulta',
        'Solicitar serviço',
        'Ver protocolos',
        'Falar com atendente',
      ],
    };
  }

  /**
   * Gera texto de resposta baseado na intenção
   */
  private generateResponseTextForIntent(intentName: string): string {
    const responses: Record<string, string> = {
      AGENDAR_CONSULTA: '📅 Ótimo! Vou te ajudar a agendar uma consulta. Aqui estão as opções disponíveis:',
      SOLICITAR_SERVICO: '📋 Aqui estão os serviços que encontrei para você:',
      CONSULTAR_PROTOCOLO: '🔍 Vou consultar o status do seu protocolo:',
      ENVIAR_DOCUMENTO: '📎 Pronto para receber seu documento:',
      INFORMACAO_SERVICO: 'ℹ️ Aqui estão as informações sobre o serviço:',
      RECLAMACAO: '📢 Entendi, vou registrar sua reclamação:',
      ELOGIO: '😊 Que bom ouvir isso! Obrigado pelo feedback:',
      SAUDACAO: '👋 Olá! Como posso ajudar você hoje?',
      DESPEDIDA: '👋 Até logo! Qualquer coisa, estou aqui.',
      AJUDA: '❓ Aqui estão algumas coisas que posso fazer por você:',
      OUTROS: '🤔 Aqui estão algumas sugestões do que posso ajudar:',
    };

    return responses[intentName] || '✨ Aqui está o que encontrei para você:';
  }

  /**
   * Registra analytics
   */
  private async registerAnalytics(
    intent: string,
    success: boolean,
    confidence: number,
    responseTime: number,
    citizenId: string,
    wasTransferred: boolean
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Busca ou cria registro do dia
      const existing = await prisma.botAnalytics.findUnique({
        where: {
          date_intent: {
            date: today,
            intent,
          },
        },
      });

      if (existing) {
        await prisma.botAnalytics.update({
          where: { id: existing.id },
          data: {
            totalCount: { increment: 1 },
            successCount: { increment: success ? 1 : 0 },
            transferCount: { increment: wasTransferred ? 1 : 0 },
            avgConfidence:
              ((existing.avgConfidence || 0) * existing.totalCount + confidence) /
              (existing.totalCount + 1),
            avgResponseTime:
              (existing.avgResponseTime || 0) * existing.totalCount + responseTime,
          },
        });
      } else {
        await prisma.botAnalytics.create({
          data: {
            date: today,
            intent,
            totalCount: 1,
            successCount: success ? 1 : 0,
            transferCount: wasTransferred ? 1 : 0,
            avgConfidence: confidence,
            avgResponseTime: responseTime,
            uniqueCitizens: 1,
          },
        });
      }
    } catch (error) {
      console.error('Erro ao registrar analytics:', error);
    }
  }

  /**
   * Busca serviço de consulta médica no banco de dados
   */
  private async findConsultaService() {
    try {
      const service = await prisma.serviceSimplified.findFirst({
        where: {
          OR: [
            { name: { contains: 'consulta', mode: 'insensitive' } },
            { name: { contains: 'agendamento', mode: 'insensitive' } },
            { moduleType: 'SAUDE' }
          ],
          isActive: true
        },
        orderBy: { name: 'asc' }
      });

      return service;
    } catch (error) {
      console.error('Erro ao buscar serviço de consulta:', error);
      return null;
    }
  }

  /**
   * Busca serviços e oferece opções interativas
   */
  private async handleSearchServices(citizenId: string, searchTerm: string): Promise<BotResponse> {
    try {
      const services = await prisma.serviceSimplified.findMany({
        where: {
          isActive: true,
          OR: searchTerm ? [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { category: { contains: searchTerm, mode: 'insensitive' } }
          ] : undefined
        },
        take: 10,
        orderBy: { name: 'asc' },
        include: { department: true }
      });

      if (services.length === 0) {
        return {
          response: searchTerm
            ? `Não encontrei serviços relacionados a "${searchTerm}". Tente outro termo ou fale com um atendente.`
            : 'Não encontrei serviços disponíveis. Por favor, fale com um atendente.',
          messageType: 'text',
          quickReplies: ['Falar com atendente', 'Menu principal']
        };
      }

      // Se encontrou apenas 1 serviço, iniciar fluxo direto
      if (services.length === 1) {
        console.log(`🎯 Único serviço encontrado: ${services[0].id}, iniciando fluxo`);
        return this.flowManager.startDynamicServiceFlow(citizenId, services[0].id);
      }

      // Se encontrou múltiplos, oferecer cards
      return {
        response: searchTerm
          ? `Encontrei ${services.length} serviços relacionados a "${searchTerm}":`
          : `Aqui estão os serviços disponíveis:`,
        messageType: 'card',
        cards: services.map(service => ({
          id: service.id,
          title: service.name,
          description: service.description?.substring(0, 100) || 'Sem descrição',
          department: service.department?.name,
          estimatedDays: service.estimatedDays || undefined,
          action: {
            type: 'open_service' as const,
            label: 'Solicitar',
            serviceId: service.id
          }
        })),
        quickReplies: ['Buscar outro serviço', 'Menu principal']
      };

    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      return {
        response: 'Erro ao buscar serviços. Por favor, tente novamente ou fale com um atendente.',
        messageType: 'text',
        quickReplies: ['Tentar novamente', 'Falar com atendente']
      };
    }
  }
}

export default BotServiceEnhanced;
