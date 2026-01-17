import { IntentRecognitionService } from './IntentRecognitionService';
import { ServiceKnowledgeBase } from './ServiceKnowledgeBase';
import { ContextManager } from './ContextManager';
import { RecommendationEngine } from './RecommendationEngine';
import { prisma } from '../../lib/prisma';

export interface BotMessage {
  id: string;
  content: string;
  senderId: string;
  senderType: 'CITIZEN' | 'BOT';
  createdAt: Date;
  messageType: 'text' | 'card' | 'form' | 'quick_reply';
  metadata?: any;
}

export interface BotResponse {
  response: string;
  messageType: 'text' | 'card' | 'form' | 'quick_reply';
  metadata?: any;
  quickReplies?: string[];
  cards?: any[];
  form?: any;
}

export class BotService {
  private intentRecognition: IntentRecognitionService;
  private knowledgeBase: ServiceKnowledgeBase;
  private contextManager: ContextManager;
  private recommendationEngine: RecommendationEngine;

  constructor() {
    this.intentRecognition = new IntentRecognitionService();
    this.knowledgeBase = new ServiceKnowledgeBase();
    this.contextManager = new ContextManager();
    this.recommendationEngine = new RecommendationEngine();
  }

  /**
   * Processa uma mensagem do cidadão e retorna a resposta do bot
   */
  async processMessage(citizenId: string, message: string): Promise<BotResponse> {
    try {
      // 1. Obter contexto da conversa
      const context = await this.contextManager.getContext(citizenId);

      // 2. Reconhecer intenção
      const intent = await this.intentRecognition.recognizeIntent(message, context);

      console.log(`🤖 Intent reconhecido: ${intent.name} (confiança: ${intent.confidence})`);

      // 3. Atualizar contexto
      await this.contextManager.updateContext(citizenId, {
        lastIntent: intent.name,
        lastMessage: message,
        timestamp: new Date()
      });

      // 4. Processar intent e gerar resposta
      const response = await this.handleIntent(citizenId, intent, message, context);

      // 5. Salvar no histórico
      await this.saveToHistory(citizenId, message, response);

      return response;
    } catch (error) {
      console.error('Erro ao processar mensagem do bot:', error);
      return {
        response: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        messageType: 'text'
      };
    }
  }

  /**
   * Processa a intenção reconhecida e gera resposta apropriada
   */
  private async handleIntent(
    citizenId: string,
    intent: any,
    message: string,
    context: any
  ): Promise<BotResponse> {
    switch (intent.name) {
      case 'AGENDAR_CONSULTA':
        return await this.handleAgendarConsulta(citizenId, intent);

      case 'VER_PROTOCOLOS':
        return await this.handleVerProtocolos(citizenId);

      case 'ENVIAR_DOCUMENTO':
        return await this.handleEnviarDocumento(citizenId);

      case 'SOLICITAR_SERVICO':
        return await this.handleSolicitarServico(citizenId, intent);

      case 'STATUS_PROTOCOLO':
        return await this.handleStatusProtocolo(citizenId, intent);

      case 'EDITAR_PERFIL':
        return await this.handleEditarPerfil(citizenId);

      case 'CHAT_HUMANO':
        return await this.handleChatHumano(citizenId);

      case 'PESQUISAR_SERVICO':
        return await this.handlePesquisarServico(intent);

      case 'VER_DOCUMENTOS':
        return await this.handleVerDocumentos(citizenId);

      case 'CANCELAR_PROTOCOLO':
        return await this.handleCancelarProtocolo(citizenId, intent);

      case 'SAUDACAO':
        return await this.handleSaudacao(citizenId);

      case 'AJUDA':
        return await this.handleAjuda();

      case 'DESPEDIDA':
        return await this.handleDespedida();

      default:
        return await this.handleUnknownIntent(citizenId, message);
    }
  }

  /**
   * INTENT: Agendar Consulta
   */
  private async handleAgendarConsulta(citizenId: string, intent: any): Promise<BotResponse> {
    // Buscar serviços de agendamento disponíveis
    const agendamentoServices = await this.knowledgeBase.searchServices('agendamento consulta');

    if (agendamentoServices.length === 0) {
      return {
        response: 'No momento não temos serviços de agendamento de consulta disponíveis. Gostaria de ver outros serviços?',
        messageType: 'text',
        quickReplies: ['Ver todos os serviços', 'Falar com atendente']
      };
    }

    // Retornar card com opções de agendamento
    return {
      response: 'Encontrei os seguintes serviços de agendamento disponíveis:',
      messageType: 'card',
      cards: agendamentoServices.map(service => ({
        id: service.id,
        title: service.name,
        description: service.description,
        department: service.department?.name,
        estimatedDays: service.estimatedDays,
        action: {
          type: 'open_service',
          serviceId: service.id,
          label: 'Solicitar'
        }
      })),
      quickReplies: ['Ver outros serviços', 'Falar com atendente']
    };
  }

  /**
   * INTENT: Ver Protocolos
   */
  private async handleVerProtocolos(citizenId: string): Promise<BotResponse> {
    try {
      // Buscar protocolos do cidadão
      const protocols = await prisma.protocolSimplified.findMany({
        where: { citizenId },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      if (protocols.length === 0) {
        return {
          response: 'Você ainda não possui nenhum protocolo. Gostaria de solicitar um serviço?',
          messageType: 'text',
          quickReplies: ['Ver serviços disponíveis', 'Falar com atendente']
        };
      }

      // Formatar protocolos como cards
      const protocolCards = protocols.map((protocol: any) => ({
        id: protocol.id,
        title: `Protocolo #${protocol.number}`,
        description: protocol.description || 'Protocolo',
        status: protocol.status,
        department: 'Prefeitura',
        date: protocol.createdAt.toLocaleDateString('pt-BR'),
        action: {
          type: 'open_protocol',
          protocolId: protocol.id,
          label: 'Ver detalhes'
        }
      }));

      return {
        response: `Você possui ${protocols.length} protocolo(s) recente(s):`,
        messageType: 'card',
        cards: protocolCards,
        quickReplies: ['Novo serviço', 'Ver todos os protocolos']
      };
    } catch (error) {
      console.error('Erro ao buscar protocolos:', error);
      return {
        response: 'Desculpe, não consegui buscar seus protocolos. Tente novamente mais tarde.',
        messageType: 'text'
      };
    }
  }

  /**
   * INTENT: Enviar Documento
   */
  private async handleEnviarDocumento(citizenId: string): Promise<BotResponse> {
    return {
      response: 'Para enviar um documento, você pode:\n\n1️⃣ Clicar no ícone de anexo (📎) abaixo\n2️⃣ Acessar a página de Documentos pelo menu\n3️⃣ Anexar em um protocolo específico\n\nQual você prefere?',
      messageType: 'text',
      quickReplies: ['Ir para Documentos', 'Ver meus protocolos', 'Ajuda']
    };
  }

  /**
   * INTENT: Solicitar Serviço
   */
  private async handleSolicitarServico(citizenId: string, intent: any): Promise<BotResponse> {
    const searchTerm = intent.entities?.serviceName || '';

    // Buscar serviços relacionados
    const services = await this.knowledgeBase.searchServices(searchTerm);

    if (services.length === 0) {
      return {
        response: `Não encontrei serviços para "${searchTerm}". Veja todos os serviços disponíveis:`,
        messageType: 'text',
        quickReplies: ['Ver todos os serviços', 'Falar com atendente']
      };
    }

    return {
      response: `Encontrei ${services.length} serviço(s) relacionado(s):`,
      messageType: 'card',
      cards: services.slice(0, 5).map(service => ({
        id: service.id,
        title: service.name,
        description: service.description,
        department: service.department?.name,
        estimatedDays: service.estimatedDays,
        action: {
          type: 'open_service',
          serviceId: service.id,
          label: 'Solicitar'
        }
      })),
      quickReplies: services.length > 5 ? ['Ver mais serviços'] : ['Ver outros serviços']
    };
  }

  /**
   * INTENT: Status do Protocolo
   */
  private async handleStatusProtocolo(citizenId: string, intent: any): Promise<BotResponse> {
    const number = intent.entities?.number;

    if (!number) {
      return {
        response: 'Por favor, me informe o número do protocolo que você quer consultar.\n\nExemplo: "Status do protocolo 2024-001"',
        messageType: 'text',
        quickReplies: ['Ver todos os protocolos']
      };
    }

    try {
      const protocol = await prisma.protocolSimplified.findFirst({
        where: {
          citizenId,
          number: {
            contains: number,
            mode: 'insensitive'
          }
        }
      });

      if (!protocol) {
        return {
          response: `Não encontrei o protocolo "${number}". Verifique se o número está correto ou veja todos os seus protocolos:`,
          messageType: 'text',
          quickReplies: ['Ver meus protocolos', 'Novo serviço']
        };
      }

      const statusMap: Record<string, string> = {
        'PENDING': '🟡 Pendente',
        'IN_ANALYSIS': '🔵 Em Análise',
        'APPROVED': '🟢 Aprovado',
        'REJECTED': '🔴 Rejeitado',
        'COMPLETED': '✅ Concluído',
        'CANCELLED': '⚫ Cancelado'
      };

      const statusEmoji = statusMap[protocol.status] || protocol.status;

      return {
        response: `📋 **Protocolo #${protocol.number}**\n\n` +
                  `**Descrição:** ${protocol.description || 'Protocolo'}\n` +
                  `**Status:** ${statusEmoji}\n` +
                  `**Data:** ${protocol.createdAt.toLocaleDateString('pt-BR')}\n\n` +
                  `Gostaria de ver mais detalhes?`,
        messageType: 'text',
        quickReplies: ['Ver detalhes completos', 'Ver outros protocolos']
      };
    } catch (error) {
      console.error('Erro ao buscar status do protocolo:', error);
      return {
        response: 'Desculpe, não consegui consultar o status do protocolo. Tente novamente.',
        messageType: 'text'
      };
    }
  }

  /**
   * INTENT: Editar Perfil
   */
  private async handleEditarPerfil(citizenId: string): Promise<BotResponse> {
    try {
      const citizen = await prisma.citizen.findUnique({
        where: { id: citizenId },
        select: {
          name: true,
          email: true,
          phone: true,
          cpf: true
        }
      });

      if (!citizen) {
        return {
          response: 'Não encontrei suas informações. Por favor, entre em contato com o suporte.',
          messageType: 'text'
        };
      }

      return {
        response: `📋 **Seus Dados Atuais:**\n\n` +
                  `**Nome:** ${citizen.name}\n` +
                  `**CPF:** ${citizen.cpf}\n` +
                  `**E-mail:** ${citizen.email}\n` +
                  `**Telefone:** ${citizen.phone || 'Não informado'}\n\n` +
                  `O que você gostaria de alterar?`,
        messageType: 'text',
        quickReplies: ['Ir para Perfil', 'Alterar telefone', 'Alterar e-mail', 'Voltar']
      };
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return {
        response: 'Desculpe, não consegui carregar seu perfil. Tente novamente.',
        messageType: 'text'
      };
    }
  }

  /**
   * INTENT: Falar com Atendente Humano
   */
  private async handleChatHumano(citizenId: string): Promise<BotResponse> {
    // Aqui você implementaria a lógica para transferir para atendente humano
    return {
      response: '👤 Entendi! Vou transferir você para um atendente humano.\n\n' +
                'Por favor, aguarde um momento enquanto conecto você com nossa equipe de atendimento.\n\n' +
                '⏱️ Tempo médio de espera: 2-5 minutos',
      messageType: 'text',
      metadata: {
        action: 'transfer_to_human',
        priority: 'normal'
      }
    };
  }

  /**
   * INTENT: Pesquisar Serviço
   */
  private async handlePesquisarServico(intent: any): Promise<BotResponse> {
    const searchTerm = intent.entities?.searchTerm || '';

    const services = await this.knowledgeBase.searchServices(searchTerm);

    if (services.length === 0) {
      return {
        response: 'Não encontrei serviços relacionados. Veja todos os serviços disponíveis:',
        messageType: 'text',
        quickReplies: ['Ver todos os serviços', 'Ajuda']
      };
    }

    // Agrupar por departamento
    const servicesByDept = services.reduce((acc: any, service) => {
      const deptName = service.department?.name || 'Outros';
      if (!acc[deptName]) acc[deptName] = [];
      acc[deptName].push(service);
      return acc;
    }, {});

    let response = `Encontrei ${services.length} serviço(s):\n\n`;

    Object.entries(servicesByDept).forEach(([dept, servs]: [string, any]) => {
      response += `**${dept}:**\n`;
      servs.slice(0, 3).forEach((s: any) => {
        response += `• ${s.name}\n`;
      });
      response += '\n';
    });

    return {
      response,
      messageType: 'text',
      quickReplies: ['Ver detalhes', 'Solicitar serviço']
    };
  }

  /**
   * INTENT: Ver Documentos
   */
  private async handleVerDocumentos(citizenId: string): Promise<BotResponse> {
    try {
      const documents = await prisma.citizenDocument.findMany({
        where: { citizenId },
        orderBy: { uploadedAt: 'desc' },
        take: 5
      });

      if (documents.length === 0) {
        return {
          response: 'Você ainda não possui documentos cadastrados. Gostaria de enviar um?',
          messageType: 'text',
          quickReplies: ['Ir para Documentos', 'Voltar']
        };
      }

      return {
        response: `Você possui ${documents.length} documento(s) cadastrado(s). Para ver detalhes, acesse a página de Documentos.`,
        messageType: 'text',
        quickReplies: ['Ir para Documentos', 'Enviar novo documento']
      };
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      return {
        response: 'Desculpe, não consegui buscar seus documentos. Tente novamente.',
        messageType: 'text'
      };
    }
  }

  /**
   * INTENT: Cancelar Protocolo
   */
  private async handleCancelarProtocolo(citizenId: string, intent: any): Promise<BotResponse> {
    const number = intent.entities?.number;

    if (!number) {
      return {
        response: 'Por favor, me informe qual protocolo você deseja cancelar.\n\nExemplo: "Cancelar protocolo 2024-001"',
        messageType: 'text',
        quickReplies: ['Ver meus protocolos']
      };
    }

    return {
      response: `⚠️ **Atenção!**\n\nVocê deseja realmente cancelar o protocolo #${number}?\n\n` +
                `Esta ação não pode ser desfeita. Para confirmar o cancelamento, acesse a página de Protocolos.`,
      messageType: 'text',
      quickReplies: ['Ir para Protocolos', 'Não cancelar']
    };
  }

  /**
   * INTENT: Saudação
   */
  private async handleSaudacao(citizenId: string): Promise<BotResponse> {
    try {
      const citizen = await prisma.citizen.findUnique({
        where: { id: citizenId },
        select: { name: true }
      });

      const firstName = citizen?.name?.split(' ')[0] || 'amigo(a)';

      const greetings = [
        `Olá, ${firstName}! 😊 Como posso ajudar você hoje?`,
        `Oi, ${firstName}! Tudo bem? Em que posso ser útil?`,
        `Olá! Seja bem-vindo(a), ${firstName}! Como posso te ajudar?`
      ];

      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

      return {
        response: randomGreeting,
        messageType: 'text',
        quickReplies: [
          'Ver serviços disponíveis',
          'Meus protocolos',
          'Falar com atendente'
        ]
      };
    } catch (error) {
      return {
        response: 'Olá! Como posso ajudar você hoje?',
        messageType: 'text',
        quickReplies: ['Ver serviços', 'Meus protocolos']
      };
    }
  }

  /**
   * INTENT: Ajuda
   */
  private async handleAjuda(): Promise<BotResponse> {
    return {
      response: '🤖 **Como posso te ajudar:**\n\n' +
                '📋 **Serviços:**\n' +
                '• "Quero agendar uma consulta"\n' +
                '• "Ver serviços disponíveis"\n' +
                '• "Solicitar cartão SUS"\n\n' +
                '📄 **Protocolos:**\n' +
                '• "Meus protocolos"\n' +
                '• "Status do protocolo 2024-001"\n' +
                '• "Cancelar protocolo"\n\n' +
                '📁 **Documentos:**\n' +
                '• "Enviar documento"\n' +
                '• "Ver meus documentos"\n\n' +
                '👤 **Perfil:**\n' +
                '• "Editar meu perfil"\n' +
                '• "Atualizar telefone"\n\n' +
                '💬 **Atendimento:**\n' +
                '• "Falar com atendente"\n' +
                '• "Preciso de ajuda"\n\n' +
                'Digite sua dúvida ou escolha uma opção abaixo:',
      messageType: 'text',
      quickReplies: [
        'Ver serviços',
        'Meus protocolos',
        'Falar com atendente'
      ]
    };
  }

  /**
   * INTENT: Despedida
   */
  private async handleDespedida(): Promise<BotResponse> {
    const farewells = [
      'Até logo! Se precisar de algo, estarei aqui! 👋',
      'Tchau! Foi um prazer ajudar você! 😊',
      'Até mais! Volte sempre que precisar! 🤝'
    ];

    return {
      response: farewells[Math.floor(Math.random() * farewells.length)],
      messageType: 'text'
    };
  }

  /**
   * INTENT: Desconhecido/Não reconhecido
   */
  private async handleUnknownIntent(citizenId: string, message: string): Promise<BotResponse> {
    // Tentar recomendar serviços baseado na mensagem
    const recommendations = await this.recommendationEngine.getRecommendations(citizenId, message);

    if (recommendations.length > 0) {
      return {
        response: 'Não entendi muito bem, mas talvez estes serviços possam te ajudar:',
        messageType: 'card',
        cards: recommendations.map(service => ({
          id: service.id,
          title: service.name,
          description: service.description,
          department: service.department?.name,
          action: {
            type: 'open_service',
            serviceId: service.id,
            label: 'Ver mais'
          }
        })),
        quickReplies: ['Ver todos os serviços', 'Falar com atendente', 'Ajuda']
      };
    }

    return {
      response: 'Desculpe, não entendi sua mensagem. Pode reformular ou escolher uma opção:',
      messageType: 'text',
      quickReplies: [
        'Ver serviços disponíveis',
        'Meus protocolos',
        'Falar com atendente',
        'Ajuda'
      ]
    };
  }

  /**
   * Salvar mensagem e resposta no histórico
   */
  private async saveToHistory(
    citizenId: string,
    userMessage: string,
    botResponse: BotResponse
  ): Promise<void> {
    try {
      // Aqui você pode implementar salvamento em banco de dados
      // Por enquanto, vamos só logar
      console.log(`💾 Salvando no histórico: ${citizenId}`);
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  }

  /**
   * Obter histórico de conversas do cidadão com o bot
   */
  async getHistory(citizenId: string, limit: number = 50): Promise<BotMessage[]> {
    try {
      // Implementar busca do histórico no banco
      // Por enquanto retorna array vazio
      return [];
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }
  }
}

export default new BotService();
