import { IntentRecognitionService } from './IntentRecognitionService';
import { ServiceKnowledgeBase } from './ServiceKnowledgeBase';
import { ContextManager } from './ContextManager';
import { RecommendationEngine } from './RecommendationEngine';
import FlowManager from './FlowManager';
import InputValidator from './InputValidator';
import SentimentAnalysisService from './SentimentAnalysisService';
import ProactiveNotificationService from './ProactiveNotificationService';
import { ConversationFlowManager, FlowType } from './ConversationFlowManager';
import { BotResponse } from './types';
import { prisma } from '../../lib/prisma';
import { OllamaService } from './OllamaService';

/**
 * BotServiceEnhanced - Versão melhorada do serviço de bot
 *
 * NOVA ARQUITETURA:
 * - Sistema de fluxos conversacionais estruturados
 * - Menu principal com 5 opções clicáveis
 * - IA usada estrategicamente para busca e Q&A
 * - Navegação por botões e quick replies
 * - Zero transferência para atendente humano
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
  private conversationFlowManager: ConversationFlowManager;
  private ollamaService: OllamaService;

  private constructor() {
    this.intentRecognition = new IntentRecognitionService();
    this.knowledgeBase = new ServiceKnowledgeBase();
    this.contextManager = new ContextManager();
    this.recommendationEngine = new RecommendationEngine();
    this.flowManager = FlowManager.getInstance();
    this.sentimentAnalysis = SentimentAnalysisService.getInstance();
    this.proactiveNotifications = ProactiveNotificationService.getInstance();
    this.conversationFlowManager = new ConversationFlowManager();
    this.ollamaService = new OllamaService();
  }

  public static getInstance(): BotServiceEnhanced {
    if (!BotServiceEnhanced.instance) {
      BotServiceEnhanced.instance = new BotServiceEnhanced();
    }
    return BotServiceEnhanced.instance;
  }

  /**
   * Helper para criar BotResponse com estrutura padronizada
   */
  private createResponse(
    response: string,
    messageType: 'text' | 'card' | 'interactive' | 'quick_reply' = 'text',
    options: {
      cards?: any[];
      quickReplies?: string[];
      stepType?: string;
      formOptions?: any[];
      confirmationData?: any;
      progress?: number;
      totalSteps?: number;
      [key: string]: any;
    } = {}
  ): BotResponse {
    const { cards, quickReplies, ...otherMetadata } = options;

    return {
      response,
      messageType,
      metadata: {
        cards,
        quickReplies,
        ...otherMetadata
      }
    };
  }

  /**
   * Processa uma mensagem do cidadão
   * NOVA ARQUITETURA: Menu-first com fluxos estruturados
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
      }

      // 2. Busca informações do cidadão
      const citizen = await prisma.citizen.findUnique({
        where: { id: citizenId }
      });
      const firstName = citizen?.name?.split(' ')[0];

      // 3. PRIMEIRA MENSAGEM: Sempre mostra menu principal
      const isFirstMessage = conversation.messages.length === 0;
      const isGreeting = /^(oi|olá|ola|hey|opa|bom dia|boa tarde|boa noite|menu|início|start)/i.test(message.trim());

      if (isFirstMessage || (isGreeting && !conversation.currentFlow)) {
        // Salva mensagem do usuário
        await prisma.botMessage.create({
          data: {
            conversationId: conversation.id,
            role: 'user',
            content: message,
            messageType: 'text',
          },
        });

        const response = await this.conversationFlowManager.showMainMenu(citizenId, firstName);
        console.log('🎯 [BotServiceEnhanced] Menu principal gerado:', JSON.stringify(response, null, 2));
        await this.saveAndReturn(conversation.id, response, 'MENU_PRINCIPAL', 1.0, startTime, citizenId);
        return response;
      }

      // 4. Salva mensagem do usuário (para demais casos)
      await prisma.botMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: message,
          messageType: 'text',
        },
      });

      // 5. VERIFICA SE HÁ FLUXO ATIVO
      if (conversation.currentFlow) {
        // Verifica se o usuário quer voltar ao menu
        if (/^(menu|voltar|início|cancelar)/i.test(message.trim())) {
          await prisma.botConversation.update({
            where: { id: conversation.id },
            data: {
              currentFlow: null,
              flowStep: 0,
              flowData: {}
            }
          });

          const response = await this.conversationFlowManager.showMainMenu(citizenId, firstName);
          await this.saveAndReturn(conversation.id, response, 'MENU_PRINCIPAL', 1.0, startTime, citizenId);
          return response;
        }

        // Processa o fluxo ativo
        const flowResponse = await this.conversationFlowManager.processFlowMessage(
          conversation,
          message,
          citizenId
        );

        // Se o fluxo retornou flag para usar IA (Outras Dúvidas)
        if (flowResponse.metadata?.useAI) {
          const aiResponse = await this.handleAIQuestion(
            message,
            citizenId,
            conversation.id
          );

          await this.saveAndReturn(conversation.id, aiResponse, 'AI_QUESTION', 0.8, startTime, citizenId);
          return aiResponse;
        }

        await this.saveAndReturn(conversation.id, flowResponse, conversation.currentFlow, 1.0, startTime, citizenId);
        return flowResponse;
      }

      // 6. SEM FLUXO ATIVO: Detecta intenção da mensagem e inicia fluxo apropriado
      const detectedFlow = this.conversationFlowManager.detectFlowFromMessage(message);

      if (detectedFlow) {
        if (detectedFlow === FlowType.MENU_PRINCIPAL) {
          const response = await this.conversationFlowManager.showMainMenu(citizenId, firstName);
          await this.saveAndReturn(conversation.id, response, 'MENU_PRINCIPAL', 1.0, startTime, citizenId);
          return response;
        }

        const response = await this.conversationFlowManager.startFlow(
          citizenId,
          conversation.id,
          detectedFlow
        );

        await this.saveAndReturn(conversation.id, response, detectedFlow, 1.0, startTime, citizenId);
        return response;
      }

      // 7. Mensagem não reconhecida: Oferece menu
      const response = this.createResponse(
        'Não entendi muito bem. Escolha uma das opções abaixo ou digite "menu" para ver todas as opções:',
        'quick_reply',
        {
          quickReplies: [
            '📋 Solicitar Serviço',
            '🔍 Consultar Protocolo',
            '❓ Outras Dúvidas',
            '🏠 Menu Principal'
          ]
        }
      );

      await this.saveAndReturn(conversation.id, response, 'CLARIFICATION', 0.5, startTime, citizenId);
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

      return this.createResponse(
        'Desculpe, ocorreu um erro. Por favor, tente novamente ou digite "menu" para ver as opções.',
        'quick_reply',
        { quickReplies: ['🏠 Menu Principal', '🔄 Tentar novamente'] }
      );
    }
  }

  /**
   * Helper para salvar resposta do bot e retornar
   */
  private async saveAndReturn(
    conversationId: string,
    response: BotResponse,
    intent: string,
    confidence: number,
    startTime: number,
    citizenId: string
  ): Promise<BotResponse> {
    // Salva resposta do bot
    await prisma.botMessage.create({
      data: {
        conversationId,
        role: 'bot',
        content: response.response,
        messageType: response.messageType,
        metadata: response.metadata,
        intent,
        confidence
      },
    });

    // Registra analytics
    await this.registerAnalytics(
      intent,
      true,
      confidence,
      Date.now() - startTime,
      citizenId,
      false
    );

    return response;
  }

  /**
   * Processa pergunta livre usando IA (Ollama)
   * Usado no fluxo "Outras Dúvidas"
   */
  private async handleAIQuestion(
    message: string,
    citizenId: string,
    conversationId: string
  ): Promise<BotResponse> {
    try {
      // Busca contexto da conversa
      const context = await this.contextManager.getContext(citizenId);

      // Busca serviços relevantes para dar contexto à IA
      const relevantServices = await this.knowledgeBase.searchServices(message, 5);

      // Formata contexto para a IA
      const contextText = relevantServices.length > 0
        ? `Serviços disponíveis: ${relevantServices.map(s => s.name).join(', ')}`
        : 'Sistema de serviços municipais';

      // Chama Ollama para responder - usa o método generate direto
      const response = await this.ollamaService.recognizeIntent(
        `Pergunta: ${message}\n\nContexto: ${contextText}\n\nResponda de forma clara e amigável em 2-3 parágrafos.`,
        context
      );

      const aiResponse = response.parameters?.answer || 'Desculpe, não consegui gerar uma resposta adequada.';

      return this.createResponse(
        aiResponse,
        'text',
        {
          quickReplies: [
            '📋 Solicitar Serviço',
            '❓ Outra pergunta',
            '🏠 Menu Principal'
          ]
        }
      );
    } catch (error) {
      console.error('Erro ao processar pergunta com IA:', error);

      return this.createResponse(
        'Desculpe, tive dificuldade em responder sua pergunta. Você pode reformular ou escolher uma opção do menu:',
        'quick_reply',
        {
          quickReplies: [
            '📋 Solicitar Serviço',
            '🔍 Consultar Protocolo',
            '🏠 Menu Principal'
          ]
        }
      );
    }
  }

  /**
   * Processa a intenção reconhecida (LEGADO - mantido para compatibilidade)
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
        return this.createResponse(
          'Desculpe, não encontrei o serviço de agendamento de consultas.',
          'text',
          { quickReplies: ['Ver serviços disponíveis'] }
        );

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
        // Não há mais atendentes humanos - redireciona para o menu
        return this.createResponse(
          'No momento, não temos atendentes disponíveis, mas posso te ajudar com várias coisas! Escolha uma opção:',
          'quick_reply',
          {
            quickReplies: [
              '📋 Solicitar Serviço',
              '🔍 Consultar Protocolo',
              '❓ Fazer uma pergunta',
              '🏠 Menu Principal'
            ]
          }
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
      const services = await prisma.serviceSimplified.findMany({
        orderBy: { id: 'asc' },
        take: 2,
        select: { name: true }
      });

      return this.createResponse(
        `${prefix || ''}Você ainda não possui nenhum protocolo.\n\nQue tal solicitar um serviço agora?`,
        'text',
        { quickReplies: services.map((s: any) => s.name) }
      );
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

    const otherServices = await prisma.serviceSimplified.findMany({
      orderBy: { id: 'asc' },
      take: 2,
      select: { name: true }
    });

    return this.createResponse(
      `${prefix || ''}Aqui estão seus últimos protocolos:`,
      'card',
      {
        cards,
        quickReplies: otherServices.map((s: any) => s.name)
      }
    );
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
      return this.createResponse(
        `${prefix || ''}Qual o número do protocolo que você quer consultar?`,
        'text'
      );
    }

    // Valida número do protocolo
    const validation = InputValidator.validateProtocolNumber(number);
    if (!validation.isValid) {
      return this.createResponse(
        validation.error || 'Número de protocolo inválido.',
        'text'
      );
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
      return this.createResponse(
        `${prefix || ''}Não encontrei nenhum protocolo com o número ${number}.\n\nDeseja ver todos os seus protocolos?`,
        'text',
        { quickReplies: ['Ver meus protocolos'] }
      );
    }

    return this.createResponse(
      `${prefix || ''}Aqui está o status do seu protocolo:`,
      'card',
      { cards: [
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
        quickReplies: ['Ver outros protocolos']
      }
    );
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

    return this.createResponse(
      `${prefix || ''}${greeting}, ${firstName}! 👋\n\nSou o DigiBot, seu assistente virtual. Como posso ajudar você hoje?`,
      'text',
      { quickReplies: quickReplies.length > 0 ? quickReplies : undefined }
    );
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

    return this.createResponse(
      `${prefix || ''}Até logo! Foi um prazer ajudar você. 😊\n\nSempre que precisar, é só me chamar!`,
      'text'
    );
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

    return this.createResponse(
      `${prefix || ''}Posso te ajudar com:\n\n• 📋 Solicitar serviços municipais\n• 📄 Enviar documentos\n• 🔍 Consultar protocolos\n• 💬 Falar com um atendente\n\nÉ só me dizer o que você precisa!`,
      'text',
      { quickReplies: quickReplies.length > 0 ? quickReplies : undefined }
    );
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

      return this.createResponse(
        `${prefix || ''}Encontrei estes serviços relacionados:`,
        'card',
        {
          cards,
          quickReplies: otherServices.length > 0 ? otherServices.map((s: any) => s.name) : undefined
        }
      );
    }

    // Busca serviços para quick replies
    const fallbackServices = await prisma.serviceSimplified.findMany({
      orderBy: { id: 'asc' },
      take: 3,
      select: { name: true }
    });

    return this.createResponse(
      `${prefix || ''}Desculpe, não tenho certeza de como ajudar com isso.\n\nVocê pode me dizer de outra forma ou escolher uma das opções:`,
      'text',
      {
        quickReplies: fallbackServices.map((s: any) => s.name)
      }
    );
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
        return this.createResponse(
          searchTerm
            ? `Não encontrei serviços relacionados a "${searchTerm}". Tente outro termo.`
            : 'Não encontrei serviços disponíveis.',
          'text',
          { quickReplies: ['Ver todos os serviços'] }
        );
      }

      // Se encontrou apenas 1 serviço, iniciar fluxo direto
      if (services.length === 1) {
        console.log(`🎯 Único serviço encontrado: ${services[0].id}, iniciando fluxo`);
        return this.flowManager.startDynamicServiceFlow(citizenId, services[0].id);
      }

      // Se encontrou múltiplos, oferecer cards
      return this.createResponse(
        searchTerm
          ? `Encontrei ${services.length} serviços relacionados a "${searchTerm}":`
          : `Aqui estão os serviços disponíveis:`,
        'card',
        {
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
          quickReplies: ['Buscar outro serviço']
        }
      );

    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      return this.createResponse(
        'Erro ao buscar serviços. Por favor, tente novamente.',
        'text',
        { quickReplies: ['Tentar novamente'] }
      );
    }
  }
}

export default BotServiceEnhanced;
