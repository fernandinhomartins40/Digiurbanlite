import { prisma } from '../../lib/prisma';
import { BotResponse, FlowStep, FlowDefinition, FlowStepType } from './types';

/**
 * FlowManager - Gerencia fluxos conversacionais multi-step
 *
 * Responsável por:
 * - Iniciar novos fluxos
 * - Navegar entre etapas
 * - Validar dados de cada etapa
 * - Persistir progresso no banco
 * - Completar ou cancelar fluxos
 */
export class FlowManager {
  private static instance: FlowManager;
  private flows: Map<string, FlowDefinition> = new Map();

  private constructor() {
    this.registerDefaultFlows();
  }

  public static getInstance(): FlowManager {
    if (!FlowManager.instance) {
      FlowManager.instance = new FlowManager();
    }
    return FlowManager.instance;
  }

  /**
   * Registra os fluxos padrão do sistema
   *
   * NOTA: Fluxos AGENDAR_CONSULTA e SOLICITAR_SERVICO foram REMOVIDOS
   * Agora usamos fluxo UNIVERSAL baseado em formSchema (startDynamicServiceFlow)
   */
  private registerDefaultFlows(): void {
    // ========================================================================
    // FLUXOS HARDCODED REMOVIDOS - Substituídos por fluxo dinâmico universal
    // ========================================================================
    //
    // Os fluxos AGENDAR_CONSULTA e SOLICITAR_SERVICO foram removidos porque:
    // 1. Não respeitavam o formSchema real dos serviços no banco de dados
    // 2. Admin pode criar novos serviços que não eram reconhecidos
    // 3. Pediam dados desnecessários que não estavam no formSchema
    // 4. Não pré-preenchiam campos citizen_* automaticamente
    //
    // SUBSTITUIÇÃO: Agora usamos startDynamicServiceFlow() que:
    // - Lê formSchema do serviço do banco de dados
    // - Pré-preenche campos citizen_* automaticamente
    // - Adapta-se a novos serviços sem reprogramação
    // - Respeita exatamente os campos e documentos definidos pelo admin
    // ========================================================================

    // Fluxo: Enviar Documento
    this.registerFlow({
      name: 'ENVIAR_DOCUMENTO',
      steps: [
        {
          id: 'select_document_type',
          type: 'selection',
          message: 'Que tipo de documento você deseja enviar?',
          options: [
            { value: 'rg', label: 'RG - Identidade' },
            { value: 'cpf', label: 'CPF' },
            { value: 'comprovante_residencia', label: 'Comprovante de Residência' },
            { value: 'certidao_nascimento', label: 'Certidão de Nascimento' },
            { value: 'comprovante_renda', label: 'Comprovante de Renda' },
            { value: 'outro', label: 'Outro documento' },
          ],
          required: true,
          saveAs: 'documentType',
        },
        {
          id: 'upload_document',
          type: 'file_upload',
          message: 'Envie o documento:',
          required: true,
          saveAs: 'document',
          accept: 'image/*,.pdf',
          maxFiles: 1,
          maxSize: 10485760, // 10MB
        },
        {
          id: 'add_notes',
          type: 'text',
          message: 'Deseja adicionar alguma observação sobre o documento? (opcional)',
          required: false,
          saveAs: 'notes',
          validation: {
            maxLength: 200,
          },
        },
        {
          id: 'confirmation',
          type: 'confirmation',
          message: 'Confirme o envio do documento:',
          required: true,
        },
      ],
      onComplete: 'uploadCitizenDocument',
    });

    // Fluxo: Onboarding (Primeiro acesso)
    this.registerFlow({
      name: 'ONBOARDING',
      steps: [
        {
          id: 'welcome',
          type: 'info',
          message: '👋 Olá! Sou o DigiBot, seu assistente virtual da prefeitura.\n\nVou te ajudar com serviços municipais de forma rápida e fácil.',
          required: false,
        },
        {
          id: 'explain_features',
          type: 'info',
          message: 'Posso te ajudar com:\n• Agendar consultas\n• Solicitar serviços\n• Acompanhar protocolos\n• Enviar documentos\n• E muito mais!',
          required: false,
        },
        {
          id: 'verify_phone',
          type: 'phone',
          message: 'Para melhorar seu atendimento, confirme seu telefone:',
          required: false,
          saveAs: 'phone',
        },
        {
          id: 'verify_address',
          type: 'location',
          message: 'Qual seu endereço principal?',
          required: false,
          saveAs: 'address',
          allowCurrentLocation: true,
          allowManualAddress: true,
        },
        {
          id: 'ask_preferences',
          type: 'multiple_choice',
          message: 'Que tipos de serviços você mais utiliza?',
          options: [
            { value: 'saude', label: '🏥 Saúde' },
            { value: 'educacao', label: '📚 Educação' },
            { value: 'obras', label: '🏗️ Obras e Infraestrutura' },
            { value: 'meio_ambiente', label: '🌳 Meio Ambiente' },
            { value: 'transporte', label: '🚌 Transporte' },
            { value: 'assistencia_social', label: '🤝 Assistência Social' },
          ],
          required: false,
          saveAs: 'preferences',
        },
        {
          id: 'done',
          type: 'info',
          message: '✅ Pronto! Agora você está pronto para usar todos os serviços.\n\nO que você precisa hoje?',
          required: false,
        },
      ],
      onComplete: 'completeOnboarding',
    });
  }

  /**
   * Registra um novo fluxo
   */
  public registerFlow(flow: FlowDefinition): void {
    this.flows.set(flow.name, flow);
  }

  /**
   * Inicia um novo fluxo para um cidadão
   */
  public async startFlow(citizenId: string, flowName: string): Promise<BotResponse> {
    const flow = this.flows.get(flowName);
    if (!flow) {
      throw new Error(`Flow ${flowName} not found`);
    }

    // Busca ou cria conversação ativa
    let conversation = await prisma.botConversation.findFirst({
      where: {
        citizenId,
        isActive: true,
      },
    });

    if (!conversation) {
      conversation = await prisma.botConversation.create({
        data: {
          citizenId,
          currentFlow: flowName,
          flowStep: 0,
          flowData: {},
        },
      });
    } else {
      // Atualiza conversação existente
      conversation = await prisma.botConversation.update({
        where: { id: conversation.id },
        data: {
          currentFlow: flowName,
          flowStep: 0,
          flowData: {},
        },
      });
    }

    // Retorna primeira etapa
    return this.getStepResponse(conversation.id, flow, 0, {});
  }

  /**
   * Inicia um novo fluxo com dados pré-preenchidos (citizen_*)
   */
  private async startFlowWithPrefilledData(
    citizenId: string,
    flowName: string,
    prefilledData: Record<string, any>
  ): Promise<BotResponse> {
    const flow = this.flows.get(flowName);
    if (!flow) {
      throw new Error(`Flow ${flowName} not found`);
    }

    // Busca ou cria conversação ativa
    let conversation = await prisma.botConversation.findFirst({
      where: {
        citizenId,
        isActive: true,
      },
    });

    if (!conversation) {
      conversation = await prisma.botConversation.create({
        data: {
          citizenId,
          currentFlow: flowName,
          flowStep: 0,
          flowData: prefilledData, // NOVO: Inicializa com dados pré-preenchidos
        },
      });
    } else {
      // Atualiza conversação existente
      conversation = await prisma.botConversation.update({
        where: { id: conversation.id },
        data: {
          currentFlow: flowName,
          flowStep: 0,
          flowData: prefilledData, // NOVO: Inicializa com dados pré-preenchidos
        },
      });
    }

    console.log(`🔄 Fluxo iniciado com ${Object.keys(prefilledData).length} campos pré-preenchidos`);

    // Retorna primeira etapa (com dados pré-preenchidos)
    return this.getStepResponse(conversation.id, flow, 0, prefilledData);
  }

  /**
   * Processa a resposta do usuário e avança no fluxo
   */
  public async processFlowStep(
    citizenId: string,
    userInput: any
  ): Promise<BotResponse> {
    // Busca conversação ativa
    const conversation = await prisma.botConversation.findFirst({
      where: {
        citizenId,
        isActive: true,
        currentFlow: { not: null },
      },
    });

    if (!conversation || !conversation.currentFlow) {
      return {
        response: 'Não há fluxo ativo no momento.',
        messageType: 'text',
      };
    }

    const flow = this.flows.get(conversation.currentFlow);
    if (!flow) {
      return {
        response: 'Fluxo não encontrado.',
        messageType: 'text',
      };
    }

    const currentStep = flow.steps[conversation.flowStep];
    const flowData = (conversation.flowData as any) || {};

    // Valida entrada
    const validation = this.validateInput(currentStep, userInput);
    if (!validation.isValid) {
      return {
        response: validation.error || 'Entrada inválida. Por favor, tente novamente.',
        messageType: 'text',
        metadata: {
          ...this.getStepMetadata(currentStep, flowData),
          error: true,
        },
      };
    }

    // Salva dados da etapa
    if (currentStep.saveAs) {
      flowData[currentStep.saveAs] = userInput;
    }

    // Verifica se é a última etapa
    const isLastStep = conversation.flowStep >= flow.steps.length - 1;

    if (isLastStep) {
      // Completa o fluxo
      return this.completeFlow(conversation.id, flow, flowData);
    }

    // Avança para próxima etapa
    const nextStep = conversation.flowStep + 1;
    await prisma.botConversation.update({
      where: { id: conversation.id },
      data: {
        flowStep: nextStep,
        flowData: flowData,
      },
    });

    return this.getStepResponse(conversation.id, flow, nextStep, flowData);
  }

  /**
   * Valida entrada do usuário
   */
  private validateInput(step: FlowStep, input: any): { isValid: boolean; error?: string } {
    // Verifica obrigatoriedade
    if (step.required && (!input || input === '')) {
      return { isValid: false, error: 'Este campo é obrigatório.' };
    }

    if (!step.validation) {
      return { isValid: true };
    }

    // Validações específicas por tipo
    if (step.type === 'text') {
      if (step.validation.minLength && input.length < step.validation.minLength) {
        return {
          isValid: false,
          error: `Mínimo de ${step.validation.minLength} caracteres.`,
        };
      }
      if (step.validation.maxLength && input.length > step.validation.maxLength) {
        return {
          isValid: false,
          error: `Máximo de ${step.validation.maxLength} caracteres.`,
        };
      }
      if (step.validation.pattern && !new RegExp(step.validation.pattern).test(input)) {
        return { isValid: false, error: 'Formato inválido.' };
      }
    }

    if (step.type === 'phone') {
      const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
      if (!phoneRegex.test(input)) {
        return {
          isValid: false,
          error: 'Formato inválido. Use: (00) 00000-0000',
        };
      }
    }

    if (step.type === 'date') {
      const date = new Date(input);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (step.validation.minDate === 'today' && date < today) {
        return { isValid: false, error: 'Data não pode ser no passado.' };
      }
    }

    return { isValid: true };
  }

  /**
   * Gera resposta para uma etapa do fluxo
   */
  private getStepResponse(
    conversationId: string,
    flow: FlowDefinition,
    stepIndex: number,
    flowData: any
  ): BotResponse {
    const step = flow.steps[stepIndex];
    const totalSteps = flow.steps.filter(s => s.type !== 'info').length;
    const currentStepNumber = flow.steps.slice(0, stepIndex + 1).filter(s => s.type !== 'info').length;

    const response: BotResponse = {
      response: step.message,
      messageType: this.getMessageType(step.type) as any,
      metadata: {
        flowName: flow.name,
        stepId: step.id,
        stepIndex,
        totalSteps,
        currentStepNumber,
        progress: (currentStepNumber / totalSteps) * 100,
        ...this.getStepMetadata(step, flowData),
      },
    };

    return response;
  }

  /**
   * Obtém metadados específicos da etapa
   */
  private getStepMetadata(step: FlowStep, flowData: any): any {
    const metadata: any = {
      stepType: step.type,
      required: step.required,
    };

    if (step.type === 'selection' || step.type === 'searchable_select') {
      metadata.options = step.options;
      if (step.type === 'searchable_select') {
        metadata.placeholder = step.placeholder;
      }
    }

    if (step.type === 'multiple_choice') {
      metadata.options = step.options;
      metadata.multiSelect = true;
    }

    if (step.type === 'file_upload') {
      metadata.accept = step.accept;
      metadata.maxFiles = step.maxFiles;
      metadata.maxSize = step.maxSize;
    }

    if (step.type === 'location') {
      metadata.allowCurrentLocation = step.allowCurrentLocation;
      metadata.allowManualAddress = step.allowManualAddress;
      metadata.allowMapPicker = step.allowMapPicker;
    }

    if (step.type === 'confirmation') {
      metadata.confirmationData = flowData;
    }

    if (step.type === 'date' && step.validation) {
      metadata.minDate = step.validation.minDate;
      metadata.maxDate = step.validation.maxDate;
    }

    return metadata;
  }

  /**
   * Mapeia tipo de etapa para tipo de mensagem
   */
  private getMessageType(stepType: string): string {
    const typeMap: Record<string, string> = {
      selection: 'interactive',
      searchable_select: 'interactive',
      multiple_choice: 'interactive',
      text: 'form',
      phone: 'form',
      date: 'interactive',
      time: 'interactive',
      file_upload: 'interactive',
      location: 'interactive',
      confirmation: 'card',
      info: 'text',
    };

    return typeMap[stepType] || 'text';
  }

  /**
   * Completa um fluxo e executa a ação final
   */
  private async completeFlow(
    conversationId: string,
    flow: FlowDefinition,
    flowData: any
  ): Promise<BotResponse> {
    // Atualiza conversação
    await prisma.botConversation.update({
      where: { id: conversationId },
      data: {
        currentFlow: undefined,
        flowStep: 0,
        flowData: undefined,
      },
    });

    // Executa ação de conclusão
    const result = await this.executeFlowAction(flow.onComplete, flowData, conversationId);

    return result;
  }

  /**
   * Executa a ação final do fluxo
   */
  private async executeFlowAction(
    action: string,
    flowData: any,
    conversationId: string
  ): Promise<BotResponse> {
    // Busca conversação para obter citizenId
    const conversation = await prisma.botConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return {
        response: 'Erro ao processar solicitação.',
        messageType: 'text',
      };
    }

    switch (action) {
      case 'createAppointmentProtocol':
        return this.createAppointmentProtocol(conversation.citizenId, flowData);

      case 'createServiceProtocol':
        return this.createServiceProtocol(conversation.citizenId, flowData);

      case 'createDynamicServiceProtocol':
        // Buscar metadata do fluxo para obter serviceId
        const flow = this.flows.get(conversation.currentFlow || '');
        return this.createDynamicServiceProtocol(conversation.citizenId, flowData, flow?.metadata);

      case 'uploadCitizenDocument':
        return this.uploadCitizenDocument(conversation.citizenId, flowData);

      case 'completeOnboarding':
        return this.completeOnboarding(conversation.citizenId, flowData);

      default:
        return {
          response: '✅ Processo concluído com sucesso!',
          messageType: 'text',
        };
    }
  }

  /**
   * Cria protocolo de agendamento
   */
  private async createAppointmentProtocol(
    citizenId: string,
    flowData: any
  ): Promise<BotResponse> {
    // Busca serviço de agendamento
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        name: {
          contains: 'consulta',
          mode: 'insensitive',
        },
        isActive: true,
      },
      include: { department: true },
    });

    if (!service) {
      return {
        response: 'Serviço de agendamento não encontrado.',
        messageType: 'text',
      };
    }

    // Gerar número único de protocolo
    const protocolNumber = await this.generateProtocolNumber();

    // Cria protocolo
    const protocol = await prisma.protocolSimplified.create({
      // @ts-ignore - Prisma typing issue with customData
      data: {
        citizenId,
        serviceId: service.id,
        departmentId: service.departmentId,
        number: protocolNumber,
        title: 'Agendamento de Consulta',
        description: `Consulta - ${flowData.specialty} - ${flowData.appointmentDate} às ${flowData.appointmentTime}`,
        status: 'VINCULADO' as any,
        moduleType: 'SAUDE',
        priority: 3,
        customData: flowData,
      },
    });

    // Criar histórico
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId: protocol.id,
        action: 'Protocolo criado via DigiBot',
        comment: `Agendamento de ${flowData.specialty} para ${flowData.appointmentDate} às ${flowData.appointmentTime}`,
        userId: null
      }
    });

    return {
      response: `✅ Consulta agendada com sucesso!\n\nSeu protocolo é: #${protocol.number}`,
      messageType: 'card',
      metadata: {
        cards: [
          {
            id: protocol.id,
            title: `Protocolo #${protocol.number}`,
            description: `Consulta - ${flowData.specialty}`,
            department: service.department.name,
            date: `${flowData.appointmentDate} às ${flowData.appointmentTime}`,
            status: 'PENDENCIA',
            action: {
              type: 'open_protocol',
              label: 'Ver detalhes',
              protocolId: protocol.id,
            },
          },
        ],
        quickReplies: ['Ver meus protocolos', 'Solicitar outro serviço'],
      }
    };
  }

  /**
   * Cria protocolo de serviço
   */
  private async createServiceProtocol(
    citizenId: string,
    flowData: any
  ): Promise<BotResponse> {
    const service = await prisma.serviceSimplified.findUnique({
      where: { id: flowData.serviceId },
      include: { department: true },
    });

    if (!service) {
      return {
        response: 'Serviço não encontrado.',
        messageType: 'text',
      };
    }

    // Cria protocolo
    const protocol = await prisma.protocolSimplified.create({
      // @ts-ignore - Prisma typing issue with customData
      data: {
        citizenId,
        serviceId: service.id,
        departmentId: service.departmentId,
        title: service.name,
        description: flowData.description,
        status: 'PENDENCIA' as any,
        customData: {
          location: flowData.location,
          attachments: flowData.attachments || [],
        },
      },
    });

    return {
      response: `✅ Solicitação criada com sucesso!\n\nSeu protocolo é: #${protocol.number}\n\n⏱️ Prazo estimado: ${service.estimatedDays} dias úteis`,
      messageType: 'card',
      metadata: {
        cards: [
          {
            id: protocol.id,
            title: `Protocolo #${protocol.number}`,
            description: service.name,
            department: service.department.name,
            estimatedDays: service.estimatedDays || undefined,
            status: 'PENDENCIA',
            action: {
              type: 'open_protocol',
              label: 'Acompanhar protocolo',
              protocolId: protocol.id,
            },
          },
        ],
        quickReplies: ['Ver meus protocolos', 'Solicitar outro serviço'],
      }
    };
  }

  /**
   * Upload de documento do cidadão
   */
  private async uploadCitizenDocument(
    citizenId: string,
    flowData: any
  ): Promise<BotResponse> {
    // Cria registro de documento
    const document = await prisma.citizenDocument.create({
      data: {
        citizenId,
        documentType: flowData.documentType,
        fileName: flowData.document.fileName,
        filePath: flowData.document.fileUrl,
        fileSize: flowData.document.fileSize,
        mimeType: flowData.document.mimeType,
        status: 'PENDING',
        notes: flowData.notes,
      },
    });

    return {
      response: '✅ Documento enviado com sucesso!\n\nEle será analisado em breve e você receberá uma notificação.',
      messageType: 'card',
      metadata: {
        cards: [
          {
            id: document.id,
            title: flowData.documentType.replace(/_/g, ' ').toUpperCase(),
            description: 'Documento em análise',
            status: 'EM ANÁLISE',
          },
        ],
        quickReplies: ['Ver meus documentos', 'Enviar outro documento'],
      }
    };
  }

  /**
   * Completa onboarding
   */
  private async completeOnboarding(
    citizenId: string,
    flowData: any
  ): Promise<BotResponse> {
    // Atualiza dados do cidadão
    await prisma.citizen.update({
      where: { id: citizenId },
      data: {
        phone: flowData.phone || undefined,
        address: flowData.address || undefined,
      },
    });

    return {
      response: '🎉 Bem-vindo(a) ao DigiBot!\n\nAgora você pode aproveitar todos os nossos serviços.',
      messageType: 'text',
      metadata: {
        quickReplies: [
          'Agendar consulta',
          'Solicitar serviço',
          'Ver protocolos',
          'Enviar documento',
        ],
      }
    };
  }

  /**
   * Cancela fluxo atual
   */
  public async cancelFlow(citizenId: string): Promise<void> {
    await prisma.botConversation.updateMany({
      where: {
        citizenId,
        isActive: true,
        currentFlow: { not: null },
      },
      data: {
        currentFlow: undefined,
        flowStep: 0,
        flowData: undefined,
      },
    });
  }

  /**
   * Verifica se há fluxo ativo
   */
  public async hasActiveFlow(citizenId: string): Promise<boolean> {
    const conversation = await prisma.botConversation.findFirst({
      where: {
        citizenId,
        isActive: true,
        currentFlow: { not: null },
      },
    });

    return !!conversation;
  }

  /**
   * Obtém fluxo ativo
   */
  public async getActiveFlow(citizenId: string): Promise<string | null> {
    const conversation = await prisma.botConversation.findFirst({
      where: {
        citizenId,
        isActive: true,
        currentFlow: { not: null },
      },
    });

    return conversation?.currentFlow || null;
  }

  /**
   * ============================================================
   * NOVOS MÉTODOS: FLUXO DINÂMICO BASEADO EM formSchema
   * ============================================================
   */

  /**
   * Inicia fluxo dinâmico UNIVERSAL baseado no formSchema do serviço
   * PRÉ-PREENCHE campos citizen_* automaticamente
   */
  public async startDynamicServiceFlow(
    citizenId: string,
    serviceId: string
  ): Promise<BotResponse> {
    try {
      // 1. Buscar serviço com formSchema
      const service = await prisma.serviceSimplified.findUnique({
        where: { id: serviceId },
        include: { department: true }
      });

      if (!service) {
        return {
          response: 'Serviço não encontrado. Tente buscar novamente.',
          messageType: 'text',
          metadata: {
            quickReplies: ['Buscar serviços']
          }
        };
      }

      // 2. Buscar dados do cidadão para pré-preenchimento
      const citizen = await prisma.citizen.findUnique({
        where: { id: citizenId },
        select: {
          name: true,
          cpf: true,
          email: true,
          phone: true,
          phoneSecondary: true,
          birthDate: true,
          address: true,
          rg: true,
          motherName: true,
          maritalStatus: true,
          occupation: true
        }
      });

      if (!citizen) {
        return {
          response: 'Erro ao buscar seus dados. Por favor, atualize seu perfil.',
          messageType: 'text',
          metadata: {
            quickReplies: ['Atualizar perfil']
          }
        };
      }

      // 3. Separar campos: citizen_* (pré-preenchidos) vs customizados (perguntar)
      const prefilledData: Record<string, any> = {};
      const steps: FlowStep[] = [];

      const formFields = (service.formFieldsConfig as any[]) ||
                        (service.formSchema as any)?.fields ||
                        [];

      for (const field of formFields) {
        if (field.enabled === false) continue;

        // LÓGICA DE PRÉ-PREENCHIMENTO: campos citizen_*
        if (field.id.startsWith('citizen_')) {
          const citizenKey = field.id.replace('citizen_', '') as keyof typeof citizen;

          if (citizen[citizenKey] !== null && citizen[citizenKey] !== undefined) {
            prefilledData[field.id] = citizen[citizenKey];
            console.log(`✅ Pré-preenchido: ${field.id} = ${citizen[citizenKey]}`);
            continue; // NÃO perguntar este campo
          }
        }

        // Campos customizados: adicionar ao fluxo
        steps.push({
          id: field.id,
          type: this.mapFieldTypeToStepType(field.type),
          message: field.label || field.placeholder || field.id,
          required: field.required || false,
          saveAs: field.id,
          validation: {
            minLength: field.minLength,
            maxLength: field.maxLength,
            pattern: field.pattern,
            min: field.min,
            max: field.max
          },
          options: field.options?.map((opt: string) => ({
            value: opt,
            label: opt
          })),
          placeholder: field.placeholder
        });
      }

      // Adicionar etapa de descrição (sempre obrigatória)
      steps.push({
        id: 'description',
        type: 'text',
        message: `Descreva o motivo da solicitação de "${service.name}":`,
        required: true,
        saveAs: 'description',
        validation: {
          minLength: 10,
          maxLength: 500
        }
      });

      // Adicionar upload de documentos se necessário
      if (service.requiresDocuments && service.requiredDocuments) {
        const docs = service.requiredDocuments as any[];
        if (Array.isArray(docs) && docs.length > 0) {
          steps.push({
            id: 'upload_documents',
            type: 'file_upload',
            message: `Envie os seguintes documentos:\n${docs.map(d => `- ${d.name}`).join('\n')}`,
            required: docs.some(d => d.required),
            saveAs: 'documents',
            accept: 'image/*,.pdf',
            maxFiles: docs.length,
            maxSize: 10485760 // 10MB
          });
        }
      }

      // Adicionar confirmação final
      steps.push({
        id: 'confirmation',
        type: 'confirmation',
        message: `Revise sua solicitação de "${service.name}":`,
        required: true
      });

      // 4. Criar fluxo dinâmico com dados pré-preenchidos
      const flowDefinition: FlowDefinition = {
        name: `SERVICE_${serviceId}`,
        steps,
        onComplete: 'createDynamicServiceProtocol',
        metadata: {
          serviceId,
          serviceName: service.name,
          departmentId: service.departmentId,
          departmentName: service.department?.name,
          prefilledData // NOVO: Dados pré-preenchidos do cidadão
        }
      };

      // 5. Registrar fluxo dinâmico
      this.registerFlow(flowDefinition);

      // 6. Iniciar fluxo com dados pré-preenchidos
      return this.startFlowWithPrefilledData(citizenId, flowDefinition.name, prefilledData);

    } catch (error) {
      console.error('Erro ao criar fluxo dinâmico:', error);
      return {
        response: 'Erro ao iniciar solicitação. Tente novamente.',
        messageType: 'text',
        metadata: {
          quickReplies: ['Tentar novamente']
        }
      };
    }
  }

  /**
   * Mapeia tipo de campo do formSchema para tipo de etapa do fluxo
   */
  private mapFieldTypeToStepType(fieldType: string): FlowStepType {
    const mapping: Record<string, FlowStepType> = {
      'text': 'text',
      'textarea': 'text',
      'number': 'text',
      'email': 'text',
      'phone': 'phone',
      'date': 'date',
      'time': 'time',
      'select': 'selection',
      'radio': 'selection',
      'checkbox': 'multiple_choice',
      'file': 'file_upload',
      'location': 'location'
    };

    return mapping[fieldType] || 'text';
  }

  /**
   * Cria protocolo dinâmico baseado em formSchema
   * MESCLA dados pré-preenchidos + dados coletados
   */
  private async createDynamicServiceProtocol(
    citizenId: string,
    flowData: any,
    metadata?: any
  ): Promise<BotResponse> {
    try {
      const serviceId = metadata?.serviceId;
      if (!serviceId) {
        throw new Error('serviceId não encontrado no metadata');
      }

      const service = await prisma.serviceSimplified.findUnique({
        where: { id: serviceId },
        include: { department: true }
      });

      if (!service) {
        throw new Error('Serviço não encontrado');
      }

      // NOVO: Mesclar dados pré-preenchidos com dados coletados
      const prefilledData = metadata?.prefilledData || {};
      const completeData = {
        ...prefilledData, // Dados citizen_* pré-preenchidos
        ...flowData // Dados coletados no fluxo
      };

      console.log(`📊 Protocolo com ${Object.keys(prefilledData).length} campos pré-preenchidos + ${Object.keys(flowData).length} coletados`);

      // Gerar número único de protocolo
      const protocolNumber = await this.generateProtocolNumber();

      // Criar protocolo
      const protocol = await prisma.protocolSimplified.create({
        data: {
          citizenId,
          serviceId: service.id,
          departmentId: service.departmentId,
          number: protocolNumber,
          title: service.name,
          description: flowData.description || `Solicitação de ${service.name}`,
          customData: completeData, // NOVO: Dados completos (pré-preenchidos + coletados)
          status: 'VINCULADO' as any,
          moduleType: service.moduleType || 'GERAL',
          priority: 3
        }
      });

      // Upload de documentos se houver
      if (flowData.documents && Array.isArray(flowData.documents) && flowData.documents.length > 0) {
        for (const file of flowData.documents) {
          await prisma.protocolDocument.create({
            data: {
              protocolId: protocol.id,
              documentType: file.documentType || 'ANEXO',
              fileName: file.filename || file.name,
              fileUrl: file.path || file.url,
              fileSize: file.size,
              mimeType: file.mimetype || file.type,
              status: 'UPLOADED' as any,
              uploadedAt: new Date(),
              isRequired: true
            }
          });
        }
      }

      // Criar histórico
      await prisma.protocolHistorySimplified.create({
        data: {
          protocolId: protocol.id,
          action: 'Protocolo criado via DigiBot',
          comment: `Solicitação de ${service.name} - ${flowData.description || 'Via chat'}`,
          userId: null // Sistema
        }
      });

      console.log(`✅ Protocolo ${protocolNumber} criado com sucesso via fluxo dinâmico`);

      return {
        response: `✅ Solicitação de "${service.name}" enviada com sucesso!\n\n📋 Protocolo: #${protocolNumber}\n🏛️ Departamento: ${service.department?.name || 'N/A'}\n⏱️ Prazo estimado: ${service.estimatedDays || 'A definir'} dias\n\nVocê pode acompanhar pelo menu "Meus Protocolos".`,
        messageType: 'text',
        metadata: {
          protocolId: protocol.id,
          protocolNumber: protocolNumber,
          serviceId: service.id
        }
      };

    } catch (error) {
      console.error('Erro ao criar protocolo dinâmico:', error);
      return {
        response: 'Erro ao processar solicitação. Por favor, tente novamente.',
        messageType: 'text',
        metadata: {
          quickReplies: ['Tentar novamente']
        }
      };
    }
  }

  /**
   * Gera número único de protocolo no formato YYYY-NNNNNNN
   */
  private async generateProtocolNumber(): Promise<string> {
    const year = new Date().getFullYear();

    // Contar protocolos do ano atual
    const count = await prisma.protocolSimplified.count({
      where: {
        number: {
          startsWith: `${year}-`
        }
      }
    });

    const nextNumber = (count + 1).toString().padStart(7, '0');
    return `${year}-${nextNumber}`;
  }
}

export default FlowManager;
