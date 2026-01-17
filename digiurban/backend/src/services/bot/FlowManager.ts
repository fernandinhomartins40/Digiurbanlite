import { prisma } from '../../lib/prisma';
import { BotResponse, FlowStep, FlowDefinition } from './types';

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
   */
  private registerDefaultFlows(): void {
    // Fluxo: Agendar Consulta
    this.registerFlow({
      name: 'AGENDAR_CONSULTA',
      steps: [
        {
          id: 'select_specialty',
          type: 'selection',
          message: 'Qual tipo de consulta você precisa?',
          options: [
            { value: 'clinico_geral', label: 'Clínico Geral' },
            { value: 'pediatria', label: 'Pediatria' },
            { value: 'ginecologia', label: 'Ginecologia' },
            { value: 'cardiologia', label: 'Cardiologia' },
            { value: 'dermatologia', label: 'Dermatologia' },
            { value: 'oftalmologia', label: 'Oftalmologia' },
          ],
          required: true,
          saveAs: 'specialty',
        },
        {
          id: 'select_health_unit',
          type: 'selection',
          message: 'Qual unidade de saúde você prefere?',
          options: [], // Será populado dinamicamente
          required: true,
          saveAs: 'healthUnitId',
          dynamicOptions: true,
        },
        {
          id: 'select_date',
          type: 'date',
          message: 'Escolha uma data disponível:',
          required: true,
          saveAs: 'appointmentDate',
          validation: {
            minDate: 'today',
            maxDate: '+30days',
          },
        },
        {
          id: 'select_time',
          type: 'time',
          message: 'Escolha o horário:',
          required: true,
          saveAs: 'appointmentTime',
          dynamicOptions: true, // Horários disponíveis baseados na data
        },
        {
          id: 'confirmation',
          type: 'confirmation',
          message: 'Confirme os dados da sua consulta:',
          required: true,
        },
      ],
      onComplete: 'createAppointmentProtocol',
    });

    // Fluxo: Solicitar Serviço
    this.registerFlow({
      name: 'SOLICITAR_SERVICO',
      steps: [
        {
          id: 'search_service',
          type: 'searchable_select',
          message: 'Qual serviço você precisa?',
          required: true,
          saveAs: 'serviceId',
          placeholder: 'Digite para buscar...',
        },
        {
          id: 'select_location',
          type: 'location',
          message: 'Onde está localizado o problema ou onde deseja o serviço?',
          required: true,
          saveAs: 'location',
          allowCurrentLocation: true,
          allowManualAddress: true,
          allowMapPicker: true,
        },
        {
          id: 'describe_issue',
          type: 'text',
          message: 'Descreva brevemente o motivo da solicitação:',
          required: true,
          saveAs: 'description',
          validation: {
            minLength: 10,
            maxLength: 500,
          },
        },
        {
          id: 'upload_photos',
          type: 'file_upload',
          message: 'Você pode enviar fotos da situação? Isso acelera a análise.',
          required: false,
          saveAs: 'attachments',
          accept: 'image/*',
          maxFiles: 3,
          maxSize: 5242880, // 5MB
        },
        {
          id: 'confirmation',
          type: 'confirmation',
          message: 'Revise sua solicitação antes de enviar:',
          required: true,
        },
      ],
      onComplete: 'createServiceProtocol',
    });

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

    // Cria protocolo
    const protocol = await prisma.protocolSimplified.create({
      // @ts-ignore - Prisma typing issue with customData
      data: {
        citizenId,
        serviceId: service.id,
        departmentId: service.departmentId,
        title: 'Agendamento de Consulta',
        description: `Consulta - ${flowData.specialty} - ${flowData.appointmentDate} às ${flowData.appointmentTime}`,
        status: 'PENDENCIA' as any,
        customData: flowData,
      },
    });

    return {
      response: `✅ Consulta agendada com sucesso!\n\nSeu protocolo é: #${protocol.number}`,
      messageType: 'card',
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
      quickReplies: ['Ver meus protocolos', 'Solicitar outro serviço', 'Menu principal'],
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
      quickReplies: ['Ver meus protocolos', 'Solicitar outro serviço', 'Falar com atendente'],
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
      cards: [
        {
          id: document.id,
          title: flowData.documentType.replace(/_/g, ' ').toUpperCase(),
          description: 'Documento em análise',
          status: 'EM ANÁLISE',
        },
      ],
      quickReplies: ['Ver meus documentos', 'Enviar outro documento', 'Menu principal'],
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
      quickReplies: [
        'Agendar consulta',
        'Solicitar serviço',
        'Ver protocolos',
        'Enviar documento',
      ],
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
}

export default FlowManager;
