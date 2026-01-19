/**
 * ConversationFlowManager - Versão Integrada com UltraZend Messages
 *
 * Gerencia os fluxos conversacionais do DigiBot de forma completamente integrada
 * com os serviços reais do portal (protocolos, serviços, documentos, perfil).
 *
 * MUDANÇAS PRINCIPAIS:
 * - Usa tabela Conversation do UltraZend (campos: isBotConversation, botFlowType, botFlowStep, botFlowData)
 * - Integra com BotIntegrationService para operações reais (criar protocolos, buscar serviços, etc)
 * - Usa UltraZendMessagesAdapter para envio de mensagens
 * - Remove TODA a duplicação e código legado
 */

import { PrismaClient, Conversation } from '@prisma/client';
import { BotResponse, MessageCardData } from './types';
import { BotIntegrationService } from './BotIntegrationService';
import { UltraZendMessagesAdapter } from './UltraZendMessagesAdapter';
import { SemanticSearchService } from './SemanticSearchService';
import { OllamaService } from './OllamaService';

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
  OUTRAS_DUVIDAS = 'OUTRAS_DUVIDAS'
}

/**
 * Gerenciador de fluxos conversacionais estruturados
 */
export class ConversationFlowManager {
  private integrationService: BotIntegrationService;
  private adapter: UltraZendMessagesAdapter;
  private semanticSearch: SemanticSearchService;
  private ollama: OllamaService;

  constructor() {
    this.integrationService = BotIntegrationService.getInstance();
    this.adapter = UltraZendMessagesAdapter.getInstance();
    this.semanticSearch = SemanticSearchService.getInstance();
    this.ollama = OllamaService.getInstance();
  }

  /**
   * Mostra o menu principal
   */
  async showMainMenu(citizenId: string, conversationId: string): Promise<BotResponse> {
    // Busca nome do cidadão
    const citizen = await this.integrationService.getCitizen(citizenId);
    const firstName = citizen?.name.split(' ')[0];

    const greeting = firstName
      ? `Olá, ${firstName}! 👋 Como posso ajudar você hoje?`
      : 'Olá! 👋 Como posso ajudar você hoje?';

    // Reseta o fluxo
    await this.adapter.updateBotFlow(conversationId, null, 0, {});

    return {
      response: greeting,
      messageType: 'interactive',
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
   * Processa mensagem dentro de um fluxo ativo
   */
  async processFlowMessage(
    conversation: Conversation,
    message: string,
    citizenId: string
  ): Promise<BotResponse> {
    const flowType = conversation.botFlowType as FlowType | null;
    const flowStep = conversation.botFlowStep;
    const flowData = (conversation.botFlowData as any) || {};

    if (!flowType) {
      return this.showMainMenu(citizenId, conversation.id);
    }

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

      default:
        return this.showMainMenu(citizenId, conversation.id);
    }
  }

  /**
   * Inicia um novo fluxo
   */
  async startFlow(
    citizenId: string,
    conversationId: string,
    flowType: FlowType
  ): Promise<BotResponse> {
    // Atualiza a conversa com o novo fluxo
    await this.adapter.updateBotFlow(conversationId, flowType, 0, {});

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
        return this.showMainMenu(citizenId, conversationId);
    }
  }

  /**
   * Detecta qual fluxo iniciar baseado na mensagem
   */
  detectFlowFromMessage(message: string): FlowType | null {
    const normalized = message.toLowerCase().trim();

    // Menu principal
    if (normalized.includes('menu') || normalized.includes('voltar') || normalized.includes('início') || normalized.includes('inicio')) {
      return FlowType.MENU_PRINCIPAL;
    }

    // Solicitar serviço
    if (normalized.includes('solicitar') || normalized.includes('serviço') || normalized.includes('servico') || normalized.includes('📋')) {
      return FlowType.SOLICITAR_SERVICO;
    }

    // Consultar protocolo
    if (normalized.includes('protocolo') || normalized.includes('consultar') || normalized.includes('acompanhar') || normalized.includes('🔍')) {
      return FlowType.CONSULTAR_PROTOCOLO;
    }

    // Enviar documentos
    if (normalized.includes('enviar') || normalized.includes('documento') || normalized.includes('anexar') || normalized.includes('📄')) {
      return FlowType.ENVIAR_DOCUMENTOS;
    }

    // Atualizar perfil
    if (normalized.includes('perfil') || normalized.includes('atualizar') || normalized.includes('dados') || normalized.includes('👤')) {
      return FlowType.ATUALIZAR_PERFIL;
    }

    // Outras dúvidas
    if (normalized.includes('dúvida') || normalized.includes('duvida') || normalized.includes('ajuda') || normalized.includes('outras') || normalized.includes('❓')) {
      return FlowType.OUTRAS_DUVIDAS;
    }

    return null;
  }

  // ============================================
  // FLUXO 1: SOLICITAR SERVIÇO (100% INTEGRADO)
  // ============================================

  private async startSolicitarServicoFlow(citizenId: string, conversationId: string): Promise<BotResponse> {
    await this.adapter.updateBotFlow(conversationId, FlowType.SOLICITAR_SERVICO, 0, {});

    return {
      response: '📋 **Solicitar Serviço**\n\nComo você prefere encontrar o serviço que precisa?',
      messageType: 'interactive',
      metadata: {
        quickReplies: [
          '🔍 Buscar por nome',
          '📂 Ver categorias',
          '⭐ Serviços populares'
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
      if (normalized.includes('buscar') || normalized.includes('nome')) {
        await this.adapter.updateBotFlow(conversationId, FlowType.SOLICITAR_SERVICO, 1, { searchMethod: 'text' });
        return {
          response: '🔍 Digite o nome ou palavra-chave do serviço que você precisa:',
          messageType: 'text',
          metadata: {}
        };
      } else if (normalized.includes('categoria')) {
        const departments = await this.integrationService.getDepartments();
        await this.adapter.updateBotFlow(conversationId, FlowType.SOLICITAR_SERVICO, 1, { searchMethod: 'category' });

        return {
          response: '📂 Escolha um departamento:',
          messageType: 'interactive',
          metadata: {
            quickReplies: departments.slice(0, 6).map(d => d.name)
          }
        };
      } else if (normalized.includes('populares')) {
        const services = await this.integrationService.getAvailableServices();
        await this.adapter.updateBotFlow(conversationId, FlowType.SOLICITAR_SERVICO, 2, {
          searchMethod: 'popular',
          services: services.slice(0, 5)
        });

        const cards: MessageCardData[] = services.slice(0, 5).map(service => ({
          id: service.id,
          title: service.name,
          description: service.description || undefined,
          department: service.department?.name,
          estimatedDays: service.estimatedDays || undefined,
          action: {
            type: 'select_service',
            label: 'Solicitar',
            serviceId: service.id
          }
        }));

        return {
          response: '⭐ **Serviços mais solicitados:**',
          messageType: 'card',
          metadata: { cards }
        };
      }
    }

    // Step 1: Busca por texto ou categoria
    if (flowStep === 1) {
      const searchMethod = flowData.searchMethod;

      if (searchMethod === 'text') {
        // 🔥 BUSCA REAL DE SERVIÇOS
        const services = await this.integrationService.getAvailableServices(undefined, undefined, message);

        if (services.length === 0) {
          return {
            response: '❌ Não encontrei serviços com esse termo.\n\nTente outras palavras ou escolha outra opção:',
            messageType: 'interactive',
            metadata: {
              quickReplies: ['📂 Ver categorias', '⭐ Serviços populares', '🏠 Menu']
            }
          };
        }

        await this.adapter.updateBotFlow(conversationId, FlowType.SOLICITAR_SERVICO, 2, {
          ...flowData,
          services: services.slice(0, 5)
        });

        const cards: MessageCardData[] = services.slice(0, 5).map(service => ({
          id: service.id,
          title: service.name,
          description: service.description || undefined,
          department: service.department?.name,
          estimatedDays: service.estimatedDays || undefined,
          action: {
            type: 'select_service',
            label: 'Solicitar',
            serviceId: service.id
          }
        }));

        return {
          response: `🔍 Encontrei ${services.length} serviço(s):`,
          messageType: 'card',
          metadata: { cards }
        };
      } else if (searchMethod === 'category') {
        // 🔥 BUSCA POR DEPARTAMENTO REAL
        const departments = await this.integrationService.getDepartments();
        const department = departments.find(d =>
          d.name.toLowerCase().includes(normalized)
        );

        if (!department) {
          return {
            response: '❌ Departamento não encontrado. Escolha uma opção:',
            messageType: 'interactive',
            metadata: {
              quickReplies: departments.slice(0, 6).map(d => d.name)
            }
          };
        }

        const services = await this.integrationService.getAvailableServices(department.id);

        if (services.length === 0) {
          return {
            response: '❌ Nenhum serviço disponível neste departamento.',
            messageType: 'interactive',
            metadata: {
              quickReplies: ['🔍 Buscar por nome', '🏠 Menu']
            }
          };
        }

        await this.adapter.updateBotFlow(conversationId, FlowType.SOLICITAR_SERVICO, 2, {
          ...flowData,
          services: services.slice(0, 5),
          departmentId: department.id
        });

        const cards: MessageCardData[] = services.slice(0, 5).map(service => ({
          id: service.id,
          title: service.name,
          description: service.description || undefined,
          estimatedDays: service.estimatedDays || undefined,
          action: {
            type: 'select_service',
            label: 'Solicitar',
            serviceId: service.id
          }
        }));

        return {
          response: `📂 Serviços do departamento **${department.name}**:`,
          messageType: 'card',
          metadata: { cards }
        };
      }
    }

    // Step 2: Seleção do serviço específico
    if (flowStep === 2) {
      // Tenta encontrar o serviço selecionado
      const services = flowData.services || [];
      let selectedService = services.find((s: any) =>
        s.name.toLowerCase().includes(normalized) || s.id === message
      );

      // Se não encontrou, busca no banco
      if (!selectedService) {
        selectedService = await this.integrationService.getService(message);
      }

      if (!selectedService) {
        return {
          response: '❌ Não identifiquei qual serviço você deseja.\n\nClique em "Solicitar" em um dos cards acima.',
          messageType: 'interactive',
          metadata: {
            quickReplies: ['🔍 Nova busca', '🏠 Menu']
          }
        };
      }

      // Avança para o formulário
      await this.adapter.updateBotFlow(conversationId, FlowType.SOLICITAR_SERVICO, 3, {
        ...flowData,
        selectedServiceId: selectedService.id,
        selectedServiceName: selectedService.name,
        formData: {}
      });

      return {
        response: `📋 **${selectedService.name}**\n\n${selectedService.description || ''}\n\n⏱️ Prazo estimado: ${selectedService.estimatedDays || 'N/A'} dias\n\nPara continuar, preciso de algumas informações. Digite "OK" para começar ou "Voltar" para escolher outro serviço.`,
        messageType: 'interactive',
        metadata: {
          quickReplies: ['✅ OK, continuar', '◀️ Voltar']
        }
      };
    }

    // Step 3: Confirmação para iniciar formulário
    if (flowStep === 3) {
      if (normalized.includes('voltar')) {
        await this.adapter.updateBotFlow(conversationId, FlowType.SOLICITAR_SERVICO, 0, {});
        return this.startSolicitarServicoFlow(citizenId, conversationId);
      }

      if (normalized.includes('ok') || normalized.includes('continuar')) {
        await this.adapter.updateBotFlow(conversationId, FlowType.SOLICITAR_SERVICO, 4, flowData);

        return {
          response: '📝 **Formulário de Solicitação**\n\n1️⃣ Descreva detalhadamente o que você precisa:',
          messageType: 'text',
          metadata: {}
        };
      }
    }

    // Step 4: Coleta de descrição
    if (flowStep === 4) {
      await this.adapter.updateBotFlow(conversationId, FlowType.SOLICITAR_SERVICO, 5, {
        ...flowData,
        formData: {
          ...flowData.formData,
          description: message
        }
      });

      return {
        response: '📍 2️⃣ Informe o endereço ou localização (se aplicável):',
        messageType: 'text',
        metadata: {}
      };
    }

    // Step 5: Coleta de localização
    if (flowStep === 5) {
      await this.adapter.updateBotFlow(conversationId, FlowType.SOLICITAR_SERVICO, 6, {
        ...flowData,
        formData: {
          ...flowData.formData,
          location: message
        }
      });

      return {
        response: '📎 3️⃣ Deseja anexar algum documento? Digite "Sim" ou "Não":',
        messageType: 'interactive',
        metadata: {
          quickReplies: ['✅ Sim', '❌ Não']
        }
      };
    }

    // Step 6: Pergunta sobre documentos
    if (flowStep === 6) {
      if (normalized.includes('sim')) {
        await this.adapter.updateBotFlow(conversationId, FlowType.SOLICITAR_SERVICO, 7, flowData);

        return {
          response: '📎 Envie o(s) arquivo(s) agora.\n\nQuando terminar, digite "Concluir".',
          messageType: 'text',
          metadata: {}
        };
      } else {
        // Pula para confirmação final
        return this.finalizeSolicitarServicoFlow(citizenId, conversationId, flowData);
      }
    }

    // Step 7: Upload de documentos
    if (flowStep === 7) {
      if (normalized.includes('concluir')) {
        return this.finalizeSolicitarServicoFlow(citizenId, conversationId, flowData);
      }

      // Aguarda upload
      return {
        response: '✅ Arquivo recebido. Envie mais arquivos ou digite "Concluir" para finalizar.',
        messageType: 'text',
        metadata: {}
      };
    }

    return this.showMainMenu(citizenId, conversationId);
  }

  /**
   * Finaliza o fluxo de solicitar serviço criando o protocolo REAL
   */
  private async finalizeSolicitarServicoFlow(
    citizenId: string,
    conversationId: string,
    flowData: any
  ): Promise<BotResponse> {
    try {
      // 🔥 CRIA PROTOCOLO REAL VIA INTEGRATION SERVICE
      const protocol = await this.integrationService.createProtocol(citizenId, {
        serviceId: flowData.selectedServiceId,
        formData: flowData.formData,
        files: flowData.files || []
      });

      // Reseta o fluxo
      await this.adapter.updateBotFlow(conversationId, null, 0, {});

      return {
        response: `✅ **Protocolo criado com sucesso!**\n\n📋 Número: **${protocol.protocolNumber}**\n🏢 Serviço: ${flowData.selectedServiceName}\n📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n⏱️ Prazo: ${protocol.service.estimatedDays || 'N/A'} dias\n\nVocê pode acompanhar o andamento pelo menu "Consultar Protocolo".`,
        messageType: 'card',
        metadata: {
          cards: [{
            id: protocol.id,
            title: `Protocolo ${protocol.protocolNumber}`,
            description: flowData.selectedServiceName,
            status: protocol.status,
            action: {
              type: 'open_protocol',
              label: 'Ver Detalhes',
              protocolId: protocol.id
            }
          }],
          quickReplies: ['🔍 Consultar Protocolos', '🏠 Menu Principal']
        }
      };
    } catch (error) {
      console.error('[ConversationFlowManager] Erro ao criar protocolo:', error);

      return {
        response: '❌ Erro ao criar o protocolo. Por favor, tente novamente mais tarde.',
        messageType: 'text',
        metadata: {
          quickReplies: ['🔄 Tentar novamente', '🏠 Menu Principal']
        }
      };
    }
  }

  // ============================================
  // FLUXO 2: CONSULTAR PROTOCOLO (100% INTEGRADO)
  // ============================================

  private async startConsultarProtocoloFlow(citizenId: string, conversationId: string): Promise<BotResponse> {
    await this.adapter.updateBotFlow(conversationId, FlowType.CONSULTAR_PROTOCOLO, 0, {});

    // 🔥 BUSCA PROTOCOLOS REAIS
    const protocols = await this.integrationService.getRecentProtocols(citizenId, 5);

    if (protocols.length === 0) {
      return {
        response: '📋 Você ainda não possui protocolos registrados.\n\nQue tal solicitar um serviço?',
        messageType: 'interactive',
        metadata: {
          quickReplies: ['📋 Solicitar Serviço', '🏠 Menu Principal']
        }
      };
    }

    const cards: MessageCardData[] = protocols.map(protocol => ({
      id: protocol.id,
      title: `Protocolo ${protocol.protocolNumber}`,
      description: protocol.service.name,
      department: protocol.department?.name,
      status: protocol.status,
      date: new Date(protocol.createdAt).toLocaleDateString('pt-BR'),
      action: {
        type: 'open_protocol',
        label: 'Ver detalhes',
        protocolId: protocol.id
      }
    }));

    return {
      response: '🔍 **Seus Protocolos Recentes**\n\nClique para ver os detalhes ou digite o número do protocolo:',
      messageType: 'card',
      metadata: {
        cards,
        quickReplies: ['🔎 Buscar por número', '🏠 Menu']
      }
    };
  }

  private async processConsultarProtocoloFlow(
    flowStep: number,
    message: string,
    flowData: any,
    citizenId: string,
    conversationId: string
  ): Promise<BotResponse> {
    const normalized = message.toLowerCase().trim();

    // Se mencionou "buscar"
    if (normalized.includes('buscar')) {
      await this.adapter.updateBotFlow(conversationId, FlowType.CONSULTAR_PROTOCOLO, 1, {});
      return {
        response: '🔎 Digite o número do protocolo (ex: 2026000001):',
        messageType: 'text',
        metadata: {}
      };
    }

    // Step 1: Busca por número
    if (flowStep === 1 || /^\d+$/.test(message)) {
      // 🔥 BUSCA REAL POR NÚMERO
      const protocols = await this.integrationService.getProtocolsByNumber(citizenId, message);

      if (protocols.length === 0) {
        return {
          response: '❌ Nenhum protocolo encontrado com esse número.\n\nVerifique se digitou corretamente.',
          messageType: 'interactive',
          metadata: {
            quickReplies: ['🔎 Buscar novamente', '🏠 Menu']
          }
        };
      }

      const protocol = protocols[0];

      // Reseta o fluxo
      await this.adapter.updateBotFlow(conversationId, null, 0, {});

      return {
        response: `📋 **Protocolo ${protocol.protocolNumber}**\n\n🏢 Serviço: ${protocol.service.name}\n🏛️ Departamento: ${protocol.department?.name || 'N/A'}\n📊 Status: ${this.formatStatus(protocol.status)}\n📅 Aberto em: ${new Date(protocol.createdAt).toLocaleDateString('pt-BR')}\n⏱️ Prazo: ${protocol.service.estimatedDays || 'N/A'} dias`,
        messageType: 'card',
        metadata: {
          cards: [{
            id: protocol.id,
            title: `Protocolo ${protocol.protocolNumber}`,
            description: protocol.service.name,
            status: protocol.status,
            department: protocol.department?.name,
            action: {
              type: 'open_protocol',
              label: 'Ver Timeline',
              protocolId: protocol.id
            }
          }],
          quickReplies: ['📋 Meus Protocolos', '🏠 Menu Principal']
        }
      };
    }

    return this.showMainMenu(citizenId, conversationId);
  }

  // ============================================
  // FLUXO 3: ENVIAR DOCUMENTOS (100% INTEGRADO)
  // ============================================

  private async startEnviarDocumentosFlow(citizenId: string, conversationId: string): Promise<BotResponse> {
    await this.adapter.updateBotFlow(conversationId, FlowType.ENVIAR_DOCUMENTOS, 0, {});

    // 🔥 BUSCA PROTOCOLOS REAIS QUE PODEM RECEBER DOCUMENTOS
    const protocols = await this.integrationService.getRecentProtocols(citizenId, 10);
    const activeProtocols = protocols.filter(p =>
      p.status !== 'COMPLETED' && p.status !== 'CANCELLED'
    );

    if (activeProtocols.length === 0) {
      return {
        response: '📄 Você não possui protocolos ativos que possam receber documentos.',
        messageType: 'interactive',
        metadata: {
          quickReplies: ['📋 Solicitar Serviço', '🏠 Menu']
        }
      };
    }

    const cards: MessageCardData[] = activeProtocols.slice(0, 5).map(protocol => ({
      id: protocol.id,
      title: `Protocolo ${protocol.protocolNumber}`,
      description: protocol.service.name,
      status: protocol.status,
      action: {
        type: 'select_protocol',
        label: 'Enviar para este',
        protocolId: protocol.id
      }
    }));

    return {
      response: '📄 **Enviar Documentos**\n\nEscolha o protocolo para anexar documentos:',
      messageType: 'card',
      metadata: { cards }
    };
  }

  private async processEnviarDocumentosFlow(
    flowStep: number,
    message: string,
    flowData: any,
    citizenId: string,
    conversationId: string
  ): Promise<BotResponse> {
    // Step 0: Seleção do protocolo
    if (flowStep === 0) {
      // 🔥 BUSCA PROTOCOLO REAL
      const protocols = await this.integrationService.getRecentProtocols(citizenId, 10);
      const protocol = protocols.find(p =>
        p.protocolNumber.includes(message) || p.id === message
      );

      if (!protocol) {
        return {
          response: '❌ Protocolo não encontrado. Clique em um dos cards acima.',
          messageType: 'text',
          metadata: {}
        };
      }

      await this.adapter.updateBotFlow(conversationId, FlowType.ENVIAR_DOCUMENTOS, 1, {
        protocolId: protocol.id,
        protocolNumber: protocol.protocolNumber
      });

      return {
        response: `📎 **Protocolo ${protocol.protocolNumber}**\n\nEnvie os arquivos agora.\n\nQuando terminar, digite "Concluir".`,
        messageType: 'text',
        metadata: {}
      };
    }

    // Step 1: Upload de documentos
    if (flowStep === 1) {
      if (message.toLowerCase().includes('concluir')) {
        const filesCount = flowData.files?.length || 0;

        if (filesCount === 0) {
          return {
            response: '❌ Nenhum arquivo foi enviado. Envie pelo menos um arquivo ou digite "Cancelar".',
            messageType: 'interactive',
            metadata: {
              quickReplies: ['❌ Cancelar']
            }
          };
        }

        // 🔥 DOCUMENTOS JÁ FORAM ADICIONADOS VIA API DE UPLOAD (implementado no frontend)

        // Reseta o fluxo
        await this.adapter.updateBotFlow(conversationId, null, 0, {});

        return {
          response: `✅ **${filesCount} documento(s) enviado(s) com sucesso!**\n\n📋 Protocolo: ${flowData.protocolNumber}\n\nOs documentos serão analisados pela equipe responsável.`,
          messageType: 'text',
          metadata: {
            quickReplies: ['🔍 Ver Protocolo', '🏠 Menu Principal']
          }
        };
      }

      return {
        response: '✅ Arquivo recebido. Envie mais arquivos ou digite "Concluir".',
        messageType: 'text',
        metadata: {}
      };
    }

    return this.showMainMenu(citizenId, conversationId);
  }

  // ============================================
  // FLUXO 4: ATUALIZAR PERFIL (100% INTEGRADO)
  // ============================================

  private async startAtualizarPerfilFlow(citizenId: string, conversationId: string): Promise<BotResponse> {
    await this.adapter.updateBotFlow(conversationId, FlowType.ATUALIZAR_PERFIL, 0, {});

    // 🔥 BUSCA DADOS REAIS DO CIDADÃO
    const citizen = await this.integrationService.getCitizen(citizenId);

    if (!citizen) {
      return {
        response: '❌ Erro ao carregar seus dados.',
        messageType: 'text',
        metadata: {
          quickReplies: ['🏠 Menu']
        }
      };
    }

    return {
      response: `👤 **Seu Perfil**\n\n📛 Nome: ${citizen.name}\n📧 Email: ${citizen.email}\n📱 Telefone: ${citizen.phone || 'Não informado'}\n\nO que deseja atualizar?`,
      messageType: 'interactive',
      metadata: {
        quickReplies: [
          '📱 Telefone',
          '📧 Email',
          '🏠 Menu'
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
    const normalized = message.toLowerCase().trim();

    // Step 0: Escolha do campo
    if (flowStep === 0) {
      if (normalized.includes('telefone')) {
        await this.adapter.updateBotFlow(conversationId, FlowType.ATUALIZAR_PERFIL, 1, { field: 'phone' });
        return {
          response: '📱 Digite seu novo telefone (com DDD):',
          messageType: 'text',
          metadata: {}
        };
      } else if (normalized.includes('email')) {
        await this.adapter.updateBotFlow(conversationId, FlowType.ATUALIZAR_PERFIL, 1, { field: 'email' });
        return {
          response: '📧 Digite seu novo email:',
          messageType: 'text',
          metadata: {}
        };
      }
    }

    // Step 1: Coleta do novo valor
    if (flowStep === 1) {
      const field = flowData.field;
      const newValue = message.trim();

      // Validação básica
      if (field === 'email' && !newValue.includes('@')) {
        return {
          response: '❌ Email inválido. Digite um email válido:',
          messageType: 'text',
          metadata: {}
        };
      }

      if (field === 'phone' && !/^\d{10,11}$/.test(newValue.replace(/\D/g, ''))) {
        return {
          response: '❌ Telefone inválido. Digite com DDD (ex: 11999999999):',
          messageType: 'text',
          metadata: {}
        };
      }

      await this.adapter.updateBotFlow(conversationId, FlowType.ATUALIZAR_PERFIL, 2, {
        ...flowData,
        newValue
      });

      return {
        response: `✅ Confirma a atualização?\n\n${field === 'phone' ? '📱 Telefone' : '📧 Email'}: **${newValue}**`,
        messageType: 'interactive',
        metadata: {
          quickReplies: ['✅ Confirmar', '❌ Cancelar']
        }
      };
    }

    // Step 2: Confirmação e atualização REAL
    if (flowStep === 2) {
      if (normalized.includes('confirmar')) {
        try {
          // 🔥 ATUALIZA DADOS REAIS DO CIDADÃO
          const updateData: any = {};
          if (flowData.field === 'phone') {
            updateData.phone = flowData.newValue;
          } else if (flowData.field === 'email') {
            updateData.email = flowData.newValue;
          }

          await this.integrationService.updateCitizenProfile(citizenId, updateData);

          // Reseta o fluxo
          await this.adapter.updateBotFlow(conversationId, null, 0, {});

          return {
            response: `✅ **Perfil atualizado com sucesso!**\n\n${flowData.field === 'phone' ? '📱 Novo telefone' : '📧 Novo email'}: ${flowData.newValue}`,
            messageType: 'text',
            metadata: {
              quickReplies: ['👤 Ver Perfil', '🏠 Menu Principal']
            }
          };
        } catch (error) {
          console.error('[ConversationFlowManager] Erro ao atualizar perfil:', error);

          return {
            response: '❌ Erro ao atualizar. Tente novamente mais tarde.',
            messageType: 'text',
            metadata: {
              quickReplies: ['🔄 Tentar novamente', '🏠 Menu']
            }
          };
        }
      } else {
        // Cancelou
        await this.adapter.updateBotFlow(conversationId, null, 0, {});
        return {
          response: '❌ Atualização cancelada.',
          messageType: 'text',
          metadata: {
            quickReplies: ['👤 Atualizar Perfil', '🏠 Menu']
          }
        };
      }
    }

    return this.showMainMenu(citizenId, conversationId);
  }

  // ============================================
  // FLUXO 5: OUTRAS DÚVIDAS (COM OLLAMA)
  // ============================================

  private async startOutrasDuvidasFlow(citizenId: string, conversationId: string): Promise<BotResponse> {
    await this.adapter.updateBotFlow(conversationId, FlowType.OUTRAS_DUVIDAS, 0, {});

    return {
      response: '❓ **Outras Dúvidas**\n\nFaça sua pergunta e vou tentar ajudar!\n\nExemplos:\n• Como funciona o processo de alvará?\n• Quais documentos preciso para certidão?\n• Horário de atendimento da prefeitura',
      messageType: 'text',
      metadata: {
        quickReplies: ['🏠 Voltar ao Menu']
      }
    };
  }

  private async processOutrasDuvidasFlow(
    flowStep: number,
    message: string,
    flowData: any,
    citizenId: string,
    conversationId: string
  ): Promise<BotResponse> {
    // Usa Ollama para responder
    try {
      const response = await this.ollama.chat(message, flowData.history || []);

      // Atualiza histórico
      const history = [
        ...(flowData.history || []),
        { role: 'user', content: message },
        { role: 'assistant', content: response }
      ].slice(-10); // Mantém últimas 10 mensagens

      await this.adapter.updateBotFlow(conversationId, FlowType.OUTRAS_DUVIDAS, 0, {
        ...flowData,
        history
      });

      return {
        response: response,
        messageType: 'text',
        metadata: {
          quickReplies: ['❓ Outra pergunta', '🏠 Menu Principal']
        }
      };
    } catch (error) {
      console.error('[ConversationFlowManager] Erro no Ollama:', error);

      return {
        response: '❌ Desculpe, não consegui processar sua pergunta no momento.\n\nTente reformular ou escolha outra opção.',
        messageType: 'interactive',
        metadata: {
          quickReplies: ['🔄 Tentar novamente', '🏠 Menu']
        }
      };
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'PENDING_REVIEW': '⏳ Aguardando Análise',
      'IN_ANALYSIS': '🔍 Em Análise',
      'APPROVED': '✅ Aprovado',
      'REJECTED': '❌ Rejeitado',
      'IN_PROGRESS': '⚙️ Em Andamento',
      'COMPLETED': '✅ Concluído',
      'CANCELLED': '🚫 Cancelado'
    };
    return statusMap[status] || status;
  }
}

export default ConversationFlowManager;
