import { PrismaClient } from '@prisma/client';
import { BotResponse, MessageCardData } from './types';
import { FlowManager } from './FlowManager';
import { SemanticSearchService } from './SemanticSearchService';

const prisma = new PrismaClient();

/**
 * Tipos de fluxos conversacionais disponíveis
 */
export enum FlowType {
  MENU_PRINCIPAL = 'MENU_PRINCIPAL',
  SOLICITAR_SERVICO = 'SOLICITAR_SERVICO',
  CONSULTAR_PROTOCOLO = 'CONSULTAR_PROTOCOLO',
  ENVIAR_DOCUMENTOS = 'ENVIAR_DOCUMENTOS',
  ATUALIZAR_PERFIL = 'ATUALIZAR_PERFIL',
  OUTRAS_DUVIDAS = 'OUTRAS_DUVIDAS',
  SERVICO_DINAMICO = 'SERVICO_DINAMICO' // Fluxo de formulário dinâmico
}

/**
 * Gerenciador de fluxos conversacionais estruturados
 * Implementa navegação por menu com botões clicáveis e fluxos específicos
 */
export class ConversationFlowManager {
  private flowManager: FlowManager;
  private semanticSearch: SemanticSearchService;

  constructor() {
    this.flowManager = FlowManager.getInstance();
    this.semanticSearch = SemanticSearchService.getInstance();
  }

  /**
   * Mostra o menu principal com 5 opções
   */
  async showMainMenu(citizenId: string, firstName?: string): Promise<BotResponse> {
    const greeting = firstName
      ? `Olá, ${firstName}! 👋 Como posso ajudar você hoje?`
      : 'Olá! 👋 Como posso ajudar você hoje?';

    return {
      response: greeting,
      messageType: 'quick_reply',
      metadata: {
        quickReplies: [
          '📋 Solicitar Serviço',
          '🔍 Consultar Protocolo',
          '📄 Enviar Documentos',
          '👤 Atualizar Perfil',
          '❓ Outras Dúvidas'
        ]
      }
    };
  }

  /**
   * Processa uma mensagem dentro de um fluxo ativo
   */
  async processFlowMessage(
    conversation: any,
    message: string,
    citizenId: string
  ): Promise<BotResponse> {
    const flowType = conversation.currentFlow as FlowType;
    const flowStep = conversation.flowStep;
    const flowData = conversation.flowData || {};

    switch (flowType) {
      case FlowType.SOLICITAR_SERVICO:
        return this.processSolicitarServicoFlow(flowStep, message, flowData, citizenId, conversation.id);

      case FlowType.CONSULTAR_PROTOCOLO:
        return this.processConsultarProtocoloFlow(flowStep, message, flowData, citizenId, conversation.id);

      case FlowType.ENVIAR_DOCUMENTOS:
        return this.processEnviarDocumentosFlow(flowStep, message, flowData, citizenId, conversation.id);

      case FlowType.ATUALIZAR_PERFIL:
        return this.processAtualizarPerfilFlow(flowStep, message, flowData, citizenId, conversation.id);

      case FlowType.OUTRAS_DUVIDAS:
        return this.processOutrasDuvidasFlow(flowStep, message, flowData, citizenId, conversation.id);

      case FlowType.SERVICO_DINAMICO:
        // Delega para o FlowManager existente
        return this.flowManager.processFlowStep(citizenId, message);

      default:
        return this.showMainMenu(citizenId);
    }
  }

  /**
   * Inicia um novo fluxo baseado na seleção do usuário
   */
  async startFlow(
    citizenId: string,
    conversationId: string,
    flowType: FlowType
  ): Promise<BotResponse> {
    // Atualiza a conversa com o novo fluxo
    await prisma.botConversation.update({
      where: { id: conversationId },
      data: {
        currentFlow: flowType,
        flowStep: 0,
        flowData: {}
      }
    });

    // Inicia o fluxo apropriado
    switch (flowType) {
      case FlowType.SOLICITAR_SERVICO:
        return this.startSolicitarServicoFlow(citizenId, conversationId);

      case FlowType.CONSULTAR_PROTOCOLO:
        return this.startConsultarProtocoloFlow(citizenId, conversationId);

      case FlowType.ENVIAR_DOCUMENTOS:
        return this.startEnviarDocumentosFlow(citizenId, conversationId);

      case FlowType.ATUALIZAR_PERFIL:
        return this.startAtualizarPerfilFlow(citizenId, conversationId);

      case FlowType.OUTRAS_DUVIDAS:
        return this.startOutrasDuvidasFlow(citizenId, conversationId);

      default:
        return this.showMainMenu(citizenId);
    }
  }

  /**
   * Detecta qual fluxo iniciar baseado na mensagem do usuário
   */
  detectFlowFromMessage(message: string): FlowType | null {
    const normalized = message.toLowerCase().trim();

    // Menu principal
    if (normalized.includes('menu') || normalized.includes('voltar') || normalized.includes('início')) {
      return FlowType.MENU_PRINCIPAL;
    }

    // Solicitar serviço
    if (
      normalized.includes('solicitar') ||
      normalized.includes('serviço') ||
      normalized.includes('📋')
    ) {
      return FlowType.SOLICITAR_SERVICO;
    }

    // Consultar protocolo
    if (
      normalized.includes('protocolo') ||
      normalized.includes('consultar') ||
      normalized.includes('acompanhar') ||
      normalized.includes('🔍')
    ) {
      return FlowType.CONSULTAR_PROTOCOLO;
    }

    // Enviar documentos
    if (
      normalized.includes('enviar') ||
      normalized.includes('documento') ||
      normalized.includes('anexar') ||
      normalized.includes('📄')
    ) {
      return FlowType.ENVIAR_DOCUMENTOS;
    }

    // Atualizar perfil
    if (
      normalized.includes('perfil') ||
      normalized.includes('atualizar') ||
      normalized.includes('dados') ||
      normalized.includes('👤')
    ) {
      return FlowType.ATUALIZAR_PERFIL;
    }

    // Outras dúvidas
    if (
      normalized.includes('dúvida') ||
      normalized.includes('ajuda') ||
      normalized.includes('❓')
    ) {
      return FlowType.OUTRAS_DUVIDAS;
    }

    return null;
  }

  // ============================================
  // FLUXO 1: SOLICITAR SERVIÇO
  // ============================================

  private async startSolicitarServicoFlow(
    citizenId: string,
    conversationId: string
  ): Promise<BotResponse> {
    await prisma.botConversation.update({
      where: { id: conversationId },
      data: { flowStep: 0 }
    });

    return {
      response: '📋 **Solicitar Serviço**\n\nComo você prefere encontrar o serviço que precisa?',
      messageType: 'quick_reply',
      metadata: {
        quickReplies: [
          '🔍 Digitar o que preciso',
          '📂 Ver por categoria',
          '⭐ Ver serviços populares'
        ]
      }
    };
  }

  private async processSolicitarServicoFlow(
    flowStep: number,
    message: string,
    flowData: any,
    citizenId: string,
    conversationId: string
  ): Promise<BotResponse> {
    const normalized = message.toLowerCase().trim();

    // Step 0: Escolha do método de busca
    if (flowStep === 0) {
      if (normalized.includes('digitar')) {
        await this.updateFlowStep(conversationId, 1, { searchMethod: 'text' });
        return {
          response: '🔍 Digite o que você precisa (ex: "alvará", "certidão", "consulta médica"):',
          messageType: 'text',
          metadata: {}
        };
      } else if (normalized.includes('categoria')) {
        await this.updateFlowStep(conversationId, 1, { searchMethod: 'category' });

        const categories = await prisma.serviceSimplified.findMany({
          select: { category: true },
          distinct: ['category'],
          where: { category: { not: null } }
        });

        const categoryNames = categories
          .map(c => c.category)
          .filter(Boolean) as string[];

        return {
          response: '📂 Escolha uma categoria:',
          messageType: 'quick_reply',
          metadata: {
            quickReplies: categoryNames.length > 0
              ? categoryNames.slice(0, 6)
              : ['Saúde', 'Educação', 'Transporte', 'Documentos']
          }
        };
      } else if (normalized.includes('populares')) {
        await this.updateFlowStep(conversationId, 2, { searchMethod: 'popular' });

        const popularServices = await prisma.serviceSimplified.findMany({
          orderBy: { id: 'asc' },
          take: 5,
          select: {
            id: true,
            name: true,
            description: true,
            department: { select: { name: true } },
            estimatedDays: true
          }
        });

        const cards: MessageCardData[] = popularServices.map(service => ({
          id: service.id,
          title: service.name,
          description: service.description || undefined,
          department: service.department?.name || undefined,
          estimatedDays: service.estimatedDays || undefined,
          action: {
            type: 'open_service' as const,
            label: 'Solicitar este serviço',
            serviceId: service.id
          }
        }));

        return {
          response: '⭐ **Serviços mais populares:**',
          messageType: 'card',
          metadata: { cards }
        };
      }
    }

    // Step 1: Busca por texto ou categoria
    if (flowStep === 1) {
      const searchMethod = flowData.searchMethod;

      if (searchMethod === 'text') {
        // Busca semântica
        const results = await this.semanticSearch.searchRelevantServices(message, 5);

        if (results.length === 0) {
          return {
            response: '❌ Não encontrei serviços relacionados a sua busca.\n\nTente usar outras palavras ou escolha outra opção:',
            messageType: 'quick_reply',
            metadata: {
              quickReplies: ['📂 Ver por categoria', '⭐ Ver serviços populares', '🏠 Menu Principal']
            }
          };
        }

        await this.updateFlowStep(conversationId, 2, { ...flowData, searchResults: results });

        const cards: MessageCardData[] = results.map((result: any) => ({
          id: result.service.id,
          title: result.service.name,
          description: result.service.description || undefined,
          department: result.service.department?.name || undefined,
          estimatedDays: result.service.estimatedDays || undefined,
          action: {
            type: 'open_service' as const,
            label: 'Solicitar este serviço',
            serviceId: result.service.id
          }
        }));

        return {
          response: `🔍 Encontrei ${results.length} serviço(s) relacionado(s):`,
          messageType: 'card',
          metadata: { cards }
        };
      } else if (searchMethod === 'category') {
        // Busca por categoria
        const services = await prisma.serviceSimplified.findMany({
          where: {
            category: {
              contains: message,
              mode: 'insensitive'
            }
          },
          take: 5,
          include: {
            department: { select: { name: true } }
          }
        });

        if (services.length === 0) {
          return {
            response: '❌ Não encontrei serviços nessa categoria.\n\nEscolha outra opção:',
            messageType: 'quick_reply',
            metadata: {
              quickReplies: ['🔍 Digitar o que preciso', '⭐ Ver serviços populares', '🏠 Menu Principal']
            }
          };
        }

        await this.updateFlowStep(conversationId, 2, { ...flowData, categoryServices: services });

        const cards: MessageCardData[] = services.map(service => ({
          id: service.id,
          title: service.name,
          description: service.description || undefined,
          department: service.department?.name || undefined,
          estimatedDays: service.estimatedDays || undefined,
          action: {
            type: 'open_service' as const,
            label: 'Solicitar este serviço',
            serviceId: service.id
          }
        }));

        return {
          response: `📂 Serviços da categoria "${message}":`,
          messageType: 'card',
          metadata: { cards }
        };
      }
    }

    // Step 2: Seleção do serviço (detecta quando usuário clica em um card)
    if (flowStep === 2) {
      // Tenta encontrar o serviço mencionado
      const services = await prisma.serviceSimplified.findMany({
        where: {
          OR: [
            { name: { contains: message, mode: 'insensitive' } },
            { id: message } // Caso seja enviado o ID diretamente
          ]
        },
        take: 1
      });

      if (services.length > 0) {
        const service = services[0];

        // Transição para fluxo dinâmico do FlowManager
        await prisma.botConversation.update({
          where: { id: conversationId },
          data: {
            currentFlow: FlowType.SERVICO_DINAMICO,
            flowStep: 0,
            flowData: { serviceId: service.id }
          }
        });

        // Inicia o fluxo dinâmico
        return this.flowManager.startDynamicServiceFlow(citizenId, service.id);
      }

      return {
        response: '❌ Não identifiquei qual serviço você deseja.\n\nClique em um dos botões "Solicitar este serviço" ou escolha outra opção:',
        messageType: 'quick_reply',
        metadata: {
          quickReplies: ['🔍 Nova busca', '🏠 Menu Principal']
        }
      };
    }

    return this.showMainMenu(citizenId);
  }

  // ============================================
  // FLUXO 2: CONSULTAR PROTOCOLO
  // ============================================

  private async startConsultarProtocoloFlow(
    citizenId: string,
    conversationId: string
  ): Promise<BotResponse> {
    await prisma.botConversation.update({
      where: { id: conversationId },
      data: { flowStep: 0 }
    });

    // Buscar protocolos do cidadão
    const protocols = await prisma.protocolSimplified.findMany({
      where: { citizenId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        service: {
          select: {
            name: true,
            department: { select: { name: true } }
          }
        }
      }
    });

    if (protocols.length === 0) {
      return {
        response: '📋 Você ainda não possui protocolos registrados.\n\nQue tal solicitar um serviço?',
        messageType: 'quick_reply',
        metadata: {
          quickReplies: ['📋 Solicitar Serviço', '🏠 Menu Principal']
        }
      };
    }

    const cards: MessageCardData[] = protocols.map((protocol: any) => ({
      id: protocol.id,
      title: `Protocolo ${protocol.number}`,
      description: protocol.service?.name || 'Serviço não especificado',
      department: protocol.service?.department?.name || undefined,
      status: protocol.status,
      date: protocol.createdAt.toLocaleDateString('pt-BR'),
      action: {
        type: 'open_protocol' as const,
        label: 'Ver detalhes',
        protocolId: protocol.id
      }
    }));

    return {
      response: '🔍 **Seus Protocolos**\n\nClique em um protocolo para ver os detalhes:',
      messageType: 'card',
      metadata: { cards }
    };
  }

  private async processConsultarProtocoloFlow(
    flowStep: number,
    message: string,
    flowData: any,
    citizenId: string,
    conversationId: string
  ): Promise<BotResponse> {
    // Step 0: Lista mostrada, aguardando seleção
    if (flowStep === 0) {
      // Tenta encontrar o protocolo pelo número ou ID
      const protocol = await prisma.protocolSimplified.findFirst({
        where: {
          citizenId,
          OR: [
            { id: message },
            { number: { contains: message, mode: 'insensitive' } }
          ]
        },
        include: {
          service: { select: { name: true } }
        }
      });

      if (!protocol) {
        return {
          response: '❌ Protocolo não encontrado.\n\nEscolha uma opção:',
          messageType: 'quick_reply',
          metadata: {
            quickReplies: ['🔍 Listar meus protocolos', '🏠 Menu Principal']
          }
        };
      }

      // Mostra detalhes do protocolo
      await this.updateFlowStep(conversationId, 1, { protocolId: protocol.id });

      let detailsText = `📋 **Protocolo ${protocol.number}**\n\n`;
      detailsText += `**Serviço:** ${protocol.service?.name || 'N/A'}\n`;
      detailsText += `**Status:** ${this.translateStatus(protocol.status)}\n`;
      detailsText += `**Criado em:** ${protocol.createdAt.toLocaleDateString('pt-BR')}\n`;

      return {
        response: detailsText,
        messageType: 'quick_reply',
        metadata: {
          quickReplies: [
            '📄 Enviar documento para este protocolo',
            '🔍 Ver outro protocolo',
            '🏠 Menu Principal'
          ]
        }
      };
    }

    // Step 1: Ações após ver detalhes
    if (flowStep === 1) {
      const normalized = message.toLowerCase();

      if (normalized.includes('documento') || normalized.includes('enviar')) {
        // Transição para fluxo de enviar documentos
        await prisma.botConversation.update({
          where: { id: conversationId },
          data: {
            currentFlow: FlowType.ENVIAR_DOCUMENTOS,
            flowStep: 0,
            flowData: { protocolId: flowData.protocolId, fromProtocolFlow: true }
          }
        });

        return this.startEnviarDocumentosFlow(citizenId, conversationId);
      } else if (normalized.includes('outro') || normalized.includes('ver')) {
        return this.startConsultarProtocoloFlow(citizenId, conversationId);
      }
    }

    return this.showMainMenu(citizenId);
  }

  // ============================================
  // FLUXO 3: ENVIAR DOCUMENTOS
  // ============================================

  private async startEnviarDocumentosFlow(
    citizenId: string,
    conversationId: string
  ): Promise<BotResponse> {
    const conversation = await prisma.botConversation.findUnique({
      where: { id: conversationId }
    });

    const flowData = (conversation?.flowData as any) || {};

    // Se veio do fluxo de protocolo, já tem o contexto
    if (flowData.fromProtocolFlow && flowData.protocolId) {
      await this.updateFlowStep(conversationId, 1, flowData);

      return {
        response: '📄 **Enviar Documento**\n\nQual tipo de documento você deseja enviar?',
        messageType: 'quick_reply',
        metadata: {
          quickReplies: [
            'RG/CNH',
            'Comprovante de Residência',
            'Certidão',
            'Outro documento'
          ]
        }
      };
    }

    // Caso contrário, precisa escolher o contexto
    await this.updateFlowStep(conversationId, 0, {});

    return {
      response: '📄 **Enviar Documento**\n\nO documento é para um protocolo existente ou é um envio avulso?',
      messageType: 'quick_reply',
      metadata: {
        quickReplies: [
          '📋 Para um protocolo',
          '📤 Envio avulso',
          '🏠 Menu Principal'
        ]
      }
    };
  }

  private async processEnviarDocumentosFlow(
    flowStep: number,
    message: string,
    flowData: any,
    citizenId: string,
    conversationId: string
  ): Promise<BotResponse> {
    const normalized = message.toLowerCase();

    // Step 0: Escolher contexto (protocolo ou avulso)
    if (flowStep === 0) {
      if (normalized.includes('protocolo')) {
        // Lista protocolos
        const protocols = await prisma.protocolSimplified.findMany({
          where: { citizenId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { service: true }
        });

        if (protocols.length === 0) {
          return {
            response: '❌ Você não possui protocolos.\n\nDeseja fazer um envio avulso?',
            messageType: 'quick_reply',
            metadata: {
              quickReplies: ['📤 Sim, envio avulso', '🏠 Menu Principal']
            }
          };
        }

        await this.updateFlowStep(conversationId, 1, { documentContext: 'protocol' });

        const quickReplies = protocols.map((p: any) =>
          `${p.number} - ${p.service?.name || 'Serviço'}`
        ).slice(0, 5);

        return {
          response: '📋 Escolha o protocolo:',
          messageType: 'quick_reply',
          metadata: { quickReplies }
        };
      } else if (normalized.includes('avulso')) {
        await this.updateFlowStep(conversationId, 1, { documentContext: 'standalone' });

        return {
          response: '📤 **Envio Avulso**\n\nQual tipo de documento você deseja enviar?',
          messageType: 'quick_reply',
          metadata: {
            quickReplies: [
              'RG/CNH',
              'Comprovante de Residência',
              'Certidão',
              'Outro documento'
            ]
          }
        };
      }
    }

    // Step 1: Tipo de documento ou seleção de protocolo
    if (flowStep === 1) {
      if (flowData.documentContext === 'protocol' && !flowData.protocolId) {
        // Selecionar protocolo
        const protocol = await prisma.protocolSimplified.findFirst({
          where: {
            citizenId,
            number: { contains: message, mode: 'insensitive' }
          }
        });

        if (!protocol) {
          return {
            response: '❌ Protocolo não encontrado. Tente novamente ou escolha outra opção:',
            messageType: 'quick_reply',
            metadata: {
              quickReplies: ['📤 Envio avulso', '🏠 Menu Principal']
            }
          };
        }

        await this.updateFlowStep(conversationId, 1, {
          ...flowData,
          protocolId: protocol.id
        });

        return {
          response: '📄 Qual tipo de documento você deseja enviar?',
          messageType: 'quick_reply',
          metadata: {
            quickReplies: [
              'RG/CNH',
              'Comprovante de Residência',
              'Certidão',
              'Outro documento'
            ]
          }
        };
      }

      // Tipo de documento selecionado
      await this.updateFlowStep(conversationId, 2, {
        ...flowData,
        documentType: message
      });

      return {
        response: '📎 **Pronto para upload!**\n\nAgora use o botão de anexo (📎) abaixo para enviar o arquivo.\n\n_Formatos aceitos: PDF, JPG, PNG (até 5MB)_',
        messageType: 'text',
        metadata: {}
      };
    }

    // Step 2: Aguardando upload (será tratado pelo BotServiceEnhanced)
    if (flowStep === 2) {
      return {
        response: '⏳ Aguardando o envio do arquivo...\n\nUse o botão de anexo (📎) para enviar o documento.',
        messageType: 'quick_reply',
        metadata: {
          quickReplies: ['❌ Cancelar', '🏠 Menu Principal']
        }
      };
    }

    return this.showMainMenu(citizenId);
  }

  // ============================================
  // FLUXO 4: ATUALIZAR PERFIL
  // ============================================

  private async startAtualizarPerfilFlow(
    citizenId: string,
    conversationId: string
  ): Promise<BotResponse> {
    await this.updateFlowStep(conversationId, 0, {});

    return {
      response: '👤 **Atualizar Perfil**\n\nO que você deseja atualizar?',
      messageType: 'quick_reply',
      metadata: {
        quickReplies: [
          '📱 Telefone',
          '📧 E-mail',
          '📍 Endereço',
          '🔑 Senha',
          '🏠 Menu Principal'
        ]
      }
    };
  }

  private async processAtualizarPerfilFlow(
    flowStep: number,
    message: string,
    flowData: any,
    citizenId: string,
    conversationId: string
  ): Promise<BotResponse> {
    const normalized = message.toLowerCase();

    // Step 0: Escolher campo
    if (flowStep === 0) {
      let field = '';
      let prompt = '';

      if (normalized.includes('telefone')) {
        field = 'phone';
        prompt = '📱 Digite o novo telefone (apenas números):';
      } else if (normalized.includes('email') || normalized.includes('e-mail')) {
        field = 'email';
        prompt = '📧 Digite o novo e-mail:';
      } else if (normalized.includes('endereço')) {
        field = 'address';
        prompt = '📍 Digite o novo endereço completo:';
      } else if (normalized.includes('senha')) {
        field = 'password';
        prompt = '🔑 Digite a nova senha (mínimo 6 caracteres):';
      } else {
        return {
          response: '❌ Opção não reconhecida. Escolha uma das opções:',
          messageType: 'quick_reply',
          metadata: {
            quickReplies: ['📱 Telefone', '📧 E-mail', '📍 Endereço', '🔑 Senha']
          }
        };
      }

      await this.updateFlowStep(conversationId, 1, { field });

      return {
        response: prompt,
        messageType: 'text',
        metadata: {}
      };
    }

    // Step 1: Receber novo valor
    if (flowStep === 1) {
      const field = flowData.field;
      const value = message.trim();

      // Validações básicas
      if (field === 'phone' && !/^\d{10,11}$/.test(value.replace(/\D/g, ''))) {
        return {
          response: '❌ Telefone inválido. Digite apenas números (10 ou 11 dígitos):',
          messageType: 'text',
          metadata: {}
        };
      }

      if (field === 'email' && !value.includes('@')) {
        return {
          response: '❌ E-mail inválido. Digite um e-mail válido:',
          messageType: 'text',
          metadata: {}
        };
      }

      if (field === 'password' && value.length < 6) {
        return {
          response: '❌ Senha muito curta. Digite no mínimo 6 caracteres:',
          messageType: 'text',
          metadata: {}
        };
      }

      await this.updateFlowStep(conversationId, 2, { ...flowData, newValue: value });

      const fieldNames: Record<string, string> = {
        phone: 'Telefone',
        email: 'E-mail',
        address: 'Endereço',
        password: 'Senha'
      };

      const displayValue = field === 'password' ? '••••••' : value;

      return {
        response: `**Confirmar alteração**\n\n${fieldNames[field]}: ${displayValue}\n\nDeseja confirmar esta alteração?`,
        messageType: 'quick_reply',
        metadata: {
          quickReplies: ['✅ Sim, confirmar', '❌ Cancelar']
        }
      };
    }

    // Step 2: Confirmação
    if (flowStep === 2) {
      if (normalized.includes('sim') || normalized.includes('confirmar')) {
        const field = flowData.field;
        const newValue = flowData.newValue;

        try {
          // Atualiza no banco
          const updateData: any = {};

          if (field === 'phone') updateData.phone = newValue;
          else if (field === 'email') updateData.email = newValue;
          else if (field === 'address') updateData.address = newValue;
          // Nota: senha requer hash, não implementado aqui por segurança

          if (field !== 'password') {
            await prisma.citizen.update({
              where: { id: citizenId },
              data: updateData
            });
          }

          // Finaliza fluxo
          await prisma.botConversation.update({
            where: { id: conversationId },
            data: {
              currentFlow: null,
              flowStep: 0,
              flowData: {}
            }
          });

          return {
            response: '✅ **Perfil atualizado com sucesso!**\n\nO que você deseja fazer agora?',
            messageType: 'quick_reply',
            metadata: {
              quickReplies: [
                '👤 Atualizar outro campo',
                '🏠 Menu Principal'
              ]
            }
          };
        } catch (error) {
          return {
            response: '❌ Erro ao atualizar perfil. Tente novamente mais tarde.',
            messageType: 'quick_reply',
            metadata: {
              quickReplies: ['🏠 Menu Principal']
            }
          };
        }
      } else {
        // Cancela
        await prisma.botConversation.update({
          where: { id: conversationId },
          data: {
            currentFlow: null,
            flowStep: 0,
            flowData: {}
          }
        });

        return {
          response: '❌ Alteração cancelada.',
          messageType: 'quick_reply',
          metadata: {
            quickReplies: ['👤 Atualizar Perfil', '🏠 Menu Principal']
          }
        };
      }
    }

    return this.showMainMenu(citizenId);
  }

  // ============================================
  // FLUXO 5: OUTRAS DÚVIDAS (IA Livre)
  // ============================================

  private async startOutrasDuvidasFlow(
    citizenId: string,
    conversationId: string
  ): Promise<BotResponse> {
    await this.updateFlowStep(conversationId, 0, {});

    return {
      response: '❓ **Outras Dúvidas**\n\nEstou aqui para ajudar! Faça sua pergunta sobre:\n\n• Serviços disponíveis\n• Como funciona o sistema\n• Prazos e documentos\n• Qualquer outra dúvida\n\nDigite sua pergunta:',
      messageType: 'text',
      metadata: {}
    };
  }

  private async processOutrasDuvidasFlow(
    flowStep: number,
    message: string,
    flowData: any,
    citizenId: string,
    conversationId: string
  ): Promise<BotResponse> {
    // Este fluxo será processado pela IA (OllamaService)
    // Retorna null para sinalizar que deve usar processamento de IA
    return {
      response: '', // Será preenchido pela IA
      messageType: 'text',
      metadata: {
        useAI: true, // Flag para indicar que deve usar IA
        question: message
      }
    };
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  private async updateFlowStep(
    conversationId: string,
    step: number,
    flowData: any
  ): Promise<void> {
    await prisma.botConversation.update({
      where: { id: conversationId },
      data: {
        flowStep: step,
        flowData: flowData
      }
    });
  }

  private translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'PENDING': '⏳ Pendente',
      'IN_PROGRESS': '🔄 Em andamento',
      'APPROVED': '✅ Aprovado',
      'REJECTED': '❌ Rejeitado',
      'COMPLETED': '✅ Concluído',
      'CANCELLED': '❌ Cancelado'
    };
    return statusMap[status] || status;
  }

  /**
   * Finaliza o fluxo atual e retorna ao menu
   */
  async endFlow(conversationId: string): Promise<void> {
    await prisma.botConversation.update({
      where: { id: conversationId },
      data: {
        currentFlow: null,
        flowStep: 0,
        flowData: {}
      }
    });
  }
}
